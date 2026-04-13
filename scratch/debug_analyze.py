import os
import sys
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_loader import DataLoader
from src.risk_engine import RiskEngine

def test_analyze():
    tickers = ["AMZN", "MSFT", "JPM", "XOM", "GLD"]
    weights = [0.2, 0.2, 0.2, 0.2, 0.2]
    start = "2019-01-01"
    end = "2024-12-31"
    benchmark = "SPY"
    
    loader = DataLoader()
    try:
        print(f"Downloading data for {tickers}...")
        returns = loader.get_returns(tickers, start, end)
        print("Returns shape:", returns.shape)
        
        print(f"Downloading benchmark {benchmark}...")
        bench_r = loader.get_benchmark(benchmark, start, end)
        print("Benchmark shape:", bench_r.shape)
        
        bench_aligned = bench_r.reindex(returns.index).dropna()
        returns_aligned = returns.reindex(bench_aligned.index).dropna()
        
        print("Aligned Returns shape:", returns_aligned.shape)
        
        engine = RiskEngine(returns_aligned, weights, 0.05, bench_aligned)
        m = engine.compute_all(0.95)
        print("Analysis successful!")
        print("Sharpe Ratio:", m["sharpe"])
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_analyze()
