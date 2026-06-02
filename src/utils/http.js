export function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(body);
}

export function notFound(res, message = 'Resource not found') {
  sendJson(res, 404, { error: message });
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

export function parseUrl(req) {
  return new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
}
