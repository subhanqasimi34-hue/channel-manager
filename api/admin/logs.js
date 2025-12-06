import { requireAuth } from '../../utils/token.js';

const OWNER_SET = new Set((process.env.OWNER_IDS || '').split(',').map(s => s.trim()).filter(Boolean));

export default async function handler(req, res) {
  const session = requireAuth(req, res, { ownerOnly: true, owners: OWNER_SET });
  if (!session) return;
  res.json({
    logs: [
      { level: 'info', message: 'Dashboard online', ts: Date.now() },
      { level: 'info', message: 'Admin session active', ts: Date.now() }
    ]
  });
}
