// Serverless function that proxies Tiingo daily price requests.
// The Tiingo API token lives in Vercel as an environment variable (TIINGO_TOKEN)
// so users of this app never see or handle it directly.

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Shared access password — keeps the endpoint from being open to the public.
  // Set ACCESS_PASSWORD in Vercel env vars. Users enter it once in the app.
  const accessPw = process.env.ACCESS_PASSWORD;
  if (accessPw) {
    const provided = req.headers['x-access-pw'] || '';
    if (provided !== accessPw) {
      return res.status(401).json({ error: 'Invalid or missing access password' });
    }
  }

  const token = process.env.TIINGO_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'TIINGO_TOKEN environment variable is not set in Vercel.'
    });
  }

  const { ticker, startDate } = req.query;
  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Missing ticker parameter' });
  }
  if (!/^[A-Z0-9\-.]{1,12}$/i.test(ticker)) {
    return res.status(400).json({ error: 'Invalid ticker format' });
  }

  const start = (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate))
    ? startDate
    : '2012-01-01';
  const today = new Date().toISOString().slice(0, 10);

  const url = `https://api.tiingo.com/tiingo/daily/${encodeURIComponent(ticker)}/prices`
            + `?startDate=${start}&endDate=${today}&format=json`
            + `&token=${encodeURIComponent(token)}`;

  try {
    const tiingoRes = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!tiingoRes.ok) {
      const body = await tiingoRes.text().catch(() => '');
      return res.status(tiingoRes.status).json({
        error: `Tiingo returned ${tiingoRes.status}`,
        detail: body.slice(0, 300),
      });
    }

    const data = await tiingoRes.json();
    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'Unexpected response shape from Tiingo' });
    }

    // Project only the fields we need to keep the payload small.
    const rows = data.map(d => ({
      date: d.date,
      high: d.adjHigh != null ? d.adjHigh : d.high,
      low:  d.adjLow  != null ? d.adjLow  : d.low,
      close: d.adjClose != null ? d.adjClose : d.close,
    }));

    return res.status(200).json({ ticker, rows });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to reach Tiingo',
      detail: String(err && err.message ? err.message : err),
    });
  }
}
