export function validateTemplate(template) {
  if (!template || typeof template !== 'object') return 'Template must be an object';
  if (!template.name || typeof template.name !== 'string') return 'Template name required';
  if (!Array.isArray(template.categories)) return 'Template categories must be an array';
  for (const cat of template.categories) {
    if (!cat.name) return 'Each category needs a name';
    if (!Array.isArray(cat.channels)) return 'Category channels must be an array';
  }
  return null;
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString());
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}
