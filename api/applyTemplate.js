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
    const { guildId, templateId } = body;
    if (!guildId || !templateId) {
      res.statusCode = 400;
      return res.json({ error: 'guildId and templateId required' });
    }

    // TODO: integrate with your bot to apply template to guildId
    res.json({ status: 'queued', action: 'apply-template', guildId, templateId, user: session.user?.id });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err?.message || 'Failed to apply template' });
  }
}
