import { requireAuth } from '../utils/token.js';

const OWNER_SET = new Set((process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean));

export default async function handler(req, res) {
  const session = requireAuth(req, res, { owners: OWNER_SET });
  if (!session) return;
  res.json({ user: session.user, isOwner: session.isOwner || OWNER_SET.has(session.user?.id) });
}
