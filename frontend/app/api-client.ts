const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function analyzePortfolio(data: {
  tickers: string[];
  weights: number[];
  start_date: string;
  end_date: string;
  benchmark: string;
  rf_rate: number;
  conf_level: number;
}) {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
}

export async function optimizePortfolio(data: {
  tickers: string[];
  weights: number[];
  start_date: string;
  end_date: string;
  rf_rate: number;
}) {
  const res = await fetch(`${API_BASE_URL}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Optimization failed');
  return res.json();
}

export async function simulatePortfolio(data: {
  tickers: string[];
  weights: number[];
  start_date: string;
  end_date: string;
  n_paths: number;
  horizon: number;
  start_value: number;
}) {
  const res = await fetch(`${API_BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}
