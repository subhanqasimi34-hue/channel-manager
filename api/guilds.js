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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const cookies = parseCookies(req);
  const token = cookies.cm_session;
  if (!token) {
    res.statusCode = 401;
    return res.json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, SESSION_SECRET);
    res.json({ guilds: decoded.guilds || [] });
  } catch (err) {
    res.statusCode = 401;
    res.json({ error: 'Unauthorized' });
  }
};
