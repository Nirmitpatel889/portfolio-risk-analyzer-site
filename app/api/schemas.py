from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    tickers: List[str]
    weights: List[float]
    start_date: str
    end_date: str
    benchmark: str = "SPY"
    rf_rate: float = 0.05
    conf_level: float = 0.95
    stress_level: float = 1.0

class MetricItem(BaseModel):
    ann_return: float
    ann_vol: float
    sharpe: float
    sortino: float
    calmar: float
    max_drawdown: float
    var_hist: float
    var_para: float
    var_mc: float
    var_student_t: float
    cvar: float
    beta: Optional[float] = None
    alpha: Optional[float] = None

class ChartData(BaseModel):
    x: List[str]
    y: List[float]
    name: str

class AnalysisResponse(BaseModel):
    metrics: MetricItem
    cumulative_returns: ChartData
    drawdown_series: ChartData
    rolling_sharpe: ChartData
    correlation_matrix: Dict[str, Dict[str, float]]
    sector_exposure: Dict[str, float]
    ticker_info: Dict[str, Dict[str, str]]

class OptimizationResponse(BaseModel):
    max_sharpe: Dict
    min_variance: Dict
    current: Dict
    efficient_frontier: List[Dict[str, float]]
    random_portfolios: List[Dict[str, float]]

class SimulationRequest(BaseModel):
    tickers: List[str]
    weights: List[float]
    start_date: str
    end_date: str
    n_paths: int = 1000
    horizon: int = 252
    start_value: float = 10000.0
    stress_level: float = 1.0
    use_fhs: bool = True

class SimulationResponse(BaseModel):
    median: List[float]
    p5: List[float]
    p95: List[float]
    p25: List[float]
    p75: List[float]
    prob_loss: float
    median_outcome: float
    paths_sample: List[List[float]]
