/* Flowdeck — a mobile-first command deck for your coding projects.
 * Vanilla JS, no build step. State lives in localStorage; optional GitHub
 * integration reads live repo activity with a personal access token that
 * never leaves the device except to call api.github.com directly. */

const STORE_KEY = 'flowdeck.state.v1';
const GH_KEY = 'flowdeck.github.v1';

/* ---------- constants ---------------------------------------------- */
const STATUSES = [
  { key: 'active', label: 'Active' },
  { key: 'progress', label: 'In progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'idle', label: 'Idle' },
  { key: 'done', label: 'Done' },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]));
const PRIOS = ['low', 'med', 'high'];
const PRIO_NEXT = { low: 'med', med: 'high', high: 'low' };

/* ---------- utilities ---------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => 'x' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = (s) =>
  String(s == null ? '' : s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7) return d + 'd ago';
  const w = Math.floor(d / 7);
  if (w < 5) return w + 'w ago';
  return Math.floor(d / 30) + 'mo ago';
}

function toast(msg) {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- state --------------------------------------------------- */
let state = load();

function defaultState() {
  return {
    projects: [
      {
        id: 'inbox',
        name: 'Inbox',
        repo: '',
        status: 'active',
        tags: [],
        notes: '',
        links: {},
        tasks: [],
        pinned: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    settings: { theme: 'auto' },
    onboarded: false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.projects)) return defaultState();
    if (!s.projects.some((p) => p.id === 'inbox')) {
      s.projects.unshift(defaultState().projects[0]);
    }
    s.settings = s.settings || { theme: 'auto' };
    return s;
  } catch (e) {
    return defaultState();
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Storage full — export & clear');
  }
}

const findProject = (id) => state.projects.find((p) => p.id === id);

function touch(p) {
  if (p) p.updatedAt = Date.now();
}

