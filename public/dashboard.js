const state = {
  session: null,
  guilds: [],
  templates: []
};

const endpoints = {
  session: () => fetch('/api/user', { credentials: 'include' }),
  guilds: () => fetch('/api/guilds', { credentials: 'include' }),
  templates: () => fetch('/api/getTemplates', { credentials: 'include' }),
  saveTemplate: body =>
    fetch('/api/saveTemplate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  analyzeText: body =>
    fetch('/api/analyzeText', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  analyzeImage: body =>
    fetch('/api/analyzeImage', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  cloneServer: body =>
    fetch('/api/cloneServer', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
  adminLogs: () => fetch('/api/admin/logs', { credentials: 'include' }),
  adminRestart: () => fetch('/api/admin/restart', { method: 'POST', credentials: 'include' })
};

function $(id) {
  return document.getElementById(id);
}

function pushLog(msg) {
  const logStream = $('logStream');
  if (!logStream) return;
  logStream.textContent += `\n${msg}`;
  logStream.scrollTop = logStream.scrollHeight;
}

async function loadSession() {
  const res = await endpoints.session();
  if (!res.ok) {
    window.location.href = '/';
    return;
  }
  const data = await res.json();
  state.session = data;
  const user = data.user || {};
  $('userName').textContent = user.username || 'Unknown';
  $('userStatus').textContent = data.isOwner ? 'Owner' : 'User';
  $('userAvatar').textContent = (user.username || 'CM').slice(0, 2).toUpperCase();
  if (data.isOwner) document.querySelectorAll('.admin-only').forEach(el => (el.style.display = 'block'));
}

async function loadGuilds() {
  const res = await endpoints.guilds();
  if (!res.ok) {
    $('serverGrid').innerHTML = '<div class="server-card">Failed to load guilds</div>';
    return;
  }
  const data = await res.json();
  state.guilds = data.guilds || [];
  renderGuilds();
}

function renderGuilds() {
  const grid = $('serverGrid');
  if (!state.guilds.length) {
    grid.innerHTML = '<div class="server-card">No guilds found. Invite the bot and refresh.</div>';
    return;
  }
  grid.innerHTML = state.guilds
    .map(
      g => `<div class="server-card">
        <div class="title">${g.name || 'Guild'}</div>
        <div class="meta">ID: ${g.id}</div>
        <div class="meta">Permissions: ${g.permissions || 'N/A'}</div>
        <button class="pill primary" data-guild="${g.id}">Open</button>
      </div>`
    )
    .join('');
}

async function loadTemplates() {
  const res = await endpoints.templates();
  if (!res.ok) {
    $('templateGrid').innerHTML = '<div class="template">Failed to load templates</div>';
    return;
  }
  const data = await res.json();
  state.templates = data.templates || [];
  $('templateGrid').innerHTML = state.templates
    .map(t => `<div class="template"><h4>${t.name}</h4><p>${(t.categories || []).length} categories</p><button class="pill ghost" data-template="${t.id}">Apply</button></div>`)
    .join('');
}

async function saveTemplateFromDesigner() {
  const payload = {
    name: 'Draft Template',
    categories: [
      { name: 'general', channels: ['welcome', 'rules'] }
    ]
  };
  const res = await endpoints.saveTemplate(payload);
  if (!res.ok) {
    pushLog('Failed to save template');
    return;
  }
  pushLog('Template saved');
  loadTemplates();
}

async function analyzeText() {
  const res = await endpoints.analyzeText({ text: $('textInput').value });
  if (!res.ok) return pushLog('Text analysis failed');
  const data = await res.json();
  $('textStructure').innerHTML = data.categories
    .map(cat => `<li>${cat.name}: ${(cat.channels || []).join(', ')}</li>`)
    .join('');
  pushLog('Text analyzed');
}

async function analyzeImage() {
  const file = $('photoInput').files[0];
  if (!file) return pushLog('Upload an image first');
  const base64 = await fileToBase64(file);
  const res = await endpoints.analyzeImage({ base64 });
  if (!res.ok) return pushLog('Image analysis failed');
  const data = await res.json();
  $('photoStructure').innerHTML = (data.template?.categories || [])
    .map(cat => `<li>${cat.name}: ${(cat.channels || []).join(', ')}</li>`)
    .join('');
  pushLog('Image analyzed');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function cloneServer() {
  const sourceGuildId = $('cloneGuildId').value.trim();
  if (!sourceGuildId) return pushLog('Source guild ID required');
  const res = await endpoints.cloneServer({ sourceGuildId });
  if (!res.ok) return pushLog('Clone failed');
  pushLog('Clone queued');
}

async function loadAdminLogs() {
  const res = await endpoints.adminLogs();
  if (!res.ok) {
    $('adminLogs').textContent = 'No access or failed to load logs.';
    return;
  }
  const data = await res.json();
  $('adminLogs').textContent = data.logs.map(l => `[${l.level}] ${new Date(l.ts).toLocaleTimeString()} ${l.message}`).join('\n');
}

async function restartBot() {
  const res = await endpoints.adminRestart();
  pushLog(res.ok ? 'Restart queued' : 'Restart failed');
}

function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.remove('hidden');
    });
  });
}

function wireActions() {
  $('refreshGuilds')?.addEventListener('click', loadGuilds);
  $('loadTemplates')?.addEventListener('click', loadTemplates);
  $('saveTemplate')?.addEventListener('click', saveTemplateFromDesigner);
  $('loadSample')?.addEventListener('click', () => {
    $('textInput').value = 'Welcome\n#welcome\n#rules\nSupport\n#ticket';
    analyzeText();
  });
  $('textBuild')?.addEventListener('click', analyzeText);
  $('photoAnalyze')?.addEventListener('click', analyzeImage);
  $('cloneStart')?.addEventListener('click', cloneServer);
  $('btnInviteTop')?.addEventListener('click', () => window.location.href = inviteUrl());
  $('btnDocs')?.addEventListener('click', () => window.open('https://discord.com/developers/docs/intro', '_blank'));
  $('btnLogout')?.addEventListener('click', () => {
    document.cookie = 'cm_session=; Path=/; Max-Age=0';
    window.location.href = '/';
  });
  $('adminLogsBtn')?.addEventListener('click', loadAdminLogs);
  $('adminRestartBtn')?.addEventListener('click', restartBot);
}

function inviteUrl() {
  const params = new URLSearchParams({
    client_id: '1446565037857574924',
    scope: 'bot applications.commands',
    permissions: '268435488'
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

async function bootstrap() {
  initNav();
  wireActions();
  await loadSession();
  await Promise.all([loadGuilds(), loadTemplates()]);
  pushLog('Ready. Session active.');
}

bootstrap().catch(err => {
  console.error(err);
  pushLog('Init failed');
});
