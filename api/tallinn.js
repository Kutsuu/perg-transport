// api/tallinn.js
// Vercel serverless function — proxy for remote GTFS zip.
// Streams upstream response and sets CORS headers.

export default async function handler(req, res) {
  const REMOTE = 'https://eu-gtfs.remix.com/tallinn.zip';
  try {
    const upstream = await fetch(REMOTE);
    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream fetch failed');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/zip');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    // Stream the upstream body to the response to avoid buffering large files
    const reader = upstream.body.getReader();
    res.writeHead(200);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('Proxy error');
  }
}
