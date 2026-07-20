/* Ops Hub — private multi-brand order operations.
 *
 * Data layer talks to Supabase over its REST API (PostgREST) with a staff JWT;
 * Row Level Security keeps order data private. With no SUPABASE_URL configured
 * the Hub runs in DEMO mode against local fixtures so the UI can be previewed.
 * No build step, no dependencies. */

const CFG = window.HUB_CONFIG || {};
const LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
const TOKEN_KEY = 'opshub.session.v1';

/* ---------- utils --------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (c) => '$' + (((c || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function timeAgo(ts) {
  const t = typeof ts === 'string' ? Date.parse(ts) : ts;
  if (!t) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
  return Math.floor(d / 7) + 'w ago';
}
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1900);
}
const STATUSES = ['pending', 'paid', 'fulfilled', 'failed', 'expired'];
const STATUS_LABEL = { pending: 'Pending', paid: 'Paid', fulfilled: 'Fulfilled', failed: 'Failed', expired: 'Expired' };

/* ---------- state --------------------------------------------------- */
const state = { session: null, storesById: {}, filterBrand: 'all', filterStatus: 'all' };

/* ---------- backend: demo fixtures ---------------------------------- */
const demo = (() => {
  const stores = [
    { slug: 'aminos', name: 'Aminos & More', domain: 'aminosandmore.com', order_prefix: 'AM', label_profile: { packaging: 'Aminos & More white-label vials + AM insert card', accent: '#4f46e5' } },
    { slug: 'getwll', name: 'getWLL', domain: 'getwll.com', order_prefix: 'WL', label_profile: { packaging: 'WLL branded box + WLL compliance insert', accent: '#0ea5a4' } },
  ];
  const now = Date.now();
  const mk = (id, store, status, mins, email, items, total, extra = {}) => ({
    id, store_slug: store, status, created_at: new Date(now - mins * 60000).toISOString(),
    email, items, total_cents: total, subtotal_cents: total - 900, shipping_cents: 900, tax_cents: 0,
    ship_name: extra.name || 'Jordan Lee', ship_street1: '221 Baker St', ship_city: 'Austin', ship_state: 'TX', ship_zip: '78701', ship_country: 'US',
    ship_carrier: 'USPS', ship_service: 'Priority', tracking_number: extra.tracking || null, label_url: extra.label || null,
    np_payment_status: status === 'pending' ? 'waiting' : 'finished', pay_currency: 'USDTTRC20', np_invoice_id: 'inv_' + id.slice(-4),
    ...extra,
  });
  const orders = [
    mk('AM-1A2B3C4D', 'aminos', 'paid', 22, 'jordan@example.com', [{ sku: 'BPC157', name: 'BPC-157 (5mg)', size: '5mg', qty: 2, unit_cents: 6500 }], 14900),
    mk('WL-9Z8Y7X6W', 'getwll', 'paid', 48, 'sam@example.com', [{ sku: 'TB500', name: 'WLL TB-500 5mg', size: '5mg', qty: 1, unit_cents: 7900 }], 8800, { name: 'Sam Rivera' }),
    mk('AM-5E6F7G8H', 'aminos', 'fulfilled', 210, 'alex@example.com', [{ sku: 'GHKCU', name: 'GHK-Cu (50mg)', size: '50mg', qty: 1, unit_cents: 5500 }], 6400, { tracking: '9400111899223', label: '#', name: 'Alex Kim' }),
    mk('WL-2Q3R4S5T', 'getwll', 'pending', 6, 'chris@example.com', [{ sku: 'BPC157', name: 'WLL BPC-157 5mg', size: '5mg', qty: 1, unit_cents: 6900 }], 7800, { name: 'Chris Park' }),
    mk('AM-8K9L0M1N', 'aminos', 'fulfilled', 1500, 'taylor@example.com', [{ sku: 'MOTSC', name: 'MOTS-c (10mg)', size: '10mg', qty: 3, unit_cents: 8000 }], 24900, { tracking: '9400111899999', label: '#', name: 'Taylor Fox' }),
    mk('WL-3U4V5W6X', 'getwll', 'paid', 95, 'morgan@example.com', [{ sku: 'GLOW', name: 'WLL GLOW Blend', size: 'kit', qty: 1, unit_cents: 12000 }], 12900, { name: 'Morgan Bell' }),
  ];
  const inventory = [
    { sku: 'BPC157', on_hand: 120, products: { name: 'BPC-157', peptide: 'BPC-157' } },
    { sku: 'TB500', on_hand: 85, products: { name: 'TB-500', peptide: 'TB-500' } },
    { sku: 'GHKCU', on_hand: 8, products: { name: 'GHK-Cu', peptide: 'GHK-Cu' } },
    { sku: 'MOTSC', on_hand: 0, products: { name: 'MOTS-c', peptide: 'MOTS-c' } },
    { sku: 'NADP', on_hand: 30, products: { name: 'NAD+', peptide: 'NAD+' } },
    { sku: 'GLOW', on_hand: 50, products: { name: 'GLOW Blend', peptide: 'GLOW' } },
  ];
  return { stores, orders, inventory };
})();

