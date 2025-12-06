import { signSession, setSessionCookie } from '../../utils/token.js';
import { fetchDiscordUser, fetchDiscordGuilds } from '../../utils/apiClient.js';

const DISCORD_TOKEN = 'https://discord.com/api/oauth2/token';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const OWNER_IDS = (process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const OWNER_SET = new Set(OWNER_IDS);

function ensureEnv(res) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    res.statusCode = 500;
    res.json({ error: 'Missing Discord OAuth env vars' });
    return false;
  }
  return true;
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

export default async function handler(req, res) {
  if (!ensureEnv(res)) return;
  const code = req.query.code;
  if (!code) {
    res.statusCode = 400;
    return res.json({ error: 'Missing code' });
  }
  try {
    const tokenData = await exchangeCodeForToken(code);
    const { token_type, access_token } = tokenData;
    const [user, guilds] = await Promise.all([
      fetchDiscordUser(token_type, access_token),
      fetchDiscordGuilds(token_type, access_token)
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
    const jwt = signSession(payload);
    setSessionCookie(res, jwt);
    const redirectTarget = process.env.POST_LOGIN_REDIRECT || '/dashboard.html';
    res.writeHead(302, { Location: redirectTarget });
    res.end();
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err?.message || 'OAuth failed' });
  }
}