/* ---------- GitHub -------------------------------------------------- */
const gh = {
  token: localStorage.getItem(GH_KEY) || '',
  user: null,
  setToken(t) {
    this.token = t || '';
    if (t) localStorage.setItem(GH_KEY, t);
    else localStorage.removeItem(GH_KEY);
  },
  async api(path) {
    const res = await fetch('https://api.github.com' + path, {
      headers: {
        Authorization: 'Bearer ' + this.token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) {
      const err = new Error('GitHub ' + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  },
  me() {
    return this.api('/user');
  },
  repos() {
    return this.api('/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member');
  },
  async activity(fullName) {
    // Live counts for a linked repo: open PRs, open issues, last push, branch.
    const [repo, prs, issues] = await Promise.all([
      this.api('/repos/' + fullName),
      this.api('/search/issues?q=' + encodeURIComponent('repo:' + fullName + ' is:pr is:open') + '&per_page=1'),
      this.api('/search/issues?q=' + encodeURIComponent('repo:' + fullName + ' is:issue is:open') + '&per_page=1'),
    ]);
    return {
      prs: prs.total_count,
      issues: issues.total_count,
      pushedAt: new Date(repo.pushed_at).getTime(),
      branch: repo.default_branch,
      url: repo.html_url,
      fetchedAt: Date.now(),
    };
  },
};

/* ---------- routing ------------------------------------------------- */
function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [seg, arg] = hash.split('/');
  return { seg: seg || 'home', arg };
}
function go(path) {
  location.hash = path;
}
window.addEventListener('hashchange', render);

/* ---------- render helpers ----------------------------------------- */
function statusPill(status) {
  return `<span class="pill st-${status}"><span class="dot"></span>${esc(STATUS_LABEL[status] || status)}</span>`;
}
function taskProgress(p) {
  const total = p.tasks.length;
  const done = p.tasks.filter((t) => t.done).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}
function openTasks(p) {
  return p.tasks.filter((t) => !t.done).length;
}

/* ---------- views --------------------------------------------------- */
function viewHome() {
  const projects = state.projects;
  const real = projects.filter((p) => p.id !== 'inbox');
  const activeCount = real.filter((p) => p.status === 'active' || p.status === 'progress').length;
  const allTasks = projects.flatMap((p) => p.tasks.map((t) => ({ ...t, pid: p.id, pname: p.name })));
  const openCount = allTasks.filter((t) => !t.done).length;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const doneToday = allTasks.filter((t) => t.done && (t.doneAt || 0) >= startOfDay.getTime()).length;

  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Focus = open tasks from active/in-progress projects + all inbox, prioritised.
  const focusProjects = new Set(
    projects.filter((p) => p.id === 'inbox' || p.status === 'active' || p.status === 'progress').map((p) => p.id)
  );
  const focus = allTasks
    .filter((t) => !t.done && focusProjects.has(t.pid))
    .sort((a, b) => PRIOS.indexOf(b.prio) - PRIOS.indexOf(a.prio) || (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  const recent = real
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 4);

  let html = topbar('Flowdeck', new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }), {
    right: `<button class="icon-btn" data-action="nav" data-to="settings" aria-label="Settings">⚙</button>`,
  });
  html += `<div class="view">`;
  html += `<div class="greeting">${greet}. You have <b>${openCount} open task${openCount === 1 ? '' : 's'}</b> across <b>${real.length} project${real.length === 1 ? '' : 's'}</b>.</div>`;

  html += `<div class="stats">
    <div class="stat"><div class="n">${real.length}</div><div class="l">Projects</div></div>
    <div class="stat accent"><div class="n">${activeCount}</div><div class="l">Active now</div></div>
    <div class="stat"><div class="n">${openCount}</div><div class="l">Open tasks</div></div>
    <div class="stat green"><div class="n">${doneToday}</div><div class="l">Done today</div></div>
  </div>`;

  html += `<div class="section-title">In focus</div>`;
  if (focus.length === 0) {
    html += `<div class="card"><div class="empty" style="padding:26px 10px"><div class="big">✨</div><h3>All clear</h3><p>No open tasks in your active projects. Capture something new with the ＋ button.</p></div></div>`;
  } else {
    html += `<div class="card">${focus.map((t) => taskRow(t, true)).join('')}</div>`;
  }

  if (real.length === 0) {
    html += `<div class="card"><div class="empty" style="padding:26px 10px">
      <div class="big">🚀</div><h3>Add your first project</h3>
      <p>Track status, tasks and notes — and jump straight into the work from your phone.</p>
      <button class="btn primary" data-action="new-project">＋ New project</button>
      <button class="btn ghost" style="margin-top:10px" data-action="nav" data-to="settings">Connect GitHub</button>
    </div></div>`;
  } else {
    html += `<div class="section-title">Recent projects <button data-action="nav" data-to="projects">See all</button></div>`;
    html += recent.map(projectCard).join('');
  }

  html += `</div>`;
  return html + bottomNav('home');
}

function viewProjects() {
  const filter = viewProjects._filter || 'all';
  let list = state.projects.filter((p) => p.id !== 'inbox');
  const inbox = findProject('inbox');
  if (filter !== 'all') list = list.filter((p) => p.status === filter);
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  let html = topbar('Projects', `${state.projects.length - 1} tracked`, {
    right: `<button class="icon-btn" data-action="new-project" aria-label="New project">＋</button>`,
  });
  html += `<div class="view">`;
  html += `<div class="chips">
    ${chip('all', 'All', filter)}
    ${STATUSES.map((s) => chip(s.key, s.label, filter)).join('')}
  </div>`;

  // Inbox surfaces if it has tasks.
  if (inbox && openTasks(inbox) > 0 && filter === 'all') {
    html += projectCard(inbox);
  }

  if (list.length === 0) {
    html += `<div class="card"><div class="empty"><div class="big">📁</div><h3>${
      filter === 'all' ? 'No projects yet' : 'Nothing here'
    }</h3><p>${filter === 'all' ? 'Create one to start tracking your work.' : 'No projects with this status.'}</p>${
      filter === 'all' ? '<button class="btn primary" data-action="new-project">＋ New project</button>' : ''
    }</div></div>`;
  } else {
    html += list.map(projectCard).join('');
  }
  html += `</div>`;
  return html + bottomNav('projects');
}

function viewProject(id) {
  const p = findProject(id);
  if (!p) {
    go('projects');
    return '';
  }
  const prog = taskProgress(p);
  const isInbox = p.id === 'inbox';

  let html = `<div class="topbar">
    <button class="back-btn" data-action="back" aria-label="Back">‹</button>
    <div style="flex:1;min-width:0"><h1 style="font-size:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(
      p.name
    )}</h1></div>
    ${isInbox ? '' : `<button class="icon-btn" data-action="project-menu" data-id="${p.id}" aria-label="Options">⋯</button>`}
  </div>`;
  html += `<div class="view">`;

  // Status
  if (!isInbox) {
    html += `<div class="card">
      <div class="section-title" style="margin:0 0 10px 0">Status</div>
      <div class="segmented" data-status-for="${p.id}">
        ${STATUSES.map(
          (s) => `<button class="${p.status === s.key ? 'sel' : ''}" data-action="set-status" data-id="${p.id}" data-val="${s.key}">${s.label}</button>`
        ).join('')}
      </div>
    </div>`;
  }

  // Quick actions / links
  const repoFull = ghRepoName(p.repo);
  html += `<div class="section-title">Jump into work</div><div class="link-grid">`;
  html += `<a class="linkbtn" href="https://claude.ai/code" target="_blank" rel="noopener"><span class="ico">✦</span> Claude Code</a>`;
  if (repoFull) {
    html += `<a class="linkbtn" href="https://github.com/${encodeURI(repoFull)}" target="_blank" rel="noopener"><span class="ico">⌥</span> Open repo</a>`;
    html += `<a class="linkbtn" href="https://github.com/${encodeURI(repoFull)}/pulls" target="_blank" rel="noopener"><span class="ico">⇄</span> Pull requests</a>`;
    html += `<a class="linkbtn" href="https://github.com/${encodeURI(repoFull)}/issues" target="_blank" rel="noopener"><span class="ico">◎</span> Issues</a>`;
  } else if (!isInbox) {
    html += `<button class="linkbtn dim" data-action="edit-project" data-id="${p.id}"><span class="ico">＋</span> Link a repo</button>`;
  }
  if (p.links && p.links.deploy)
    html += `<a class="linkbtn" href="${esc(p.links.deploy)}" target="_blank" rel="noopener"><span class="ico">▲</span> Live site</a>`;
  if (p.links && p.links.docs)
    html += `<a class="linkbtn" href="${esc(p.links.docs)}" target="_blank" rel="noopener"><span class="ico">❏</span> Docs</a>`;
  html += `</div>`;

  // GitHub activity
  if (repoFull) {
    const a = p.ghActivity;
    html += `<div class="section-title">GitHub activity <button data-action="refresh-gh" data-id="${p.id}">${
      gh.token ? 'Refresh' : 'Connect'
    }</button></div>`;
    html += `<div class="card" id="gh-panel">`;
    if (!gh.token) {
      html += `<div class="hint" style="margin:0">Add a GitHub token in Settings to pull live pull-request, issue and push activity for <b>${esc(
        repoFull
      )}</b>.</div>`;
    } else if (a) {
      html += `<div class="gh-stats">
        <div class="gh-stat"><div class="n">${a.prs}</div><div class="l">Open PRs</div></div>
        <div class="gh-stat"><div class="n">${a.issues}</div><div class="l">Open issues</div></div>
        <div class="gh-stat"><div class="n" style="font-size:14px;padding-top:3px">${timeAgo(a.pushedAt)}</div><div class="l">Last push</div></div>
      </div><div class="hint">Branch <b>${esc(a.branch)}</b> · synced ${timeAgo(a.fetchedAt)}</div>`;
    } else {
      html += `<div class="hint" style="margin:0">Tap <b>Refresh</b> to load live activity for ${esc(repoFull)}.</div>`;
    }
    html += `</div>`;
  }

  // Tasks
  html += `<div class="section-title">Tasks <span style="color:var(--faint);font-weight:600;text-transform:none;letter-spacing:0">${prog.done}/${prog.total}</span></div>`;
  html += `<div class="card">`;
  html += `<form class="add-row" data-action="add-task" data-id="${p.id}">
      <input class="input" name="title" placeholder="Add a task…" autocomplete="off" />
      <button type="submit" aria-label="Add">＋</button>
    </form>`;
  const openList = p.tasks.filter((t) => !t.done);
  const doneList = p.tasks.filter((t) => t.done);
  if (p.tasks.length === 0) {
    html += `<div class="hint" style="text-align:center;padding:14px 0">No tasks yet — add one above.</div>`;
  } else {
    html += `<div style="margin-top:6px">`;
    html += openList.map((t) => taskRow({ ...t, pid: p.id }, false)).join('');
    if (doneList.length) {
      html += doneList.map((t) => taskRow({ ...t, pid: p.id }, false)).join('');
    }
    html += `</div>`;
  }
  html += `</div>`;

  // Notes
  html += `<div class="section-title">Notes</div>`;
  html += `<div class="card"><textarea class="textarea" data-action="notes" data-id="${p.id}" placeholder="Scratchpad — context, next steps, links…">${esc(
    p.notes || ''
  )}</textarea></div>`;

  html += `</div>`;
  return html + bottomNav('projects');
}

function viewSettings() {
  const connected = !!gh.token;
  let html = topbar('Settings', 'Flowdeck', {
    left: `<button class="back-btn" data-action="back" aria-label="Back">‹</button>`,
  });
  html += `<div class="view">`;

  // GitHub
  html += `<div class="section-title">GitHub</div><div class="card">`;
  if (connected && gh.user) {
    html += `<div class="row-between"><div><b>@${esc(gh.user.login)}</b><div class="hint" style="margin-top:2px">Connected</div></div>
      <button class="btn sm danger" data-action="gh-disconnect">Disconnect</button></div>`;
    html += `<button class="btn" style="margin-top:14px" data-action="gh-import">Import repositories</button>`;
  } else {
    html += `<div class="field" style="margin-bottom:10px"><label>Personal access token</label>
      <input class="input" id="gh-token" type="password" placeholder="ghp_… (repo + read scope)" value="${esc(gh.token)}" autocomplete="off" /></div>
      <button class="btn primary" data-action="gh-connect">Connect</button>
      <div class="hint">Create a fine-grained or classic token with <b>repo</b> read access at github.com → Settings → Developer settings. It's stored only on this device and sent solely to api.github.com.</div>`;
  }
  html += `</div>`;

  // Appearance
  html += `<div class="section-title">Appearance</div><div class="card">
    <div class="field" style="margin:0"><label>Theme</label>
    <div class="segmented">
      ${['auto', 'dark', 'light']
        .map(
          (t) =>
            `<button class="${state.settings.theme === t ? 'sel' : ''}" data-action="set-theme" data-val="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`
        )
        .join('')}
    </div></div>
  </div>`;

  // Data
  html += `<div class="section-title">Your data</div><div class="card">
    <div class="hint" style="margin:0 0 12px">Everything is stored locally on this device. Back it up or move it between devices with export / import.</div>
    <div class="btn-row">
      <button class="btn sm" data-action="export">Export</button>
      <button class="btn sm" data-action="import">Import</button>
    </div>
    <button class="btn danger" style="margin-top:10px" data-action="clear-all">Erase all data</button>
  </div>`;

  html += `<div class="section-title">Install</div><div class="card">
    <div class="hint" style="margin:0">On iPhone: open in <b>Safari</b> → tap the <b>Share</b> icon → <b>Add to Home Screen</b>. Flowdeck then runs full-screen and works offline.</div>
  </div>`;

  html += `<div style="text-align:center;color:var(--faint);font-size:12px;margin:22px 0">Flowdeck · v1 · works offline</div>`;
  html += `</div>`;
  return html + bottomNav('settings');
}

/* ---------- small components --------------------------------------- */
function topbar(title, sub, opts = {}) {
  return `<div class="topbar">
    ${opts.left || ''}
    <div style="flex:1;min-width:0"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>
    ${opts.right || ''}
  </div>`;
}
function chip(val, label, sel) {
  return `<button class="chip ${sel === val ? 'sel' : ''}" data-action="filter" data-val="${val}">${esc(label)}</button>`;
}
function projectCard(p) {
  const prog = taskProgress(p);
  const repoFull = ghRepoName(p.repo);
  const open = openTasks(p);
  return `<div class="card tap" data-action="open-project" data-id="${p.id}">
    <div class="proj-head">
      <div class="name">${esc(p.name)}</div>
      ${p.id === 'inbox' ? `<span class="pill">${open} open</span>` : statusPill(p.status)}
    </div>
    <div class="proj-meta">
      ${repoFull ? `<span>⌥ ${esc(repoFull)}</span>` : ''}
      <span>· ${open} open · updated ${timeAgo(p.updatedAt)}</span>
    </div>
    ${p.tags && p.tags.length ? `<div class="tags-row">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    ${
      prog.total
        ? `<div class="progress"><i style="width:${prog.pct}%"></i></div>
           <div class="progress-label"><span>${prog.done} of ${prog.total} done</span><span>${prog.pct}%</span></div>`
        : ''
    }
  </div>`;
}
function taskRow(t, showProject) {
  return `<div class="task ${t.done ? 'is-done' : ''}">
    <button class="check ${t.done ? 'done' : ''}" data-action="toggle-task" data-id="${t.pid}" data-tid="${t.id}" aria-label="Toggle">✓</button>
    <div class="body">
      <div class="t">${esc(t.title)}</div>
      <div class="sub">
        <button class="prio ${t.prio}" data-action="cycle-prio" data-id="${t.pid}" data-tid="${t.id}" title="Priority" style="border:none;padding:0"></button>
        ${showProject ? `<span>${esc(t.pname)}</span>` : `<span>${t.prio}</span>`}
      </div>
    </div>
    <button class="del" data-action="del-task" data-id="${t.pid}" data-tid="${t.id}" aria-label="Delete">✕</button>
  </div>`;
}
function bottomNav(active) {
  const item = (to, icon, label) =>
    `<a data-action="nav" data-to="${to}" class="${active === to ? 'sel' : ''}"><span class="ni">${icon}</span>${label}</a>`;
  return `<nav class="nav">
    ${item('home', '◈', 'Home')}
    ${item('projects', '▦', 'Projects')}
    ${item('settings', '⚙', 'Settings')}
  </nav>
  <button class="fab" data-action="capture" aria-label="Quick capture">＋</button>`;
}

/* ---------- GitHub repo name parsing -------------------------------- */
function ghRepoName(repo) {
  if (!repo) return '';
  const s = String(repo).trim();
  const m = s.match(/github\.com[/:]([^/]+\/[^/#?.]+)/i);
  if (m) return m[1];
  if (/^[\w.-]+\/[\w.-]+$/.test(s)) return s;
  return '';
}

/* ---------- main render -------------------------------------------- */
function render() {
  applyTheme();
  const { seg, arg } = route();
  const root = $('#app');
  let html;
  switch (seg) {
    case 'projects':
      html = viewProjects();
      break;
    case 'project':
      html = viewProject(arg);
      break;
    case 'settings':
      html = viewSettings();
      break;
    case 'capture':
      html = viewHome();
      setTimeout(openCapture, 0);
      history.replaceState(null, '', '#/');
      break;
    default:
      html = viewHome();
  }
  root.innerHTML = html;
  window.scrollTo(0, 0);
}

function applyTheme() {
  const t = state.settings.theme || 'auto';
  const el = document.documentElement;
  if (t === 'auto') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', t);
}

/* ---------- sheets / modals ---------------------------------------- */
function closeSheet() {
  const r = $('#modal-root');
  if (r) r.innerHTML = '';
}
function openSheet(inner) {
  const r = $('#modal-root');
  r.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"><div class="sheet" data-stop="1"><div class="grip"></div>${inner}</div></div>`;
}

function openCapture() {
  const opts = state.projects
    .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
    .join('');
  openSheet(`<h3>Quick capture</h3>
    <form data-action="submit-capture">
      <div class="field"><input class="input" name="title" placeholder="What needs doing?" autocomplete="off" /></div>
      <div class="field"><label>Project</label><select class="selectbox" name="project">${opts}</select></div>
      <div class="field"><label>Priority</label>
        <div class="segmented">
          ${PRIOS.map((pr, i) => `<button type="button" class="prio-pick ${i === 0 ? 'sel' : ''}" data-val="${pr}">${pr[0].toUpperCase() + pr.slice(1)}</button>`).join('')}
        </div>
        <input type="hidden" name="prio" value="low" />
      </div>
      <button class="btn primary" type="submit">Add task</button>
    </form>`);
  setTimeout(() => $('#modal-root input[name=title]')?.focus(), 60);
}

function openProjectForm(existing) {
  const p = existing || { name: '', repo: '', status: 'active', tags: [], links: {} };
  openSheet(`<h3>${existing ? 'Edit project' : 'New project'}</h3>
    <form data-action="submit-project" data-id="${existing ? existing.id : ''}">
      <div class="field"><label>Name</label><input class="input" name="name" value="${esc(p.name)}" placeholder="My project" autocomplete="off" required /></div>
      <div class="field"><label>Repository <span style="color:var(--faint)">(owner/name or URL)</span></label><input class="input" name="repo" value="${esc(p.repo)}" placeholder="octocat/hello-world" autocomplete="off" /></div>
      <div class="field"><label>Tags <span style="color:var(--faint)">(comma separated)</span></label><input class="input" name="tags" value="${esc((p.tags || []).join(', '))}" placeholder="web, react, urgent" autocomplete="off" /></div>
      <div class="field"><label>Live site URL</label><input class="input" name="deploy" value="${esc(p.links?.deploy || '')}" placeholder="https://…" autocomplete="off" /></div>
      <div class="field"><label>Docs URL</label><input class="input" name="docs" value="${esc(p.links?.docs || '')}" placeholder="https://…" autocomplete="off" /></div>
      <button class="btn primary" type="submit">${existing ? 'Save' : 'Create project'}</button>
    </form>`);
  setTimeout(() => $('#modal-root input[name=name]')?.focus(), 60);
}

function openProjectMenu(id) {
  const p = findProject(id);
  if (!p) return;
  openSheet(`<h3>${esc(p.name)}</h3>
    <div class="menu-item" data-action="edit-project" data-id="${id}"><span>✎</span> Edit project</div>
    <div class="menu-item danger" data-action="delete-project" data-id="${id}"><span>🗑</span> Delete project</div>`);
}

async function openRepoImport() {
  openSheet(`<h3>Import repositories</h3><div class="hint" id="imp-status">Loading your repositories…</div>`);
  try {
    const repos = await gh.repos();
    const existing = new Set(state.projects.map((p) => ghRepoName(p.repo)).filter(Boolean));
    const rows = repos
      .map((r) => {
        const has = existing.has(r.full_name);
        return `<div class="repo-row">
          <div class="info"><div class="rn">${esc(r.full_name)}${r.private ? ' 🔒' : ''}</div>
          <div class="rd">${esc(r.description || (r.language ? r.language : 'No description'))}</div></div>
          ${
            has
              ? `<span class="pill">Added</span>`
              : `<button class="btn sm" data-action="import-repo" data-repo="${esc(r.full_name)}" data-desc="${esc((r.language || '').toLowerCase())}">Add</button>`
          }
        </div>`;
      })
      .join('');
    openSheet(`<h3>Import repositories</h3><div style="max-height:60vh;overflow:auto;margin:0 -4px">${rows || '<div class="hint">No repositories found.</div>'}</div>`);
  } catch (e) {
    openSheet(`<h3>Import repositories</h3><div class="hint">Couldn't load repos (${esc(e.message)}). Check your token in Settings.</div>`);
  }
}

/* ---------- actions / event delegation ------------------------------ */
document.addEventListener('click', async (e) => {
  const backdrop = e.target.closest('[data-action="close-sheet"]');
  if (backdrop && !e.target.closest('[data-stop]')) {
    closeSheet();
    return;
  }
  // priority picker inside capture sheet
  const pick = e.target.closest('.prio-pick');
  if (pick) {
    pick.parentElement.querySelectorAll('.prio-pick').forEach((b) => b.classList.remove('sel'));
    pick.classList.add('sel');
    const hidden = pick.closest('form').querySelector('input[name=prio]');
    if (hidden) hidden.value = pick.dataset.val;
    return;
  }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id, tid, to, val } = el.dataset;

  switch (action) {
    case 'nav':
      closeSheet();
      go(to);
      break;
    case 'back':
      history.length > 1 ? history.back() : go('home');
      break;
    case 'open-project':
      go('project/' + id);
      break;
    case 'new-project':
      openProjectForm(null);
      break;
    case 'edit-project':
      closeSheet();
      openProjectForm(findProject(id));
      break;
    case 'project-menu':
      openProjectMenu(id);
      break;
    case 'delete-project':
      state.projects = state.projects.filter((p) => p.id !== id);
      save();
      closeSheet();
      go('projects');
      toast('Project deleted');
      break;
    case 'set-status': {
      const p = findProject(id);
      if (p) {
        p.status = val;
        touch(p);
        save();
        render();
      }
      break;
    }
    case 'filter':
      viewProjects._filter = val;
      render();
      break;
    case 'toggle-task': {
      const p = findProject(id);
      const t = p && p.tasks.find((x) => x.id === tid);
      if (t) {
        t.done = !t.done;
        t.doneAt = t.done ? Date.now() : null;
        touch(p);
        save();
        render();
      }
      break;
    }
    case 'cycle-prio': {
      const p = findProject(id);
      const t = p && p.tasks.find((x) => x.id === tid);
      if (t) {
        t.prio = PRIO_NEXT[t.prio] || 'med';
        save();
        render();
      }
      break;
    }
    case 'del-task': {
      const p = findProject(id);
      if (p) {
        p.tasks = p.tasks.filter((x) => x.id !== tid);
        touch(p);
        save();
        render();
      }
      break;
    }
    case 'capture':
      openCapture();
      break;
    case 'close-sheet':
      closeSheet();
      break;
    case 'refresh-gh':
      await refreshGh(id);
      break;
    case 'set-theme':
      state.settings.theme = val;
      save();
      render();
      break;
    case 'gh-connect':
      await connectGh();
      break;
    case 'gh-disconnect':
      gh.setToken('');
      gh.user = null;
      toast('Disconnected');
      render();
      break;
    case 'gh-import':
      openRepoImport();
      break;
    case 'import-repo':
      importRepo(el.dataset.repo, el.dataset.desc);
      el.outerHTML = '<span class="pill">Added</span>';
      break;
    case 'export':
      exportData();
      break;
    case 'import':
      importData();
      break;
    case 'clear-all':
      if (confirm('Erase all Flowdeck data on this device? This cannot be undone.')) {
        localStorage.removeItem(STORE_KEY);
        state = defaultState();
        save();
        toast('Data erased');
        go('home');
        render();
      }
      break;
  }
});

/* form submits (capture, project, gh) */
document.addEventListener('submit', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  e.preventDefault();
  const action = el.dataset.action;
  const data = Object.fromEntries(new FormData(el).entries());

  if (action === 'add-task') {
    const title = (data.title || '').trim();
    if (!title) return;
    const p = findProject(el.dataset.id);
    if (p) {
      p.tasks.unshift({ id: uid(), title, done: false, prio: 'low', createdAt: Date.now() });
      touch(p);
      save();
      render();
    }
  } else if (action === 'submit-capture') {
    const title = (data.title || '').trim();
    if (!title) return;
    const p = findProject(data.project) || findProject('inbox');
    p.tasks.unshift({ id: uid(), title, done: false, prio: data.prio || 'low', createdAt: Date.now() });
    touch(p);
    save();
    closeSheet();
    toast('Added to ' + p.name);
    render();
  } else if (action === 'submit-project') {
    const name = (data.name || '').trim();
    if (!name) return;
    const tags = (data.tags || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const links = {};
    if (data.deploy && data.deploy.trim()) links.deploy = data.deploy.trim();
    if (data.docs && data.docs.trim()) links.docs = data.docs.trim();
    const id = el.dataset.id;
    if (id) {
      const p = findProject(id);
      Object.assign(p, { name, repo: data.repo.trim(), tags, links });
      p.ghActivity = null;
      touch(p);
    } else {
      state.projects.push({
        id: uid(),
        name,
        repo: (data.repo || '').trim(),
        status: 'active',
        tags,
        notes: '',
        links,
        tasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    save();
    closeSheet();
    render();
    toast(id ? 'Saved' : 'Project created');
  }
});

/* notes autosave on blur */
document.addEventListener(
  'blur',
  (e) => {
    const ta = e.target.closest('[data-action="notes"]');
    if (ta) {
      const p = findProject(ta.dataset.id);
      if (p && p.notes !== ta.value) {
        p.notes = ta.value;
        touch(p);
        save();
      }
    }
  },
  true
);

/* ---------- GitHub actions ----------------------------------------- */
async function connectGh() {
  const input = $('#gh-token');
  const token = (input && input.value.trim()) || '';
  if (!token) {
    toast('Paste a token first');
    return;
  }
  gh.setToken(token);
  try {
    gh.user = await gh.me();
    toast('Connected as @' + gh.user.login);
    render();
  } catch (err) {
    gh.setToken('');
    toast(err.status === 401 ? 'Invalid token' : 'Connection failed');
  }
}

async function refreshGh(id) {
  const p = findProject(id);
  const repo = ghRepoName(p && p.repo);
  if (!repo) return;
  if (!gh.token) {
    go('settings');
    return;
  }
  const panel = $('#gh-panel');
  if (panel) panel.innerHTML = '<div class="hint" style="margin:0">Loading…</div>';
  try {
    p.ghActivity = await gh.activity(repo);
    save();
    render();
  } catch (err) {
    if (panel)
      panel.innerHTML = `<div class="hint" style="margin:0">Couldn't load (${esc(err.message)}). ${
        err.status === 401 ? 'Reconnect in Settings.' : ''
      }</div>`;
  }
}

function importRepo(fullName, lang) {
  if (state.projects.some((p) => ghRepoName(p.repo) === fullName)) return;
  const name = fullName.split('/')[1];
  state.projects.push({
    id: uid(),
    name,
    repo: fullName,
    status: 'active',
    tags: lang ? [lang] : [],
    notes: '',
    links: {},
    tasks: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  save();
  toast('Imported ' + name);
}

/* ---------- data export / import ------------------------------------ */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flowdeck-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported');
}
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.projects)) throw new Error('bad file');
        state = parsed;
        if (!state.projects.some((p) => p.id === 'inbox')) state.projects.unshift(defaultState().projects[0]);
        state.settings = state.settings || { theme: 'auto' };
        save();
        toast('Imported');
        go('home');
        render();
      } catch (e) {
        toast('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ---------- boot ---------------------------------------------------- */
(async function boot() {
  applyTheme();
  render();
  if (gh.token) {
    try {
      gh.user = await gh.me();
      if (route().seg === 'settings') render();
    } catch (e) {
      /* token invalid — surfaced when the user visits Settings */
    }
  }
})();
