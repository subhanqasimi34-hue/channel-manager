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
    const { guildId, imageUrl, base64 } = body;
    if (!guildId || (!imageUrl && !base64)) {
      res.statusCode = 400;
      return res.json({ error: 'guildId and imageUrl or base64 required' });
    }

    // TODO: integrate OpenAI Vision; placeholder structure for now
    const parsed = {
      name: 'Analyzed Template',
      categories: [
        { name: 'general', channels: ['welcome', 'rules', 'announcements'] },
        { name: 'voice', channels: ['General VC'] }
      ]
    };

    res.json({ status: 'ok', action: 'analyze-image', guildId, template: parsed, requestedBy: session.user?.id });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err?.message || 'Failed to analyze image' });
  }
}
