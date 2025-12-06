import { randomUUID } from 'crypto';
import { requireAuth } from '../utils/token.js';
import { readJsonBody, validateTemplate } from '../utils/validator.js';
import { getTemplates, addTemplate } from '../utils/templatesStore.js';

export default async function handler(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    return res.json({ templates: getTemplates() });
  }

  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const error = validateTemplate(body);
      if (error) {
        res.statusCode = 400;
        return res.json({ error });
      }
      const record = addTemplate({ ...body, id: randomUUID(), owner: session.user?.id });
      return res.json({ template: record });
    } catch (err) {
      res.statusCode = 500;
      return res.json({ error: err?.message || 'Failed to save template' });
    }
  }

  res.statusCode = 405;
  res.end('Method not allowed');
}
