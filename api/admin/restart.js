import { requireAuth } from '../../utils/token.js';

const OWNER_SET = new Set((process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const session = requireAuth(req, res, { ownerOnly: true, owners: OWNER_SET });
  if (!session) return;
  // TODO: trigger bot restart via your infra
  res.json({ status: 'queued', action: 'restart-bot', requestedBy: session.user?.id });
}
