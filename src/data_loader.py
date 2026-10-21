"""src/data_loader.py — Downloads and caches stock price data."""

import hashlib
import numpy as np
import pandas as pd
import yfinance as yf
from pathlib import Path

CACHE_DIR = Path(__file__).parent.parent / "data"


class DataLoader:
    def __init__(self, cache_dir=CACHE_DIR):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def get_prices(self, tickers, start, end, use_cache=True):
        cache_path = self._cache_path(tickers, start, end)
        if use_cache and cache_path.exists():
            prices = pd.read_parquet(cache_path)
            # Check if we need to append live data (today)
            if pd.to_datetime(end) >= pd.to_datetime("today").normalize():
                live = self.get_live_prices(tickers)
                if not live.empty:
                    prices = pd.concat([prices, live]).drop_duplicates()
            return prices

        frames = {}
        for ticker in tickers:
            df = yf.download(ticker, start=start, end=end,
                             auto_adjust=True, progress=False)
            if df.empty or "Close" not in df.columns or (isinstance(df.columns, pd.MultiIndex) and "Close" not in df.columns.get_level_values(0)):
                # Try one more time with history to be sure
                t = yf.Ticker(ticker)
                h = t.history(period="1d")
                if h.empty:
                    raise ValueError(f"Ticker '{ticker}' is invalid or has no data in the selected range.")
                df = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            frames[ticker] = df["Close"]

        prices = pd.DataFrame(frames)
        prices.index = pd.to_datetime(prices.index)
        prices.dropna(how="all", inplace=True)
        
        # Append live data if needed
        if pd.to_datetime(end) >= pd.to_datetime("today").normalize():
            live = self.get_live_prices(tickers)
            if not live.empty:
                prices = pd.concat([prices, live]).drop_duplicates()

        if use_cache:
            prices.to_parquet(cache_path)
        return prices

    def get_live_prices(self, tickers):
        """Fetches the most recent intraday price for given tickers."""
        live_frames = {}
        for ticker in tickers:
            try:
                t = yf.Ticker(ticker)
                # history(period='1d') usually gives the latest available bar
                df = t.history(period="1d")
                if not df.empty:
                    live_frames[ticker] = df["Close"].iloc[-1]
            except Exception:
                continue
        
        if not live_frames:
            return pd.DataFrame()
            
        df_live = pd.DataFrame([live_frames])
        df_live.index = [pd.to_datetime("today").normalize()] # simplified for daily returns
        return df_live

    def get_info(self, tickers):
        info = {}
        for ticker in tickers:
            # Search first: it needs no crumb, so it works from cloud hosts where
            # Ticker.info gets HTTP 401 "Invalid Crumb" and comes back empty
            i = self._search_info(ticker) or self._ticker_info(ticker)
            info[ticker] = {
                "sector": i.get("sector") or "Unknown",
                "industry": i.get("industry") or "Unknown",
                "name": i.get("name") or ticker,
            }
        return info

    def _search_info(self, ticker):
        try:
            quotes = yf.Search(ticker, max_results=5).quotes
        except Exception:
            return {}
        q = next((q for q in quotes if q.get("symbol", "").upper() == ticker.upper()), None)
        if q is None:
            return {}
        return {"sector": q.get("sector"), "industry": q.get("industry"),
                "name": q.get("longname") or q.get("shortname")}

    def _ticker_info(self, ticker):
        try:
            i = yf.Ticker(ticker).info or {}
        except Exception:
            return {}
        return {"sector": i.get("sector"), "industry": i.get("industry"),
                "name": i.get("longName") or i.get("shortName")}

    def get_returns(self, tickers, start, end, use_cache=True):
        prices = self.get_prices(tickers, start, end, use_cache)
        return prices.pct_change().dropna()

    def get_benchmark(self, ticker, start, end):
        prices = self.get_prices([ticker], start, end)
        return prices[ticker].pct_change().dropna()

    def _cache_path(self, tickers, start, end):
        key = "_".join(sorted(tickers)) + f"_{start}_{end}"
        h = hashlib.md5(key.encode()).hexdigest()[:8]
        return self.cache_dir / f"prices_{h}.parquet"
