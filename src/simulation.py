"""src/simulation.py — Monte Carlo portfolio simulation."""

import numpy as np
import pandas as pd


class MonteCarloSimulator:
    def __init__(self, returns, weights, trading_days=252):
        self.returns = returns.copy()
        self.weights = np.array(weights, dtype=float)
        self.td      = trading_days
        self.mu      = returns.mean().values
        self.cov     = returns.cov().values
        self.L       = np.linalg.cholesky(self.cov)
        
        # Pre-compute standardized residuals for FHS
        std_devs = returns.std().values
        self.residuals = (returns - returns.mean()).values / std_devs

    def run(self, n=1000, horizon=252, start_value=10000, seed=42, stress_level=1.0):
        """Standard Correlated GBM Simulation."""
        rng = np.random.default_rng(seed)
        # Apply stress level to volatility
        stressed_L = self.L * stress_level
        
        z   = rng.standard_normal((n, len(self.weights), horizon))
        cr  = np.einsum("ij,njt->nit", stressed_L, z) + self.mu[:, np.newaxis]
        pr  = np.einsum("nit,i->nt", cr, self.weights)
        cum = np.cumprod(1 + pr, axis=1)
        paths = np.hstack([np.ones((n, 1)), cum]) * start_value
        return pd.DataFrame(paths.T)

    def run_fhs(self, n=1000, horizon=252, start_value=10000, seed=42, stress_level=1.0):
        """Filtered Historical Simulation (FHS).
        Samples from historical residuals and scales by current volatility."""
        rng = np.random.default_rng(seed)
        
        # Current vol (could be localized, but we use full-sample vol for simplicity)
        curr_vol = self.returns.std().values * stress_level
        
        # Initialize paths
        n_assets = len(self.weights)
        all_paths = []
        
        for _ in range(n):
            # Sample indices for the horizon
            idx = rng.integers(0, len(self.residuals), size=horizon)
            res_sample = self.residuals[idx] # (horizon, n_assets)
            
            # Reconstruct returns: r = mu + res * curr_vol
            ret_sample = self.mu + (res_sample * curr_vol)
            
            # Portfolio returns
            p_ret = ret_sample @ self.weights
            
            # Cumprod
            cum = np.cumprod(1 + p_ret)
            path = np.insert(cum, 0, 1.0) * start_value
            all_paths.append(path)
            
        return pd.DataFrame(np.array(all_paths).T)
