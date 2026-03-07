// api/tallinn.js
// Vercel serverless function: proxy for the remote GTFS zip.
// Streams upstream response to caller and adds CORS + cache headers.

module.exports = async (req, res) => {
  const REMOTE = 'https://eu-gtfs.remix.com/tallinn.zip';
  try {
    const upstream = await fetch(REMOTE, { method: 'GET' });
    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream fetch failed');
    }

    // Forward useful headers and expose CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/zip');
    // Edge/cache hint: let Vercel/edge cache for short time
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    // Read full body (safe for typical GTFS sizes) and send as binary
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('Proxy error');
  }
};
