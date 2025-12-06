const store = globalThis.__cm_templates || (globalThis.__cm_templates = []);

export function getTemplates() {
  return store;
}

export function addTemplate(record) {
  store.push(record);
  return record;
}
