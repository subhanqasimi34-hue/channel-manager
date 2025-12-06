const DISCORD_API = 'https://discord.com/api/v10';

function authHeader(tokenType, accessToken) {
  return { Authorization: `${tokenType} ${accessToken}` };
}

export async function fetchDiscordUser(tokenType, accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, { headers: authHeader(tokenType, accessToken) });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function fetchDiscordGuilds(tokenType, accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, { headers: authHeader(tokenType, accessToken) });
  if (!res.ok) throw new Error('Failed to fetch guilds');
  return res.json();
}
