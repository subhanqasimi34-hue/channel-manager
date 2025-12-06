import { requireAuth } from '../utils/token.js';

const DISCORD_OAUTH = 'https://discord.com/api/oauth2/authorize';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

function ensureEnv(res) {
  if (!CLIENT_ID || !REDIRECT_URI) {
    res.statusCode = 500;
    res.json({ error: 'Missing DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.query?.action === 'session') {
    const session = requireAuth(req, res);
    if (!session) return;
    return res.json({ user: session.user, isOwner: session.isOwner, guilds: session.guilds || [] });
  }

  if (!ensureEnv(res)) return;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds bot applications.commands',
    permissions: '268435488'
  });
  res.writeHead(302, { Location: `${DISCORD_OAUTH}?${params.toString()}` });
  res.end();
}
