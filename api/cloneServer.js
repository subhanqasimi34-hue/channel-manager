import { requireAuth } from '../utils/token.js';
import { readJsonBody } from '../utils/validator.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const session = requireAuth(req, res);
  if (!session) return;

  try {
    const body = await readJsonBody(req);
    const { sourceGuildId } = body;
    if (!sourceGuildId) {
      res.statusCode = 400;
      return res.json({ error: 'sourceGuildId required' });
    }
    // TODO: fetch guild structure via bot; placeholder response
    res.json({
      status: 'queued',
      action: 'clone-server',
      sourceGuildId,
      requestedBy: session.user?.id
    });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err?.message || 'Failed to clone server' });
  }
}