/* ---------- backend: Supabase REST --------------------------------- */
async function sb(path, opts = {}) {
  const token = state.session?.access_token || CFG.SUPABASE_ANON_KEY;
  const res = await fetch(CFG.SUPABASE_URL + '/rest/v1' + path, {
    ...opts,
    headers: { apikey: CFG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) { const e = new Error('Supabase ' + res.status); e.status = res.status; throw e; }
  return res.status === 204 ? null : res.json();
}

const api = {
  async stores() {
    return LIVE ? sb('/stores?select=*') : demo.stores;
  },
  async orders() {
    if (!LIVE) return demo.orders.slice().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    return sb('/orders?select=*&order=created_at.desc&limit=200');
  },
  async order(id) {
    if (!LIVE) return demo.orders.find((o) => o.id === id);
    const r = await sb('/orders?select=*&id=eq.' + encodeURIComponent(id));
    return r[0];
  },
  async inventory() {
    if (!LIVE) return demo.inventory;
    return sb('/inventory?select=sku,on_hand,reserved,products(name,peptide)&order=on_hand.asc');
  },
  async setStatus(id, status) {
    if (!LIVE) { const o = demo.orders.find((x) => x.id === id); if (o) o.status = status; return o; }
    const r = await sb('/orders?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status }),
    });
    return r[0];
  },
};

/* ---------- auth ---------------------------------------------------- */
async function signIn(email, password) {
  const res = await fetch(CFG.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: CFG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Sign-in failed');
  state.session = data;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user }));
  return data;
}
function signOut() { state.session = null; localStorage.removeItem(TOKEN_KEY); location.hash = ''; render(); }
function restoreSession() { try { const s = JSON.parse(localStorage.getItem(TOKEN_KEY)); if (s?.access_token) state.session = s; } catch (e) {} }

