import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET (or SESSION_SECRET) environment variable');
}

export function parseCookies(req) {
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

export function signSession(payload, expiresIn = '2h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifySession(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL_URL;
  const secureAttr = secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `cm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200${secureAttr}`);
}

export function requireAuth(req, res, { ownerOnly = false, owners = new Set() } = {}) {
  const cookies = parseCookies(req);
  const token = cookies.cm_session;
  if (!token) {
    res.statusCode = 401;
    res.json({ error: 'Unauthorized' });
    return null;
  }
  try {
    const decoded = verifySession(token);
    if (ownerOnly && !owners.has(decoded.user?.id)) {
      res.statusCode = 403;
      res.json({ error: 'Forbidden' });
      return null;
    }
    return decoded;
  } catch (err) {
    res.statusCode = 401;
    res.json({ error: 'Unauthorized' });
    return null;
  }
}
