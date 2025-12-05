const tabs = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');
const serverGrid = document.getElementById('serverGrid');
const templateGrid = document.getElementById('templateGrid');
const designerColumns = document.getElementById('designerColumns');
const logStream = document.getElementById('logStream');
const liveLogs = document.getElementById('liveLogs');
const textInput = document.getElementById('textInput');
const textStructure = document.getElementById('textStructure');
const photoStructure = document.getElementById('photoStructure');
const authGate = document.getElementById('authGate');
const appShell = document.getElementById('appShell');
const loginBtn = document.getElementById('discordLogin');
const inviteBtn = document.getElementById('inviteBot');
const inviteBtnTop = document.getElementById('btnInviteTop');
const docsBtn = document.getElementById('btnDocs');
const userName = document.getElementById('userName');
const userStatus = document.getElementById('userStatus');
const userAvatar = document.getElementById('userAvatar');
const adminOnlyBlocks = document.querySelectorAll('.admin-only');

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    panels.forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(tab.dataset.target);
    if (target) target.classList.remove('hidden');
  });
}

const BOT_CLIENT_ID = '1446565037857574924';
const BOT_PERMS = '268435488';

function inviteUrl() {
  const params = new URLSearchParams({
    client_id: BOT_CLIENT_ID,
    scope: 'bot applications.commands',
    permissions: BOT_PERMS
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

inviteBtn?.addEventListener('click', () => (window.location.href = inviteUrl()));
inviteBtnTop?.addEventListener('click', () => (window.location.href = inviteUrl()));
docsBtn?.addEventListener('click', () => window.open('https://discord.com/developers/docs/intro', '_blank'));
loginBtn?.addEventListener('click', () => (window.location.href = '/api/auth?action=login'));

document.getElementById('refreshGuilds')?.addEventListener('click', loadGuilds);
document.getElementById('loadSample')?.addEventListener('click', () => {
  textInput.value = `Welcome
  #welcome
  #rules
Support
  #ticket
  ?? hangout`;
  renderTextPreview();
});

document.getElementById('textBuild')?.addEventListener('click', () => {
  // TODO: POST /api/analyze-text when implemented
  pushLog('Text build requested (hook to backend).');
});

document.getElementById('photoAnalyze')?.addEventListener('click', () => {
  photoStructure.innerHTML = '<li>Analyzing (stub)...</li>';
  // TODO: Upload + POST /api/analyze-image
});

init();

async function init() {
  const session = await fetchSession();
  if (!session) {
    authGate?.classList.remove('hidden');
    appShell?.classList.add('hidden');
    return;
  }
  setUser(session);
  authGate?.classList.add('hidden');
  appShell?.classList.remove('hidden');
  await loadGuilds();
  loadTemplatesMock();
  loadDesignerMock();
  pushLog('Ready. Session active.');
  if (session.isOwner) connectLogs();
}

async function fetchSession() {
  try {
    const res = await fetch('/api/auth?action=session', { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function setUser(session) {
  const user = session.user || {};
  if (userName) userName.textContent = user.username || user.name || 'Unknown';
  if (userStatus) userStatus.textContent = session.isOwner ? 'Owner' : 'User';
  if (userAvatar) userAvatar.textContent = (user.username || 'CM').slice(0, 2).toUpperCase();
  if (session.isOwner) adminOnlyBlocks.forEach(el => (el.style.display = 'block'));
}

async function loadGuilds() {
  try {
    const res = await fetch('/api/guilds', { credentials: 'include' });
    if (!res.ok) {
      serverGrid.innerHTML = '<div class="server-card">Failed to load guilds</div>';
      return;
    }
    const data = await res.json();
    renderGuilds(data.guilds || []);
  } catch (err) {
    serverGrid.innerHTML = '<div class="server-card">Error loading guilds</div>';
  }
}

function renderGuilds(guilds) {
  if (!guilds.length) {
    serverGrid.innerHTML = '<div class="server-card">No guilds found. Invite the bot and refresh.</div>';
    return;
  }
  serverGrid.innerHTML = guilds
    .map(
      g => `<div class="server-card">
        <div class="title">${g.name}</div>
        <div class="meta">ID: ${g.id}</div>
        <div class="meta">Permissions: ${g.permissions || 'N/A'}</div>
        <button class="pill primary" data-guild="${g.id}">Manage</button>
      </div>`
    )
    .join('');
  serverGrid.querySelectorAll('button[data-guild]').forEach(btn => {
    btn.addEventListener('click', () => {
      pushLog(`Manage ${btn.dataset.guild} clicked (hook to backend).`);
    });
  });
}

function loadTemplatesMock() {
  const mockTemplates = [
    { name: 'Esports', summary: '6 categories / 24 channels' },
    { name: 'Community', summary: '4 categories / 14 channels' },
    { name: 'Support Desk', summary: '3 categories / 9 channels' }
  ];
  templateGrid.innerHTML = mockTemplates
    .map(t => `<div class="template"><h4>${t.name}</h4><p>${t.summary}</p><button class="pill ghost">Load</button></div>`)
    .join('');
}

function loadDesignerMock() {
  const mockCats = [
    { name: 'welcome', channels: ['welcome', 'rules', 'announcements'] },
    { name: 'support', channels: ['ticket', 'review'] },
    { name: 'main', channels: ['general', 'matchmaking-channel'] }
  ];
  designerColumns.innerHTML = mockCats
    .map(cat => `<div class="category"><h4>${cat.name}</h4>${cat.channels.map(c => `<div class="channel text">${c}</div>`).join('')}</div>`)
    .join('');
}

function pushLog(msg) {
  if (logStream) {
    logStream.textContent += `\n${msg}`;
    logStream.scrollTop = logStream.scrollHeight;
  }
  if (liveLogs) {
    liveLogs.textContent += `\n${msg}`;
    liveLogs.scrollTop = liveLogs.scrollHeight;
  }
}

pushLog('Bot ready.');
pushLog('Awaiting OCR / text jobs...');

function connectLogs() {
  pushLog('Admin log stream available (implement WS /api/admin/logs).');
}

function renderTextPreview() {
  if (!textInput || !textStructure) return;
  const lines = textInput.value.split(/\r?\n/).filter(Boolean);
  textStructure.innerHTML = lines.map(l => `<li>${l}</li>`).join('');
}

if (textInput && textStructure) {
  textInput.addEventListener('input', renderTextPreview);
  renderTextPreview();
}

// Hook UI to backend bot commands as needed.
