import { randomUUID } from 'crypto';
import { requireAuth } from '../utils/token.js';
import { readJsonBody, validateTemplate } from '../utils/validator.js';
import { addTemplate } from '../utils/templatesStore.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const session = requireAuth(req, res);
  if (!session) return;
  try {
    const body = await readJsonBody(req);
    const error = validateTemplate(body);
    if (error) {
      res.statusCode = 400;
      return res.json({ error });
    }
    const record = addTemplate({ ...body, id: randomUUID(), owner: session.user?.id });
    res.json({ template: record });
  } catch (err) {
    res.statusCode = 500;
    res.json({ error: err?.message || 'Failed to save template' });
  }
}
