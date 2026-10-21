import os
import sys
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

# Add project root to path for src imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_loader import DataLoader
from src.risk_engine import RiskEngine
from src.optimizer import PortfolioOptimizer
from src.simulation import MonteCarloSimulator
from app.api.schemas import (
    AnalysisRequest, AnalysisResponse, MetricItem, ChartData,
    OptimizationResponse, SimulationRequest, SimulationResponse
)

app = FastAPI(title="Portfolio Risk Analyzer API", version="2.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "online", "message": "Portfolio Risk Analyzer API is running"}

@app.get("/search")
async def search_tickers(q: str):
    try:
        if len(q) < 2:
            return []
        import yfinance as yf
        search = yf.Search(q, max_results=8)
        results = []
        for quote in search.quotes:
            results.append({
                "symbol": quote.get("symbol"),
                "name": quote.get("shortname") or quote.get("longname"),
                "exchange": quote.get("exchange"),
                "type": quote.get("quoteType")
            })
        return results
    except Exception as e:
        return []

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_portfolio(req: AnalysisRequest):
    try:
        loader = DataLoader()
        returns = loader.get_returns(req.tickers, req.start_date, req.end_date)
        bench_r = loader.get_benchmark(req.benchmark, req.start_date, req.end_date)
        
        bench_aligned = bench_r.reindex(returns.index).dropna()
        returns = returns.reindex(bench_aligned.index).dropna()
        
        if returns.empty:
            raise HTTPException(status_code=400, detail="No data found for the given tickers and dates.")

        engine = RiskEngine(returns, req.weights, req.rf_rate, bench_aligned)
        m = engine.compute_all(req.conf_level)
        c = int(req.conf_level * 100)
        
        # Student-T robust VaR
        st_var = engine.var_student_t(req.conf_level)

        # Build metrics response
        metrics = MetricItem(
            ann_return=m["ann_return"],
            ann_vol=m["ann_vol"],
            sharpe=m["sharpe"],
            sortino=m["sortino"],
            calmar=m["calmar"],
            max_drawdown=m["max_drawdown"],
            var_hist=m[f"var_hist_{c}"],
            var_para=m[f"var_para_{c}"],
            var_mc=m[f"var_mc_{c}"],
            var_student_t=st_var,
            cvar=m[f"cvar_{c}"],
            beta=m.get("beta"),
            alpha=m.get("alpha")
        )

        # Charts
        cum = engine.cumulative_returns()
        drawdown = engine.drawdown_series()
        rolling = engine.rolling_sharpe(63).dropna()

        # Sector Analysis
        info = loader.get_info(req.tickers)
        sector_exp = {}
        for t, w in zip(req.tickers, req.weights):
            s = info[t].get("sector", "Unknown")
            sector_exp[s] = sector_exp.get(s, 0) + w

        return AnalysisResponse(
            metrics=metrics,
            cumulative_returns=ChartData(x=cum.index.strftime("%Y-%m-%d").tolist(), y=cum.values.tolist(), name="Cumulative Returns"),
            drawdown_series=ChartData(x=drawdown.index.strftime("%Y-%m-%d").tolist(), y=(drawdown.values * 100).tolist(), name="Drawdown"),
            rolling_sharpe=ChartData(x=rolling.index.strftime("%Y-%m-%d").tolist(), y=rolling.values.tolist(), name="Rolling Sharpe"),
            correlation_matrix=engine.correlation_matrix().to_dict(),
            sector_exposure=sector_exp,
            ticker_info=info
        )

    except HTTPException:
        raise
    except ValueError as e:
        # Bad input (unknown ticker, weights not summing to 1, etc.)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize", response_model=OptimizationResponse)
async def optimize_portfolio(req: AnalysisRequest):
    try:
        loader = DataLoader()
        returns = loader.get_returns(req.tickers, req.start_date, req.end_date)
        
        if returns.empty:
            raise HTTPException(status_code=400, detail="No data found.")

        opt = PortfolioOptimizer(returns, req.rf_rate)
        ms = opt.maximize_sharpe()
        mv = opt.minimize_variance()
        rdf = opt.random_portfolios(2000)
        fdf = opt.efficient_frontier(50)

        # Calculate current stats
        w_arr = np.array(req.weights)
        mu_ann = returns.mean().values * 252
        cv_ann = returns.cov().values * 252
        c_ret = float(np.dot(w_arr, mu_ann))
        c_vol = float(np.sqrt(w_arr @ cv_ann @ w_arr))
        c_sh = (c_ret - req.rf_rate) / c_vol if c_vol > 0 else 0

        current = {"return": c_ret, "volatility": c_vol, "sharpe": c_sh, "weights": dict(zip(req.tickers, req.weights))}

        return OptimizationResponse(
            max_sharpe=ms,
            min_variance=mv,
            current=current,
            efficient_frontier=fdf.to_dict(orient="records"),
            random_portfolios=rdf.to_dict(orient="records")
        )
    except HTTPException:
        raise
    except ValueError as e:
        # Bad input (unknown ticker, weights not summing to 1, etc.)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_portfolio(req: SimulationRequest):
    try:
        loader = DataLoader()
        returns = loader.get_returns(req.tickers, req.start_date, req.end_date)

        if returns.empty:
            raise HTTPException(status_code=400, detail="No data found.")

        sim = MonteCarloSimulator(returns, req.weights)
        if req.use_fhs:
            paths = sim.run_fhs(n=req.n_paths, horizon=req.horizon, start_value=req.start_value, stress_level=req.stress_level)
        else:
            paths = sim.run(n=req.n_paths, horizon=req.horizon, start_value=req.start_value, stress_level=req.stress_level)
        
        final = paths.iloc[-1]
        
        return SimulationResponse(
            median=paths.quantile(0.5, axis=1).tolist(),
            p5=paths.quantile(0.05, axis=1).tolist(),
            p95=paths.quantile(0.95, axis=1).tolist(),
            p25=paths.quantile(0.25, axis=1).tolist(),
            p75=paths.quantile(0.75, axis=1).tolist(),
            prob_loss=(final < req.start_value).mean(),
            median_outcome=final.median(),
            paths_sample=paths.iloc[:, :min(50, req.n_paths)].values.T.tolist()
        )
    except HTTPException:
        raise
    except ValueError as e:
        # Bad input (unknown ticker, weights not summing to 1, etc.)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
