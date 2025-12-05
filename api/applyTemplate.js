const jwt = require('jsonwebtoken');

const SESSION_SECRET = process.env.SESSION_SECRET || 'zTy2IEKHnwkP_65r81KJAyDPLB4CezoP';

function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift()?.trim();
    const value = decodeURIComponent(parts.join('='));
    if (key) list[key] = value;
  });
  return list;
}

function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const token = cookies.cm_session;
  if (!token) return null;
  try {
    return jwt.verify(token, SESSION_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const session = requireAuth(req, res);
  if (!session) {
    res.statusCode = 401;
    return res.json({ error: 'Unauthorized' });
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  const body = raw ? JSON.parse(raw) : {};

  const { guildId, templateId } = body;
  if (!guildId || !templateId) {
    res.statusCode = 400;
    return res.json({ error: 'guildId and templateId required' });
  }

  // TODO: call your bot apply-template here

  res.json({ status: 'queued', action: 'apply-template', guildId, templateId });
};
