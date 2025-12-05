import jwt from 'jsonwebtoken';

const DISCORD_OAUTH = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN = 'https://discord.com/api/oauth2/token';
const DISCORD_API = 'https://discord.com/api/v10';

const CLIENT_ID = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth';
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'CHANGE_ME';
const OWNER_IDS = process.env.OWNER_IDS || '';

const OWNER_SET = new Set(OWNER_IDS.split(',').map(s => s.trim()).filter(Boolean));

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

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI
  });

  const tokenRes = await fetch(DISCORD_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    throw new Error(`Token exchange failed: ${txt}`);
  }

  return tokenRes.json();
}

async function fetchDiscordUser(authHeader) {
  const userRes = await fetch(`${DISCORD_API}/users/@me`, { headers: authHeader });
  if (!userRes.ok) throw new Error('Failed to fetch user');
  return userRes.json();
}

async function fetchDiscordGuilds(authHeader) {
  const guildRes = await fetch(`${DISCORD_API}/users/@me/guilds`, { headers: authHeader });
  if (!guildRes.ok) throw new Error('Failed to fetch guilds');
  return guildRes.json();
}

export default async function handler(req, res) {
  const action = req.query.action || (req.method === 'GET' && req.query.code ? 'callback' : 'login');

  if (action === 'session') {
    const cookies = parseCookies(req);
    const token = cookies.cm_session;
    if (!token) return unauthorized(res);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ user: decoded.user, isOwner: decoded.isOwner, guilds: decoded.guilds || [] });
    } catch (err) {
      return unauthorized(res);
    }
  }

  if (action === 'login') {
    if (!CLIENT_ID || !REDIRECT_URI) {
      res.statusCode = 500;
      return res.json({ error: 'Missing CLIENT_ID or REDIRECT_URI' });
    }

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
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
    if (!CLIENT_ID || !CLIENT_SECRET) {
      res.statusCode = 500;
      return res.end('Missing Discord secrets');
    }

    try {
      const tokenData = await exchangeCodeForToken(code);
      const authHeader = { Authorization: `${tokenData.token_type} ${tokenData.access_token}` };

      const [user, guilds] = await Promise.all([
        fetchDiscordUser(authHeader),
        fetchDiscordGuilds(authHeader)
      ]);

      const payload = {
        user: {
          id: user.id,
          username: `${user.username}${user.discriminator === '0' ? '' : '#' + user.discriminator}`,
          avatar: user.avatar
        },
        guilds,
        isOwner: OWNER_SET.has(user.id)
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
      setSessionCookie(res, token);

      const redirectTarget = process.env.POST_LOGIN_REDIRECT || '/dashboard';
      res.writeHead(302, { Location: redirectTarget });
      return res.end();
    } catch (err) {
      res.statusCode = 500;
      return res.end(typeof err?.message === 'string' ? err.message : 'OAuth failed');
    }
  }

  res.statusCode = 404;
  res.json({ error: 'Not found' });
}
