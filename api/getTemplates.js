import { requireAuth } from '../utils/token.js';
import { getTemplates } from '../utils/templatesStore.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const session = requireAuth(req, res);
  if (!session) return;
  res.json({ templates: getTemplates() });
}
