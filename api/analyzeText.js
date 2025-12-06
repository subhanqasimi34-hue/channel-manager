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
    const { text } = body;
    if (!text) {
      res.statusCode = 400;
      return res.json({ error: 'text required' });
    }
    // Simple parser placeholder; split categories by blank lines
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const categories = [{ name: 'imported', channels: lines }];
    res.json({ status: 'ok', categories, requestedBy: session.user?.id });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err?.message || 'Failed to analyze text' });
  }
}
