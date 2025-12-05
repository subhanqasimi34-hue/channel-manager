import jwt from 'jsonwebtoken';

const DISCORD_OAUTH = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN = 'https://discord.com/api/oauth2/token';
const DISCORD_API = 'https://discord.com/api/v10';

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI = 'http://localhost:3000/api/auth',
  SESSION_SECRET = 'CHANGE_ME',
  OWNER_IDS = ''
} = process.env;

const OWNER_SET = new Set((OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean));

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

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `cm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200`);
}

function unauthorized(res) {
  res.statusCode = 401;
  res.json({ error: 'Unauthorized' });
}

export default async function handler(req, res) {
  const action = req.query.action || (req.method === 'GET' && req.query.code ? 'callback' : 'login');

  if (action === 'session') {
    const cookies = parseCookies(req);
    const token = cookies.cm_session;
    if (!token) return unauthorized(res);
    try {
      const decoded = jwt.verify(token, SESSION_SECRET);
      return res.json({ user: decoded.user, isOwner: decoded.isOwner, guilds: decoded.guilds || [] });
    } catch (err) {
      return unauthorized(res);
    }
  }

  if (action === 'login') {
    if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
      res.statusCode = 500;
      return res.json({ error: 'Missing DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI' });
    }
    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'identify guilds bot applications.commands',
      permissions: '268435488'
    });
    res.writeHead(302, { Location: `${DISCORD_OAUTH}?${params.toString()}` });
    return res.end();
  }

  if (action === 'callback') {
    const code = req.query.code;
    if (!code) {
      res.statusCode = 400;
      return res.end('Missing code');
    }
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      res.statusCode = 500;
      return res.end('Missing Discord secrets');
    }
    try {
      const body = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI
      });
      const tokenRes = await fetch(DISCORD_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (!tokenRes.ok) {
        const txt = await tokenRes.text();
        res.statusCode = 401;
        return res.end(`Token exchange failed: ${txt}`);
      }
      const tokenData = await tokenRes.json();
      const authHeader = { Authorization: `${tokenData.token_type} ${tokenData.access_token}` };
      const userRes = await fetch(`${DISCORD_API}/users/@me`, { headers: authHeader });
      const guildRes = await fetch(`${DISCORD_API}/users/@me/guilds`, { headers: authHeader });
      const user = await userRes.json();
      const guilds = await guildRes.json();
      const payload = {
        user: {
          id: user.id,
          username: `${user.username}${user.discriminator === '0' ? '' : '#' + user.discriminator}`,
          avatar: user.avatar
        },
        guilds,
        isOwner: OWNER_SET.has(user.id)
      };
      const token = jwt.sign(payload, SESSION_SECRET, { expiresIn: '2h' });
      setSessionCookie(res, token);
      res.writeHead(302, { Location: '/' });
      return res.end();
    } catch (err) {
      res.statusCode = 500;
      return res.end('OAuth failed');
    }
  }

  res.statusCode = 404;
  res.json({ error: 'Not found' });
}