/* ---------- routing ------------------------------------------------- */
const route = () => { const h = location.hash.replace(/^#\/?/, ''); const [seg, arg] = h.split('/'); return { seg: seg || 'orders', arg }; };
const go = (p) => { location.hash = p; };
window.addEventListener('hashchange', render);

/* ---------- components --------------------------------------------- */
function brandBadge(slug) {
  const s = state.storesById[slug];
  const accent = s?.label_profile?.accent || '#5b6cff';
  return `<span class="brand" style="background:${esc(accent)}"><span class="b-dot"></span>${esc(s?.name || slug)}</span>`;
}
const statusPill = (st) => `<span class="pill st-${st}"><span class="dot"></span>${esc(STATUS_LABEL[st] || st)}</span>`;
function topbar(title, sub, opts = {}) {
  return `<div class="topbar">${opts.left || ''}<div style="flex:1;min-width:0"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>${opts.right || ''}</div>`;
}
function bottomNav(active) {
  const item = (to, icon, label) => `<a data-action="nav" data-to="${to}" class="${active === to ? 'sel' : ''}"><span class="ni">${icon}</span>${label}</a>`;
  return `<nav class="nav">${item('orders', '▤', 'Orders')}${item('inventory', '▦', 'Inventory')}${item('settings', '⚙', 'Settings')}</nav>`;
}
function orderRow(o) {
  const count = (o.items || []).reduce((n, i) => n + (i.qty || 1), 0);
  return `<div class="order" data-action="open-order" data-id="${esc(o.id)}">
    <div class="oi">
      <div class="oid">${esc(o.id)}</div>
      <div class="om">${brandBadge(o.store_slug)} ${statusPill(o.status)} <span>${count} item${count === 1 ? '' : 's'} · ${timeAgo(o.created_at)}</span></div>
    </div>
    <div class="amt">${money(o.total_cents)}<small>${esc(o.email || '')}</small></div>
  </div>`;
}

/* ---------- views --------------------------------------------------- */
let cache = { orders: null, inventory: null };

async function viewOrders() {
  const root = $('#app');
  root.innerHTML = topbar('Orders', LIVE ? 'Live · all brands' : 'Demo data · all brands', {
    right: `<button class="icon-btn" data-action="refresh" aria-label="Refresh">⟳</button>`,
  }) + `<div class="view"><div class="center"><div class="spin"></div>Loading orders…</div></div>` + bottomNav('orders');
  let orders;
  try { orders = cache.orders = await api.orders(); }
  catch (e) { return renderError(e, 'orders'); }

  const inv = cache.inventory || (cache.inventory = await api.inventory().catch(() => []));
  const startDay = new Date(); startDay.setHours(0, 0, 0, 0);
  const todays = orders.filter((o) => Date.parse(o.created_at) >= startDay.getTime());
  const revenue = orders.filter((o) => o.status === 'paid' || o.status === 'fulfilled').reduce((s, o) => s + (o.total_cents || 0), 0);
  const toShip = orders.filter((o) => o.status === 'paid').length;
  const lowStock = inv.filter((i) => (i.on_hand || 0) <= 10).length;

  const filtered = orders.filter((o) =>
    (state.filterBrand === 'all' || o.store_slug === state.filterBrand) &&
    (state.filterStatus === 'all' || o.status === state.filterStatus));

  let html = topbar('Orders', LIVE ? 'Live · all brands' : 'Demo data · all brands', {
    right: `<button class="icon-btn" data-action="refresh" aria-label="Refresh">⟳</button>`,
  });
  html += `<div class="view">`;
  if (!LIVE) html += `<div class="banner">Showing <b>demo data</b>. Add your Supabase URL + anon key in <b>config.js</b> to go live.</div>`;
  html += `<div class="stats">
    <div class="stat"><div class="n">${todays.length}</div><div class="l">Orders today</div></div>
    <div class="stat green"><div class="n">${money(revenue)}</div><div class="l">Paid revenue</div></div>
    <div class="stat amber"><div class="n">${toShip}</div><div class="l">Ready to ship</div></div>
    <div class="stat ${lowStock ? 'amber' : ''}"><div class="n">${lowStock}</div><div class="l">Low stock SKUs</div></div>
  </div>`;

  // brand filter
  html += `<div class="chips">${chip('brand', 'all', 'All brands')}${state.stores.map((s) => chip('brand', s.slug, s.name)).join('')}</div>`;
  // status filter
  html += `<div class="chips">${chip('status', 'all', 'All')}${STATUSES.map((s) => chip('status', s, STATUS_LABEL[s])).join('')}</div>`;

  if (!filtered.length) {
    html += `<div class="card"><div class="empty"><div class="big">📦</div><h3>No orders</h3><p>Nothing matches this filter yet.</p></div></div>`;
  } else {
    html += `<div class="card" style="padding:6px 16px">${filtered.map(orderRow).join('')}</div>`;
  }
  html += `</div>` + bottomNav('orders');
  root.innerHTML = html;
}
function chip(kind, val, label) {
  const sel = (kind === 'brand' ? state.filterBrand : state.filterStatus) === val;
  return `<button class="chip ${sel ? 'sel' : ''}" data-action="filter-${kind}" data-val="${esc(val)}">${esc(label)}</button>`;
}

async function viewOrder(id) {
  const root = $('#app');
  root.innerHTML = `<div class="topbar"><button class="back-btn" data-action="back">‹</button><div style="flex:1"><h1 style="font-size:19px">${esc(id)}</h1></div></div><div class="view"><div class="center"><div class="spin"></div></div></div>`;
  let o;
  try { o = await api.order(id); } catch (e) { return renderError(e, 'orders'); }
  if (!o) { go('orders'); return; }
  const s = state.storesById[o.store_slug] || {};
  const accent = s.label_profile?.accent || '#5b6cff';
  const packaging = s.label_profile?.packaging || 'See brand packaging profile';

  let html = `<div class="topbar"><button class="back-btn" data-action="back">‹</button><div style="flex:1;min-width:0"><h1 style="font-size:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.id)}</h1><div class="sub">${timeAgo(o.created_at)}</div></div>${statusPill(o.status)}</div>`;
  html += `<div class="view">`;

  // THE fulfillment answer
  html += `<div class="packbanner" style="background:linear-gradient(135deg,${esc(accent)},#0b1220)">
    <div class="k">Pack &amp; label as</div>
    <div class="v">${esc(s.name || o.store_slug)}</div>
    <div class="p">${esc(packaging)}</div>
  </div>`;

  // items
  html += `<div class="section-title">Items</div><div class="card">`;
  html += (o.items || []).map((i) => `<div class="line"><span>${esc(i.name || i.sku)}${i.size ? ` · ${esc(i.size)}` : ''}</span><span class="q">×${i.qty || 1} · ${money((i.unit_cents || 0) * (i.qty || 1))}</span></div>`).join('') || '<div class="hint">No line items.</div>';
  html += `<div class="kv" style="margin-top:6px"><span class="k">Subtotal</span><span class="v">${money(o.subtotal_cents)}</span></div>
    <div class="kv"><span class="k">Shipping</span><span class="v">${money(o.shipping_cents)}</span></div>
    ${o.tax_cents ? `<div class="kv"><span class="k">Tax</span><span class="v">${money(o.tax_cents)}</span></div>` : ''}
    <div class="kv"><span class="k">Total</span><span class="v" style="font-size:16px">${money(o.total_cents)}</span></div></div>`;

  // ship to
  html += `<div class="section-title">Ship to</div><div class="card">
    <div class="kv"><span class="k">Name</span><span class="v">${esc(o.ship_name || '—')}</span></div>
    <div class="kv"><span class="k">Address</span><span class="v">${esc([o.ship_street1, o.ship_street2].filter(Boolean).join(', '))}<br>${esc([o.ship_city, o.ship_state, o.ship_zip].filter(Boolean).join(', '))} ${esc(o.ship_country || '')}</span></div>
    <div class="kv"><span class="k">Email</span><span class="v">${esc(o.email || '—')}</span></div>
  </div>`;

  // payment
  html += `<div class="section-title">Payment · NOWPayments</div><div class="card">
    <div class="kv"><span class="k">Status</span><span class="v">${esc(o.np_payment_status || '—')}</span></div>
    <div class="kv"><span class="k">Currency</span><span class="v">${esc(o.pay_currency || '—')}</span></div>
    <div class="kv"><span class="k">Invoice</span><span class="v">${esc(o.np_invoice_id || '—')}</span></div>
  </div>`;

  // fulfillment
  html += `<div class="section-title">Fulfillment · Shippo</div><div class="card">
    <div class="kv"><span class="k">Carrier</span><span class="v">${esc(o.ship_carrier || '—')} ${esc(o.ship_service || '')}</span></div>
    <div class="kv"><span class="k">Tracking</span><span class="v">${esc(o.tracking_number || 'not shipped')}</span></div>
    ${o.label_url ? `<a class="linkbtn" style="margin-top:10px" href="${esc(o.label_url)}" target="_blank" rel="noopener"><span class="ico">▤</span> Open shipping label</a>` : ''}
  </div>`;

  // actions
  html += `<div class="btn-row" style="margin-top:6px">`;
  if (o.status !== 'fulfilled') html += `<button class="btn primary" data-action="mark" data-id="${esc(o.id)}" data-status="fulfilled">Mark fulfilled</button>`;
  if (o.status === 'pending') html += `<button class="btn" data-action="mark" data-id="${esc(o.id)}" data-status="paid">Mark paid</button>`;
  html += `</div>`;

  html += `</div>`;
  root.innerHTML = html + bottomNav('orders');
}

async function viewInventory() {
  const root = $('#app');
  root.innerHTML = topbar('Inventory', 'Shared across brands') + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('inventory');
  let inv;
  try { inv = cache.inventory = await api.inventory(); } catch (e) { return renderError(e, 'inventory'); }
  let html = topbar('Inventory', 'Shared across brands');
  html += `<div class="view"><div class="banner">One shared stock pool — every brand draws from the same counts.</div><div class="card" style="padding:6px 16px">`;
  html += inv.map((i) => {
    const n = i.on_hand || 0; const cls = n === 0 ? 'out' : n <= 10 ? 'low' : '';
    const nm = i.products?.name || i.sku;
    return `<div class="inv"><div class="in"><div class="nm">${esc(nm)}</div><div class="sk">${esc(i.sku)}</div></div><div class="ct ${cls}">${n}${n === 0 ? ' · out' : n <= 10 ? ' · low' : ''}</div></div>`;
  }).join('') || '<div class="hint">No inventory rows.</div>';
  html += `</div></div>` + bottomNav('inventory');
  root.innerHTML = html;
}

function viewSettings() {
  const root = $('#app');
  let html = topbar('Settings', 'Ops Hub');
  html += `<div class="view">`;
  html += `<div class="section-title">Connection</div><div class="card">
    <div class="kv"><span class="k">Mode</span><span class="v">${LIVE ? 'Live (Supabase)' : 'Demo (local fixtures)'}</span></div>
    ${LIVE ? `<div class="kv"><span class="k">Project</span><span class="v">${esc((CFG.SUPABASE_URL || '').replace('https://', ''))}</span></div>` : ''}
    ${LIVE && state.session?.user ? `<div class="kv"><span class="k">Signed in</span><span class="v">${esc(state.session.user.email)}</span></div>` : ''}
    ${!LIVE ? `<div class="hint">Set <b>SUPABASE_URL</b> and <b>SUPABASE_ANON_KEY</b> in config.js, then apply db/schema.sql, to connect real orders.</div>` : ''}
  </div>`;
  html += `<div class="section-title">Brands</div><div class="card">`;
  html += state.stores.map((s) => `<div class="kv"><span class="k">${brandBadge(s.slug)}</span><span class="v">${esc(s.domain || '')}</span></div>`).join('');
  html += `<div class="hint">Add a brand by inserting a row in the <b>stores</b> table; new storefronts just write orders with their slug.</div></div>`;
  if (LIVE) html += `<button class="btn danger" data-action="signout" style="margin-top:6px;color:var(--red);border-color:rgba(248,113,113,.4)">Sign out</button>`;
  html += `<div style="text-align:center;color:var(--faint);font-size:12px;margin:22px 0">Ops Hub · v1 · private</div>`;
  html += `</div>` + bottomNav('settings');
  root.innerHTML = html;
}

function renderError(e, back) {
  $('#app').innerHTML = topbar('Something went wrong') + `<div class="view"><div class="card"><div class="empty"><div class="big">⚠️</div><h3>Couldn't load</h3><p>${esc(e.message)}${e.status === 401 ? ' — your session may have expired.' : ''}</p><button class="btn" data-action="nav" data-to="${back}">Retry</button>${e.status === 401 ? '<button class="btn ghost" style="margin-top:10px" data-action="signout">Sign in again</button>' : ''}</div></div></div>` + bottomNav(back);
}

/* ---------- login --------------------------------------------------- */
function viewLogin(msg) {
  $('#app').innerHTML = `<div class="login">
    <div class="logo"><svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><circle cx="6.5" cy="7.5" r="1.4"/><rect x="9.5" y="6.2" width="9" height="2.6" rx="1.1"/><circle cx="6.5" cy="12" r="1.4"/><rect x="9.5" y="10.7" width="9" height="2.6" rx="1.1"/><circle cx="6.5" cy="16.5" r="1.4"/><rect x="9.5" y="15.2" width="9" height="2.6" rx="1.1"/></svg></div>
    <h1>Ops Hub</h1><p>Private back office — staff sign in</p>
    ${msg ? `<div class="banner" style="text-align:left;color:var(--red)">${esc(msg)}</div>` : ''}
    <form data-action="login">
      <div class="field"><label>Email</label><input class="input" name="email" type="email" autocomplete="username" required /></div>
      <div class="field"><label>Password</label><input class="input" name="password" type="password" autocomplete="current-password" required /></div>
      <button class="btn primary" type="submit">Sign in</button>
    </form>
    <div class="hint" style="margin-top:16px">Access is limited to accounts in the <b>staff</b> table. Data is protected by Supabase Row Level Security.</div>
  </div>`;
}

/* ---------- main render -------------------------------------------- */
async function render() {
  if (LIVE && !state.session) return viewLogin();
  if (!state.stores) {
    try { state.stores = await api.stores(); state.storesById = Object.fromEntries(state.stores.map((s) => [s.slug, s])); }
    catch (e) { return renderError(e, 'orders'); }
  }
  const { seg, arg } = route();
  if (seg === 'order') return viewOrder(arg);
  if (seg === 'inventory') return viewInventory();
  if (seg === 'settings') return viewSettings();
  return viewOrders();
}

/* ---------- events -------------------------------------------------- */
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]'); if (!el) return;
  const { action, to, id, val, status } = el.dataset;
  switch (action) {
    case 'nav': go(to); break;
    case 'back': history.length > 1 ? history.back() : go('orders'); break;
    case 'open-order': go('order/' + id); break;
    case 'filter-brand': state.filterBrand = val; viewOrders(); break;
    case 'filter-status': state.filterStatus = val; viewOrders(); break;
    case 'refresh': cache.orders = cache.inventory = null; toast('Refreshed'); render(); break;
    case 'signout': signOut(); break;
    case 'mark':
      try { await api.setStatus(id, status); toast('Marked ' + status); cache.orders = null; viewOrder(id); }
      catch (err) { toast(err.status === 401 ? 'Session expired' : 'Update failed'); }
      break;
  }
});
document.addEventListener('submit', async (e) => {
  const el = e.target.closest('[data-action="login"]'); if (!el) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(el).entries());
  const btn = el.querySelector('button[type=submit]'); btn.textContent = 'Signing in…'; btn.disabled = true;
  try { await signIn(d.email, d.password); location.hash = ''; render(); }
  catch (err) { viewLogin(err.message); }
});

/* ---------- boot ---------------------------------------------------- */
restoreSession();
render();
