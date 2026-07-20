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
function closeSheet() { const r = $('#modal-root'); if (r) r.innerHTML = ''; }
function openSheet(inner) {
  const r = $('#modal-root');
  r.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"><div class="sheet" data-stop="1"><div class="grip"></div>${inner}</div></div>`;
}
const STATUSES = ['pending', 'paid', 'fulfilled', 'failed', 'expired'];
const STATUS_LABEL = { pending: 'Pending', paid: 'Paid', fulfilled: 'Fulfilled', failed: 'Failed', expired: 'Expired' };

/* ---------- state --------------------------------------------------- */
const state = { session: null, storesById: {}, filterBrand: 'all', filterStatus: 'all', search: '', range: '30d', anTable: false, custSearch: '' };
let analyticsDays = []; // stash for the time-chart tap readout

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
    mk('AM-5E6F7G8H', 'aminos', 'fulfilled', 3 * 1440, 'alex@example.com', [{ sku: 'GHKCU', name: 'GHK-Cu (50mg)', size: '50mg', qty: 1, unit_cents: 5500 }], 6400, { tracking: '9400111899223', label: '#', name: 'Alex Kim' }),
    mk('WL-2Q3R4S5T', 'getwll', 'pending', 6, 'chris@example.com', [{ sku: 'BPC157', name: 'WLL BPC-157 5mg', size: '5mg', qty: 1, unit_cents: 6900 }], 7800, { name: 'Chris Park' }),
    mk('AM-8K9L0M1N', 'aminos', 'fulfilled', 6 * 1440, 'taylor@example.com', [{ sku: 'MOTSC', name: 'MOTS-c (10mg)', size: '10mg', qty: 3, unit_cents: 8000 }], 24900, { tracking: '9400111899999', label: '#', name: 'Taylor Fox' }),
    mk('WL-3U4V5W6X', 'getwll', 'paid', 4 * 1440, 'jordan@example.com', [{ sku: 'GLOW', name: 'WLL GLOW Blend', size: 'kit', qty: 1, unit_cents: 12000 }], 12900, { name: 'Jordan Lee' }),
  ];
  const inventory = [
    { sku: 'BPC157', on_hand: 120, products: { name: 'BPC-157', peptide: 'BPC-157' } },
    { sku: 'TB500', on_hand: 85, products: { name: 'TB-500', peptide: 'TB-500' } },
    { sku: 'GHKCU', on_hand: 8, products: { name: 'GHK-Cu', peptide: 'GHK-Cu' } },
    { sku: 'MOTSC', on_hand: 0, products: { name: 'MOTS-c', peptide: 'MOTS-c' } },
    { sku: 'NADP', on_hand: 30, products: { name: 'NAD+', peptide: 'NAD+' } },
    { sku: 'GLOW', on_hand: 50, products: { name: 'GLOW Blend', peptide: 'GLOW' } },
  ];
  const lots = [
    { id: 1, lot_code: 'BPC157-2405A', sku: 'BPC157', purity: 99.2, tested_on: '2025-06-30', result: 'pass', coa_url: 'https://example.com/coa/BPC157-2405A.pdf' },
    { id: 2, lot_code: 'TB500-2405A', sku: 'TB500', purity: 98.7, tested_on: '2025-07-08', result: 'pass', coa_url: 'https://example.com/coa/TB500-2405A.pdf' },
    { id: 3, lot_code: 'GHKCU-2404A', sku: 'GHKCU', purity: 99.5, tested_on: '2025-06-10', result: 'pass', coa_url: 'https://example.com/coa/GHKCU-2404A.pdf' },
    { id: 4, lot_code: 'MOTSC-2405B', sku: 'MOTSC', purity: 97.9, tested_on: '2025-07-12', result: 'pending', coa_url: '' },
  ];
  return { stores, orders, inventory, lots };
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
  async updateOrder(id, patch) {
    if (!LIVE) { const o = demo.orders.find((x) => x.id === id); if (o) Object.assign(o, patch); return o; }
    const r = await sb('/orders?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch),
    });
    return r[0];
  },
  async lots() {
    if (!LIVE) return demo.lots;
    return sb('/lots?select=*&order=tested_on.desc');
  },
  async createStore(store) {
    if (!LIVE) { demo.stores.push(store); return store; }
    const r = await sb('/stores', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(store) });
    return r[0];
  },
  async createOrder(order) {
    if (!LIVE) { demo.orders.unshift(order); return order; }
    const r = await sb('/orders', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(order) });
    return r[0];
  },
  async addLot(lot) {
    if (!LIVE) { demo.lots.unshift({ id: Date.now(), ...lot }); return lot; }
    const r = await sb('/lots', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(lot) });
    return r[0];
  },
  async adjustInventory(sku, current, delta) {
    const next = Math.max(0, (current || 0) + delta);
    if (!LIVE) { const it = demo.inventory.find((x) => x.sku === sku); if (it) it.on_hand = next; return next; }
    await sb('/inventory?sku=eq.' + encodeURIComponent(sku), {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ on_hand: next, updated_at: new Date().toISOString() }),
    });
    return next;
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
const route = () => { const h = location.hash.replace(/^#\/?/, ''); const [seg, arg] = h.split('/'); return { seg: seg || 'home', arg }; };
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
  const shipCount = (cache.orders || []).filter((o) => o.status === 'paid').length;
  const badge = shipCount ? `<span class="navbadge">${shipCount}</span>` : '';
  const item = (to, icon, label, extra = '') => `<a data-action="nav" data-to="${to}" class="${active === to ? 'sel' : ''}"><span class="ni">${icon}${extra}</span>${label}</a>`;
  return `<nav class="nav">${item('home', '◇', 'Home')}${item('orders', '▤', 'Orders')}${item('ship', '⇥', 'Ship', badge)}${item('inventory', '▦', 'Stock')}${item('settings', '⚙', 'More')}</nav>`;
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
let cache = { orders: null, inventory: null, lots: undefined };

/* ---------- Home / command dashboard -------------------------------- */
async function viewHome() {
  const root = $('#app');
  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  root.innerHTML = topbar('Command', dateStr) + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('home');
  let orders, inv;
  try { orders = cache.orders = await api.orders(); inv = cache.inventory = await api.inventory(); }
  catch (e) { return renderError(e, 'home'); }

  const startDay = new Date(); startDay.setHours(0, 0, 0, 0);
  const todays = orders.filter((o) => Date.parse(o.created_at) >= startDay.getTime());
  const revToday = todays.filter((o) => o.status === 'paid' || o.status === 'fulfilled').reduce((s, o) => s + (o.total_cents || 0), 0);
  const toShip = orders.filter((o) => o.status === 'paid').length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const low = inv.filter((i) => (i.on_hand || 0) > 0 && (i.on_hand || 0) <= 10).length;
  const out = inv.filter((i) => (i.on_hand || 0) === 0).length;

  let html = topbar('Command', dateStr, { right: `<button class="icon-btn" data-action="refresh" aria-label="Refresh">⟳</button>` });
  html += `<div class="view">`;
  html += `<div class="greeting">${greet}. Here's your business right now.</div>`;

  html += `<div class="stats">
    <div class="stat green"><div class="n" style="font-size:22px">${money(revToday)}</div><div class="l">Revenue today</div></div>
    <div class="stat"><div class="n">${todays.length}</div><div class="l">Orders today</div></div>
  </div>`;

  // needs attention — only what requires action
  const cards = [];
  if (toShip) cards.push(`<button class="att" data-action="nav" data-to="ship"><span class="att-n">${toShip}</span><span class="att-l">order${toShip === 1 ? '' : 's'} ready to ship</span><span class="att-go">›</span></button>`);
  if (pending) cards.push(`<button class="att" data-action="nav" data-to="orders"><span class="att-n">${pending}</span><span class="att-l">payment${pending === 1 ? '' : 's'} pending</span><span class="att-go">›</span></button>`);
  if (out) cards.push(`<button class="att warn" data-action="nav" data-to="inventory"><span class="att-n">${out}</span><span class="att-l">SKU${out === 1 ? '' : 's'} out of stock</span><span class="att-go">›</span></button>`);
  if (low) cards.push(`<button class="att" data-action="nav" data-to="inventory"><span class="att-n">${low}</span><span class="att-l">SKU${low === 1 ? '' : 's'} low on stock</span><span class="att-go">›</span></button>`);
  html += `<div class="section-title">Needs attention</div>`;
  html += cards.length ? `<div class="atts">${cards.join('')}</div>` : `<div class="card"><div class="empty" style="padding:22px 10px"><div class="big">✅</div><h3>All caught up</h3><p>Nothing needs action right now.</p></div></div>`;

  // quick launcher
  html += `<div class="section-title">Manage</div><div class="link-grid">
    <button class="linkbtn" data-action="nav" data-to="orders"><span class="ico">▤</span> Orders</button>
    <button class="linkbtn" data-action="nav" data-to="analytics"><span class="ico">◔</span> Analytics</button>
    <button class="linkbtn" data-action="nav" data-to="customers"><span class="ico">☺</span> Customers</button>
    <button class="linkbtn" data-action="nav" data-to="inventory"><span class="ico">▦</span> Inventory</button>
    <button class="linkbtn" data-action="nav" data-to="restock"><span class="ico">📦</span> Restock</button>
    <button class="linkbtn" data-action="nav" data-to="lab"><span class="ico">🧪</span> Lab · COAs</button>
    <button class="linkbtn" data-action="new-order"><span class="ico">＋</span> New order</button>
  </div>`;

  // recent orders
  const recent = orders.slice().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5);
  if (recent.length) {
    html += `<div class="section-title">Recent orders <button data-action="nav" data-to="orders">All</button></div>`;
    html += `<div class="card" style="padding:6px 16px">${recent.map(orderRow).join('')}</div>`;
  }
  html += `</div>` + bottomNav('home');
  root.innerHTML = html;
}

/* ---------- Customers ---------------------------------------------- */
function aggregateCustomers(orders) {
  const map = {};
  orders.forEach((o) => {
    const key = (o.email || 'unknown').toLowerCase();
    const c = map[key] || (map[key] = { email: o.email || '—', name: o.ship_name || '', orders: 0, spent: 0, brands: new Set(), last: 0, list: [] });
    c.orders++;
    if (o.status === 'paid' || o.status === 'fulfilled') c.spent += o.total_cents || 0;
    c.brands.add(o.store_slug);
    if (o.ship_name && !c.name) c.name = o.ship_name;
    const t = Date.parse(o.created_at);
    if (t > c.last) c.last = t;
    c.list.push(o);
  });
  return Object.values(map).sort((a, b) => b.spent - a.spent);
}

async function viewCustomers() {
  const root = $('#app');
  root.innerHTML = topbar('Customers', 'Across all brands') + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('home');
  let orders;
  try { orders = cache.orders = await api.orders(); } catch (e) { return renderError(e, 'customers'); }
  const all = aggregateCustomers(orders);
  const repeat = all.filter((c) => c.orders > 1).length;
  const q = state.custSearch.trim().toLowerCase();
  const list = all.filter((c) => !q || c.email.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q));

  let html = topbar('Customers', `${all.length} total`, { left: `<button class="back-btn" data-action="back">‹</button>` });
  html += `<div class="view">`;
  html += `<div class="stats"><div class="stat"><div class="n">${all.length}</div><div class="l">Customers</div></div><div class="stat accent"><div class="n">${all.length ? Math.round((repeat / all.length) * 100) : 0}%</div><div class="l">Repeat buyers</div></div></div>`;
  html += `<input class="input" id="cust-search" placeholder="Search name or email…" value="${esc(state.custSearch)}" style="margin:12px 0" autocomplete="off" />`;
  if (!list.length) {
    html += `<div class="card"><div class="empty"><div class="big">☺</div><h3>${all.length ? 'No matches' : 'No customers yet'}</h3><p>${all.length ? 'Try another search.' : 'They appear once orders come in.'}</p></div></div>`;
  } else {
    html += `<div class="card" style="padding:6px 16px">${list.map(custRow).join('')}</div>`;
  }
  html += `</div>` + bottomNav('home');
  root.innerHTML = html;
}
function custRow(c) {
  const brands = [...c.brands].map((slug) => `<span class="b-pip" style="background:${esc(state.storesById[slug]?.label_profile?.accent || '#5b6cff')}" title="${esc(state.storesById[slug]?.name || slug)}"></span>`).join('');
  return `<div class="order" data-action="open-customer" data-email="${esc(c.email)}">
    <div class="oi"><div class="oid" style="font-size:15px">${esc(c.name || c.email)}</div>
      <div class="om">${brands} <span>${c.orders} order${c.orders === 1 ? '' : 's'} · last ${timeAgo(c.last)}</span></div></div>
    <div class="amt">${money(c.spent)}<small>lifetime</small></div>
  </div>`;
}

async function viewCustomer(email) {
  const root = $('#app');
  root.innerHTML = `<div class="topbar"><button class="back-btn" data-action="back">‹</button><div style="flex:1"><h1 style="font-size:19px">Customer</h1></div></div><div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('home');
  let orders;
  try { orders = cache.orders = await api.orders(); } catch (e) { return renderError(e, 'customers'); }
  const key = decodeURIComponent(email || '').toLowerCase();
  const mine = orders.filter((o) => (o.email || '').toLowerCase() === key).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (!mine.length) { go('customers'); return; }
  const c = aggregateCustomers(mine)[0];

  let html = `<div class="topbar"><button class="back-btn" data-action="back">‹</button><div style="flex:1;min-width:0"><h1 style="font-size:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.name || c.email)}</h1><div class="sub">${esc(c.email)}</div></div></div>`;
  html += `<div class="view">`;
  html += `<div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="n" style="font-size:20px">${money(c.spent)}</div><div class="l">Lifetime</div></div>
    <div class="stat"><div class="n" style="font-size:20px">${c.orders}</div><div class="l">Orders</div></div>
    <div class="stat"><div class="n" style="font-size:20px">${money(c.orders ? Math.round(c.spent / c.orders) : 0)}</div><div class="l">Avg</div></div>
  </div>`;
  html += `<div class="section-title">Order history</div><div class="card" style="padding:6px 16px">${mine.map(orderRow).join('')}</div>`;
  html += `</div>` + bottomNav('home');
  root.innerHTML = html;
}

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

  const q = state.search.trim().toLowerCase();
  const filtered = orders.filter((o) =>
    (state.filterBrand === 'all' || o.store_slug === state.filterBrand) &&
    (state.filterStatus === 'all' || o.status === state.filterStatus) &&
    (!q || o.id.toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q) ||
      (o.ship_name || '').toLowerCase().includes(q) || (o.tracking_number || '').toLowerCase().includes(q)));

  let html = topbar('Orders', LIVE ? 'Live · all brands' : 'Demo data · all brands', {
    right: `<button class="icon-btn" data-action="new-order" aria-label="New order" title="New manual order">＋</button><button class="icon-btn" data-action="nav" data-to="analytics" aria-label="Analytics" title="Analytics" style="margin-left:8px">◔</button><button class="icon-btn" data-action="export" aria-label="Export CSV" title="Export CSV" style="margin-left:8px">⤓</button><button class="icon-btn" data-action="refresh" aria-label="Refresh" style="margin-left:8px">⟳</button>`,
  });
  html += `<div class="view">`;
  if (!LIVE) html += `<div class="banner">Showing <b>demo data</b>. Add your Supabase URL + anon key in <b>config.js</b> to go live.</div>`;
  html += `<div class="stats">
    <div class="stat"><div class="n">${todays.length}</div><div class="l">Orders today</div></div>
    <div class="stat green" data-action="nav" data-to="analytics" style="cursor:pointer"><div class="n">${money(revenue)}</div><div class="l">Paid revenue ›</div></div>
    <div class="stat amber" data-action="nav" data-to="ship" style="cursor:pointer"><div class="n">${toShip}</div><div class="l">Ready to ship ›</div></div>
    <div class="stat ${lowStock ? 'amber' : ''}"><div class="n">${lowStock}</div><div class="l">Low stock SKUs</div></div>
  </div>`;

  // brand filter
  html += `<div class="chips">${chip('brand', 'all', 'All brands')}${state.stores.map((s) => chip('brand', s.slug, s.name)).join('')}</div>`;
  // status filter
  html += `<div class="chips">${chip('status', 'all', 'All')}${STATUSES.map((s) => chip('status', s, STATUS_LABEL[s])).join('')}</div>`;
  // search
  html += `<input class="input" id="order-search" placeholder="Search order #, email, name, tracking…" value="${esc(state.search)}" style="margin-bottom:12px" autocomplete="off" />`;

  if (!filtered.length) {
    html += `<div class="card"><div class="empty"><div class="big">🔍</div><h3>No matches</h3><p>${q ? 'No orders match your search/filters.' : 'Nothing matches this filter yet.'}</p></div></div>`;
  } else {
    html += `<div class="hint" style="margin:0 4px 8px">${filtered.length} order${filtered.length === 1 ? '' : 's'}${q ? ' matching “' + esc(state.search) + '”' : ''}</div>`;
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
  await loadLots(); // for per-item COA links
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
  html += (o.items || []).map((i) => {
    const l = latestLot(i.sku);
    const coa = l && l.coa_url ? ` <a href="${esc(l.coa_url)}" target="_blank" rel="noopener" class="coa-link">COA ${esc(l.lot_code)}↗</a>` : '';
    return `<div class="line"><span>${esc(i.name || i.sku)}${i.size ? ` · ${esc(i.size)}` : ''}${coa}</span><span class="q">×${i.qty || 1} · ${money((i.unit_cents || 0) * (i.qty || 1))}</span></div>`;
  }).join('') || '<div class="hint">No line items.</div>';
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
  if (o.status === 'fulfilled') {
    html += `<button class="btn" data-action="mark" data-id="${esc(o.id)}" data-status="paid">Reopen (mark paid)</button>`;
  } else {
    html += `<form data-action="ship" data-id="${esc(o.id)}" class="card" style="margin-top:6px">
      <div class="section-title" style="margin:0 0 10px 4px">Mark shipped</div>
      <div class="field" style="margin-bottom:10px"><input class="input" name="carrier" placeholder="Carrier (e.g. USPS)" value="${esc(o.ship_carrier || '')}" autocomplete="off" /></div>
      <div class="field" style="margin-bottom:12px"><input class="input" name="tracking" placeholder="Tracking number" value="${esc(o.tracking_number || '')}" autocomplete="off" /></div>
      <button class="btn primary" type="submit">Mark shipped &amp; fulfilled</button>
    </form>`;
    if (o.status === 'pending') html += `<button class="btn" style="margin-top:10px" data-action="mark" data-id="${esc(o.id)}" data-status="paid">Mark paid</button>`;
  }

  html += `</div>`;
  root.innerHTML = html + bottomNav('orders');
}

async function viewShip() {
  const root = $('#app');
  root.innerHTML = topbar('To Ship', 'Paid · awaiting fulfillment') + `<div class="view"><div class="center"><div class="spin"></div>Loading queue…</div></div>` + bottomNav('ship');
  let orders;
  try { orders = cache.orders = await api.orders(); } catch (e) { return renderError(e, 'ship'); }
  const queue = orders.filter((o) => o.status === 'paid')
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)); // oldest first — ship those first

  // group by brand so a batch is packed with one brand's labels at a time
  const groups = {};
  queue.forEach((o) => { (groups[o.store_slug] = groups[o.store_slug] || []).push(o); });
  const slugs = Object.keys(groups);

  let html = topbar('To Ship', `${queue.length} awaiting`, {
    right: `<button class="icon-btn" data-action="refresh" aria-label="Refresh">⟳</button>`,
  });
  html += `<div class="view">`;
  if (!queue.length) {
    html += `<div class="card"><div class="empty"><div class="big">🎉</div><h3>All shipped</h3><p>No paid orders waiting to go out. Nice.</p></div></div>`;
  } else {
    for (const slug of slugs) {
      const s = state.storesById[slug] || {};
      const accent = s.label_profile?.accent || '#5b6cff';
      const packaging = s.label_profile?.packaging || 'brand packaging';
      const list = groups[slug];
      html += `<div class="ship-group">
        <div class="ship-group-head">${brandBadge(slug)}<span class="ship-count">${list.length} to pack</span></div>
        <div class="packbanner" style="background:linear-gradient(135deg,${esc(accent)},#0b1220);margin-bottom:10px">
          <div class="k">Pack &amp; label as</div><div class="v" style="font-size:18px">${esc(s.name || slug)}</div>
          <div class="p">${esc(packaging)}</div>
        </div>`;
      html += list.map(shipRow).join('');
      html += `</div>`;
    }
  }
  html += `</div>` + bottomNav('ship');
  root.innerHTML = html;
}

function shipRow(o) {
  const items = (o.items || []).map((i) => `${i.qty || 1}× ${esc(i.name || i.sku)}`).join(', ');
  return `<form class="shiprow" data-action="ship-queue" data-id="${esc(o.id)}">
    <div class="shiprow-top">
      <button type="button" class="shiprow-info" data-action="open-order" data-id="${esc(o.id)}">
        <span class="oid">${esc(o.id)}</span>
        <span class="who">${esc(o.ship_name || o.email || '')}</span>
      </button>
      <span class="amt">${money(o.total_cents)}</span>
    </div>
    <div class="shiprow-items">${items || 'no items'}</div>
    <div class="ship-inputs">
      <input class="input" name="carrier" placeholder="Carrier" value="${esc(o.ship_carrier || '')}" autocomplete="off" />
      <input class="input" name="tracking" placeholder="Tracking #" autocomplete="off" />
      <button class="btn primary" type="submit">Ship</button>
    </div>
  </form>`;
}

const RANGES = { '7d': 7, '30d': 30, '90d': 90 };
async function viewAnalytics() {
  const root = $('#app');
  root.innerHTML = topbar('Analytics', 'Per-brand performance') + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('orders');
  let orders;
  try { orders = cache.orders = await api.orders(); } catch (e) { return renderError(e, 'analytics'); }

  const days = RANGES[state.range] || 30;
  const since = Date.now() - days * 86400000;
  const inRange = orders.filter((o) => Date.parse(o.created_at) >= since);
  const paid = inRange.filter((o) => o.status === 'paid' || o.status === 'fulfilled');
  const rev = (o) => o.total_cents || 0;

  const totalRev = paid.reduce((s, o) => s + rev(o), 0);
  const totalOrders = paid.length;
  const aov = totalOrders ? Math.round(totalRev / totalOrders) : 0;

  // per-brand aggregates
  const brands = state.stores.map((s) => {
    const os = paid.filter((o) => o.store_slug === s.slug);
    const r = os.reduce((a, o) => a + rev(o), 0);
    return { slug: s.slug, name: s.name, accent: s.label_profile?.accent || '#5b6cff', revenue: r, orders: os.length, aov: os.length ? Math.round(r / os.length) : 0 };
  }).sort((a, b) => b.revenue - a.revenue);
  const maxBrandRev = Math.max(1, ...brands.map((b) => b.revenue));

  // daily buckets (oldest→newest) stacked by brand
  const buckets = [];
  const startDay = new Date(); startDay.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d0 = startDay.getTime() - i * 86400000;
    const d1 = d0 + 86400000;
    const dayOrders = paid.filter((o) => { const t = Date.parse(o.created_at); return t >= d0 && t < d1; });
    const per = {};
    state.stores.forEach((s) => { per[s.slug] = dayOrders.filter((o) => o.store_slug === s.slug).reduce((a, o) => a + rev(o), 0); });
    buckets.push({ date: d0, total: dayOrders.reduce((a, o) => a + rev(o), 0), per });
  }
  analyticsDays = buckets;
  const maxDay = Math.max(1, ...buckets.map((b) => b.total));

  let html = topbar('Analytics', LIVE ? 'Per-brand · live' : 'Per-brand · demo', {
    left: `<button class="back-btn" data-action="back">‹</button>`,
  });
  html += `<div class="view">`;
  html += `<div class="chips">${['7d', '30d', '90d'].map((r) => `<button class="chip ${state.range === r ? 'sel' : ''}" data-action="range" data-val="${r}">${r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}</button>`).join('')}</div>`;

  html += `<div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat green"><div class="n" style="font-size:20px">${money(totalRev)}</div><div class="l">Revenue</div></div>
    <div class="stat"><div class="n" style="font-size:20px">${totalOrders}</div><div class="l">Orders</div></div>
    <div class="stat"><div class="n" style="font-size:20px">${money(aov)}</div><div class="l">Avg order</div></div>
  </div>`;

  // revenue by brand — horizontal bars, direct-labeled (relief for contrast WARN)
  html += `<div class="section-title">Revenue by brand</div><div class="card">`;
  if (!totalRev) {
    html += `<div class="hint" style="text-align:center;padding:12px 0">No paid revenue in this range.</div>`;
  } else {
    html += brands.map((b) => {
      const pct = Math.round((b.revenue / totalRev) * 100);
      const w = Math.round((b.revenue / maxBrandRev) * 100);
      return `<div class="brow">
        <div class="brow-top"><span class="brand" style="background:${esc(b.accent)}"><span class="b-dot"></span>${esc(b.name)}</span><span class="brow-rev">${money(b.revenue)}</span></div>
        <div class="sharebar"><i style="width:${w}%;background:${esc(b.accent)}"></i></div>
        <div class="brow-sub">${b.orders} order${b.orders === 1 ? '' : 's'} · AOV ${money(b.aov)} · ${pct}% of revenue</div>
      </div>`;
    }).join('');
  }
  html += `</div>`;

  // revenue over time — stacked daily bars + legend + table toggle
  html += `<div class="section-title">Revenue over time <button data-action="an-table">${state.anTable ? 'Chart' : 'Table'}</button></div>`;
  html += `<div class="card">`;
  html += `<div class="legend">${state.stores.map((s) => `<span class="lg"><span class="lg-dot" style="background:${esc(s.label_profile?.accent || '#5b6cff')}"></span>${esc(s.name)}</span>`).join('')}</div>`;
  if (state.anTable) {
    html += `<div style="overflow-x:auto"><table class="antable"><thead><tr><th>Day</th>${state.stores.map((s) => `<th>${esc(s.name)}</th>`).join('')}<th>Total</th></tr></thead><tbody>`;
    html += buckets.filter((b) => b.total > 0).reverse().map((b) => `<tr><td>${fmtDay(b.date)}</td>${state.stores.map((s) => `<td>${b.per[s.slug] ? money(b.per[s.slug]) : '—'}</td>`).join('')}<td>${money(b.total)}</td></tr>`).join('') || `<tr><td colspan="${state.stores.length + 2}" style="color:var(--faint)">No revenue in range.</td></tr>`;
    html += `</tbody></table></div>`;
  } else {
    const CH = 130;
    html += `<div class="tchart" style="height:${CH}px">`;
    html += buckets.map((b, i) => {
      const colH = b.total ? Math.max(3, Math.round((b.total / maxDay) * CH)) : 0;
      const segs = state.stores.filter((s) => b.per[s.slug] > 0).map((s) => {
        const h = Math.max(2, Math.round((b.per[s.slug] / b.total) * colH));
        return `<i style="height:${h}px;background:${esc(s.label_profile?.accent || '#5b6cff')}"></i>`;
      }).join('');
      return `<button class="tcol" data-action="tbar" data-i="${i}" aria-label="${fmtDay(b.date)} ${money(b.total)}"><span class="tstack">${segs}</span></button>`;
    }).join('');
    html += `</div>`;
    html += `<div class="taxis"><span>${fmtDay(buckets[0].date)}</span><span>${fmtDay(buckets[buckets.length - 1].date)}</span></div>`;
    html += `<div class="treadout" id="treadout">Tap a bar for the daily breakdown.</div>`;
  }
  html += `</div>`;

  // top products by units
  const skuMap = {};
  paid.forEach((o) => (o.items || []).forEach((it) => { const k = it.sku || it.name; skuMap[k] = (skuMap[k] || 0) + (it.qty || 1); }));
  const top = Object.entries(skuMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length) {
    html += `<div class="section-title">Top products · units</div><div class="card">`;
    const maxU = Math.max(...top.map((t) => t[1]));
    html += top.map(([sku, u]) => `<div class="brow" style="margin-bottom:10px"><div class="brow-top"><span style="font-weight:600;font-size:14px">${esc(sku)}</span><span class="brow-rev">${u}</span></div><div class="sharebar"><i style="width:${Math.round((u / maxU) * 100)}%;background:var(--teal)"></i></div></div>`).join('');
    html += `</div>`;
  }

  html += `</div>` + bottomNav('orders');
  root.innerHTML = html;
}
function fmtDay(ts) { const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); }

/* ---------- Restock / purchasing ------------------------------------ */
const REORDER_POINT = 10; // available at/below this → reorder
const PAR_LEVEL = 40;     // restock target
// units committed by paid-but-unshipped orders (reserve-on-paid), by sku
function committedUnits(orders) {
  const m = {};
  orders.filter((o) => o.status === 'paid').forEach((o) =>
    (o.items || []).forEach((it) => { const k = it.sku || it.name; m[k] = (m[k] || 0) + (it.qty || 1); }));
  return m;
}

async function viewRestock() {
  const root = $('#app');
  root.innerHTML = topbar('Restock', 'What to reorder') + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('inventory');
  let inv, orders;
  try { inv = cache.inventory = await api.inventory(); orders = cache.orders = await api.orders(); }
  catch (e) { return renderError(e, 'restock'); }
  const committed = committedUnits(orders);
  const rows = inv.map((i) => {
    const onHand = i.on_hand || 0;
    const com = committed[i.sku] || 0;
    const avail = onHand - com;
    const rp = i.reorder_point != null ? i.reorder_point : REORDER_POINT;
    const par = i.par_level != null ? i.par_level : PAR_LEVEL;
    const suggest = avail <= rp ? Math.max(0, par - avail) : 0;
    return { sku: i.sku, name: i.products?.name || i.sku, onHand, com, avail, rp, suggest,
      state: avail <= 0 ? 'out' : avail <= rp ? 'low' : 'ok' };
  }).sort((a, b) => {
    const rank = { out: 0, low: 1, ok: 2 };
    return rank[a.state] - rank[b.state] || a.avail - b.avail;
  });
  const need = rows.filter((r) => r.suggest > 0);

  let html = topbar('Restock', LIVE ? 'What to reorder' : 'What to reorder · demo', { left: `<button class="back-btn" data-action="back">‹</button>` });
  html += `<div class="view">`;
  html += `<div class="banner">Available = on-hand − committed to paid orders (reserved). Items at or below their reorder point are flagged.</div>`;
  html += `<div class="stats"><div class="stat ${need.length ? 'amber' : 'green'}"><div class="n">${need.length}</div><div class="l">Need reorder</div></div>
    <div class="stat"><div class="n">${need.reduce((s, r) => s + r.suggest, 0)}</div><div class="l">Units to buy</div></div></div>`;

  html += `<div class="section-title">Reorder list</div>`;
  if (!need.length) {
    html += `<div class="card"><div class="empty" style="padding:22px 10px"><div class="big">✅</div><h3>Fully stocked</h3><p>Nothing is at its reorder point.</p></div></div>`;
  }
  html += `<div class="card" style="padding:8px 16px">`;
  html += rows.map((r) => `<div class="rk">
      <div class="rk-top"><div><span class="rk-nm">${esc(r.name)}</span> <span class="rk-sku">${esc(r.sku)}</span></div>
        ${r.suggest > 0 ? `<span class="rk-buy ${r.state}">Buy ${r.suggest}</span>` : `<span class="pill st-fulfilled" style="font-size:11px">OK</span>`}</div>
      <div class="rk-meta"><span>On-hand <b>${r.onHand}</b></span><span>Committed <b>${r.com}</b></span><span class="rk-av ${r.state}">Available <b>${r.avail}</b></span></div>
      <form class="rk-receive" data-action="receive" data-sku="${esc(r.sku)}" data-cur="${r.onHand}">
        <input class="input" name="qty" type="number" inputmode="numeric" min="1" placeholder="Receive qty" autocomplete="off" />
        <button class="btn sm" type="submit">Receive</button>
      </form>
    </div>`).join('');
  html += `</div>`;
  html += `</div>` + bottomNav('inventory');
  root.innerHTML = html;
}

/* ---------- Lab / COAs by lot --------------------------------------- */
async function loadLots() {
  if (cache.lots !== undefined) return cache.lots;
  try { cache.lots = await api.lots(); } catch (e) { cache.lots = e.status === 404 || e.status === 400 ? null : []; }
  return cache.lots;
}
// latest passing lot for a sku (for order-detail COA surfacing)
function latestLot(sku) {
  const lots = cache.lots;
  if (!Array.isArray(lots)) return null;
  return lots.filter((l) => l.sku === sku && l.result === 'pass').sort((a, b) => (b.tested_on || '').localeCompare(a.tested_on || ''))[0] || null;
}
function lotBadge(result) {
  const map = { pass: 'st-fulfilled', fail: 'st-failed', pending: 'st-pending' };
  return `<span class="pill ${map[result] || 'st-idle'}" style="font-size:11px">${esc((result || '').toUpperCase())}</span>`;
}

async function viewLab() {
  const root = $('#app');
  root.innerHTML = topbar('Lab · COAs', 'Tested by lot') + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('inventory');
  const lots = await loadLots();

  let html = topbar('Lab · COAs', 'Tested by lot', { left: `<button class="back-btn" data-action="back">‹</button>`, right: `<button class="icon-btn" data-action="add-lot" aria-label="Add lot">＋</button>` });
  html += `<div class="view">`;
  if (lots === null) {
    html += `<div class="card"><div class="empty"><div class="big">🧪</div><h3>Enable the Lab module</h3><p>Run the <b>lots</b> table migration in Supabase (db/schema.sql) to track COAs by lot.</p></div></div>`;
    html += `</div>` + bottomNav('inventory');
    root.innerHTML = html; return;
  }
  const pending = lots.filter((l) => l.result === 'pending').length;
  const passed = lots.filter((l) => l.result === 'pass').length;
  html += `<div class="stats"><div class="stat green"><div class="n">${passed}</div><div class="l">Passing lots</div></div><div class="stat ${pending ? 'amber' : ''}"><div class="n">${pending}</div><div class="l">Awaiting result</div></div></div>`;
  html += `<div class="section-title">Lots</div>`;
  if (!lots.length) {
    html += `<div class="card"><div class="empty" style="padding:22px 10px"><div class="big">🧪</div><h3>No lots yet</h3><p>Add a lot with its COA using ＋.</p></div></div>`;
  } else {
    // group by sku
    const bySku = {};
    lots.forEach((l) => { (bySku[l.sku || '—'] = bySku[l.sku || '—'] || []).push(l); });
    html += Object.keys(bySku).map((sku) => {
      const prod = (cache.inventory || []).find((i) => i.sku === sku)?.products?.name || sku;
      return `<div class="card"><div class="section-title" style="margin:0 0 8px 0">${esc(prod)} <span style="color:var(--faint);font-weight:600;text-transform:none;letter-spacing:0">${esc(sku)}</span></div>
        ${bySku[sku].map((l) => `<div class="lot">
          <div class="lot-top"><span class="lot-code">${esc(l.lot_code)}</span>${lotBadge(l.result)}</div>
          <div class="lot-meta"><span>Purity <b>${l.purity != null ? l.purity + '%' : '—'}</b></span><span>Tested ${l.tested_on ? esc(l.tested_on) : '—'}</span></div>
          ${l.coa_url ? `<a class="linkbtn" style="margin-top:8px" href="${esc(l.coa_url)}" target="_blank" rel="noopener"><span class="ico">▤</span> Open COA</a>` : `<div class="hint" style="margin-top:6px">No COA attached</div>`}
        </div>`).join('')}
      </div>`;
    }).join('');
  }
  html += `</div>` + bottomNav('inventory');
  root.innerHTML = html;
}

function openAddLot() {
  const skus = (cache.inventory || []).map((i) => `<option value="${esc(i.sku)}">${esc((i.products?.name || i.sku))} (${esc(i.sku)})</option>`).join('');
  openSheet(`<h3>Add lot / COA</h3>
    <form data-action="submit-lot">
      <div class="field"><label>Lot code</label><input class="input" name="lot_code" placeholder="BPC157-2405A" autocomplete="off" required /></div>
      <div class="field"><label>Product</label><select class="selectbox" name="sku">${skus}</select></div>
      <div class="field"><label>Purity %</label><input class="input" name="purity" type="number" step="0.1" inputmode="decimal" placeholder="99.2" autocomplete="off" /></div>
      <div class="field"><label>Tested on</label><input class="input" name="tested_on" type="date" autocomplete="off" /></div>
      <div class="field"><label>Result</label><select class="selectbox" name="result"><option value="pass">Pass</option><option value="pending">Pending</option><option value="fail">Fail</option></select></div>
      <div class="field"><label>COA URL</label><input class="input" name="coa_url" placeholder="https://…" autocomplete="off" /></div>
      <button class="btn primary" type="submit">Save lot</button>
    </form>`);
  setTimeout(() => $('#modal-root input[name=lot_code]')?.focus(), 60);
}

function openAddStore() {
  openSheet(`<h3>Add brand / store</h3>
    <form data-action="submit-store">
      <div class="field"><label>Name</label><input class="input" name="name" placeholder="New Brand" autocomplete="off" required /></div>
      <div class="field"><label>Slug <span style="color:var(--faint)">(lowercase id)</span></label><input class="input" name="slug" placeholder="newbrand" autocomplete="off" required /></div>
      <div class="field"><label>Domain</label><input class="input" name="domain" placeholder="newbrand.com" autocomplete="off" /></div>
      <div class="field"><label>Order prefix</label><input class="input" name="order_prefix" placeholder="NB" maxlength="4" autocomplete="off" required /></div>
      <div class="field"><label>Packaging note</label><input class="input" name="packaging" placeholder="Brand box + insert" autocomplete="off" /></div>
      <div class="field"><label>Accent colour</label><input class="input" name="accent" type="color" value="#5b6cff" style="height:46px;padding:6px" /></div>
      <button class="btn primary" type="submit">Create brand</button>
    </form>`);
  setTimeout(() => $('#modal-root input[name=name]')?.focus(), 60);
}

function mlLineHtml() {
  const opts = (cache.inventory || []).map((i) => `<option value="${esc(i.sku)}" data-name="${esc(i.products?.name || i.sku)}">${esc(i.products?.name || i.sku)}</option>`).join('');
  return `<div class="ml-line">
    <select class="selectbox ml-sku" name="sku">${opts || '<option value="">—</option>'}</select>
    <input class="input ml-qty" name="qty" type="number" min="1" value="1" inputmode="numeric" aria-label="Qty" />
    <input class="input ml-price" name="price" type="number" min="0" step="0.01" placeholder="$ each" inputmode="decimal" aria-label="Unit price" />
    <button type="button" class="ml-del" data-action="ml-del" aria-label="Remove">✕</button>
  </div>`;
}
function openManualOrder() {
  const stores = state.stores.map((s) => `<option value="${esc(s.slug)}">${esc(s.name)}</option>`).join('');
  openSheet(`<h3>New manual order</h3>
    <form data-action="submit-manual">
      <div class="field"><label>Brand</label><select class="selectbox" name="store">${stores}</select></div>
      <div class="field"><label>Customer name</label><input class="input" name="name" placeholder="Full name" autocomplete="off" /></div>
      <div class="field"><label>Email</label><input class="input" name="email" type="email" placeholder="email@example.com" autocomplete="off" /></div>
      <label style="display:block;font-size:13px;font-weight:650;color:var(--muted);margin-bottom:7px">Items</label>
      <div id="ml-lines">${mlLineHtml()}</div>
      <button type="button" class="btn sm ghost" data-action="ml-add" style="margin:2px 0 14px">＋ Add item</button>
      <div class="field"><label>Status</label><select class="selectbox" name="status"><option value="paid">Paid</option><option value="pending">Pending</option><option value="fulfilled">Fulfilled</option></select></div>
      <button class="btn primary" type="submit">Create order</button>
    </form>`);
  setTimeout(() => $('#modal-root select[name=store]')?.focus(), 60);
}

async function viewInventory() {
  const root = $('#app');
  root.innerHTML = topbar('Inventory', 'Shared across brands') + `<div class="view"><div class="center"><div class="spin"></div></div></div>` + bottomNav('inventory');
  let inv;
  try { inv = cache.inventory = await api.inventory(); } catch (e) { return renderError(e, 'inventory'); }
  let html = topbar('Inventory', 'Shared across brands', { right: `<button class="icon-btn" data-action="nav" data-to="restock" aria-label="Restock" title="Restock">⟳</button>` });
  html += `<div class="view"><button class="btn" data-action="nav" data-to="restock" style="margin-bottom:12px">📦 Restock list · what to reorder</button>`;
  html += `<div class="banner">One shared stock pool — every brand draws from the same counts.</div><div class="card" style="padding:6px 16px">`;
  html += inv.map((i) => {
    const n = i.on_hand || 0; const cls = n === 0 ? 'out' : n <= 10 ? 'low' : '';
    const nm = i.products?.name || i.sku;
    return `<div class="inv"><div class="in"><div class="nm">${esc(nm)}</div><div class="sk">${esc(i.sku)}</div></div>
      <button class="invbtn" data-action="inv" data-sku="${esc(i.sku)}" data-cur="${n}" data-delta="-1" aria-label="Decrease">−</button>
      <div class="ct ${cls}" style="min-width:34px;text-align:center">${n}</div>
      <button class="invbtn" data-action="inv" data-sku="${esc(i.sku)}" data-cur="${n}" data-delta="1" aria-label="Increase">+</button></div>`;
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
  html += `<button class="btn sm" data-action="add-store" style="margin-top:12px">＋ Add brand</button>`;
  html += `<div class="hint">New storefronts just write orders with their slug — or log sales here with New order.</div></div>`;
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
  if (seg === 'orders') return viewOrders();
  if (seg === 'ship') return viewShip();
  if (seg === 'analytics') return viewAnalytics();
  if (seg === 'customers') return viewCustomers();
  if (seg === 'customer') return viewCustomer(arg);
  if (seg === 'restock') return viewRestock();
  if (seg === 'lab') return viewLab();
  if (seg === 'inventory') return viewInventory();
  if (seg === 'settings') return viewSettings();
  return viewHome();
}

/* ---------- events -------------------------------------------------- */
document.addEventListener('click', async (e) => {
  const backdrop = e.target.closest('[data-action="close-sheet"]');
  if (backdrop && !e.target.closest('[data-stop]')) { closeSheet(); return; }
  const el = e.target.closest('[data-action]'); if (!el) return;
  const { action, to, id, val, status } = el.dataset;
  switch (action) {
    case 'add-lot': openAddLot(); break;
    case 'add-store': openAddStore(); break;
    case 'new-order':
      if (!cache.inventory) { try { cache.inventory = await api.inventory(); } catch (err) {} }
      openManualOrder();
      break;
    case 'ml-add': { const box = $('#ml-lines'); if (box) box.insertAdjacentHTML('beforeend', mlLineHtml()); break; }
    case 'ml-del': { const line = el.closest('.ml-line'); const box = $('#ml-lines'); if (line && box && box.querySelectorAll('.ml-line').length > 1) line.remove(); break; }
    case 'close-sheet': closeSheet(); break;
    case 'nav': go(to); break;
    case 'back': history.length > 1 ? history.back() : go('orders'); break;
    case 'open-order': go('order/' + id); break;
    case 'open-customer': go('customer/' + encodeURIComponent(el.dataset.email)); break;
    case 'filter-brand': state.filterBrand = val; viewOrders(); break;
    case 'filter-status': state.filterStatus = val; viewOrders(); break;
    case 'refresh': cache.orders = cache.inventory = null; toast('Refreshed'); render(); break;
    case 'signout': signOut(); break;
    case 'export': exportCsv(); break;
    case 'range': state.range = val; viewAnalytics(); break;
    case 'an-table': state.anTable = !state.anTable; viewAnalytics(); break;
    case 'tbar': {
      const b = analyticsDays[Number(el.dataset.i)];
      const ro = $('#treadout');
      if (b && ro) {
        if (!b.total) { ro.textContent = fmtDay(b.date) + ' — no revenue'; }
        else {
          const parts = state.stores.filter((s) => b.per[s.slug] > 0).map((s) => esc(s.name) + ' ' + money(b.per[s.slug]));
          ro.innerHTML = `<b>${fmtDay(b.date)}</b> · ${money(b.total)} — ${parts.join(' · ')}`;
        }
      }
      break;
    }
    case 'mark':
      try { await api.updateOrder(id, { status }); toast('Marked ' + status); cache.orders = null; viewOrder(id); }
      catch (err) { toast(err.status === 401 ? 'Session expired' : 'Update failed'); }
      break;
    case 'inv': {
      const btn = el; btn.disabled = true;
      try {
        const next = await api.adjustInventory(el.dataset.sku, Number(el.dataset.cur), Number(el.dataset.delta));
        cache.inventory = null;
        toast(el.dataset.sku + ' → ' + next);
        viewInventory();
      } catch (err) { btn.disabled = false; toast(err.status === 401 ? 'Session expired' : 'Update failed'); }
      break;
    }
  }
});
document.addEventListener('submit', async (e) => {
  const login = e.target.closest('[data-action="login"]');
  const ship = e.target.closest('[data-action="ship"]');
  if (login) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(login).entries());
    const btn = login.querySelector('button[type=submit]'); btn.textContent = 'Signing in…'; btn.disabled = true;
    try { await signIn(d.email, d.password); location.hash = ''; render(); }
    catch (err) { viewLogin(err.message); }
    return;
  }
  if (ship) {
    e.preventDefault();
    const id = ship.dataset.id;
    const d = Object.fromEntries(new FormData(ship).entries());
    const btn = ship.querySelector('button[type=submit]'); btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      await api.updateOrder(id, {
        status: 'fulfilled',
        ship_carrier: d.carrier || null,
        tracking_carrier: d.carrier || null,
        tracking_number: d.tracking || null,
      });
      toast('Marked shipped'); cache.orders = null; viewOrder(id);
    } catch (err) { btn.disabled = false; btn.textContent = 'Mark shipped & fulfilled'; toast(err.status === 401 ? 'Session expired' : 'Update failed'); }
    return;
  }
  const store = e.target.closest('[data-action="submit-store"]');
  if (store) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(store).entries());
    const slug = (d.slug || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!slug) { toast('Enter a valid slug'); return; }
    const btn = store.querySelector('button[type=submit]'); btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const rec = { slug, name: (d.name || '').trim(), domain: (d.domain || '').trim() || null,
        order_prefix: (d.order_prefix || 'XX').trim().toUpperCase(),
        label_profile: { packaging: (d.packaging || '').trim(), accent: d.accent || '#5b6cff' } };
      await api.createStore(rec);
      state.stores = null; state.storesById = {}; cache.orders = null;
      closeSheet(); toast('Brand created'); render();
    } catch (err) { btn.disabled = false; btn.textContent = 'Create brand'; toast(err.status === 409 ? 'Slug already exists' : err.status === 401 ? 'Session expired' : 'Create failed'); }
    return;
  }
  const manual = e.target.closest('[data-action="submit-manual"]');
  if (manual) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(manual).entries());
    const st = state.storesById[d.store] || state.stores.find((s) => s.slug === d.store);
    const items = [];
    manual.querySelectorAll('.ml-line').forEach((ln) => {
      const sel = ln.querySelector('.ml-sku');
      const sku = sel.value;
      const name = sel.selectedOptions[0]?.dataset.name || sku;
      const qty = Math.max(1, parseInt(ln.querySelector('.ml-qty').value, 10) || 1);
      const unit = Math.round((parseFloat(ln.querySelector('.ml-price').value) || 0) * 100);
      if (sku) items.push({ sku, name, qty, unit_cents: unit });
    });
    if (!items.length) { toast('Add at least one item'); return; }
    const subtotal = items.reduce((s, i) => s + i.unit_cents * i.qty, 0);
    const btn = manual.querySelector('button[type=submit]'); btn.textContent = 'Creating…'; btn.disabled = true;
    const id = (st?.order_prefix || 'XX') + '-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : Math.random().toString(36).slice(2, 10).toUpperCase());
    try {
      await api.createOrder({
        id, store_slug: d.store, status: d.status || 'paid', email: (d.email || '').trim() || null,
        ship_name: (d.name || '').trim() || null, items,
        subtotal_cents: subtotal, shipping_cents: 0, tax_cents: 0, total_cents: subtotal,
        created_at: new Date().toISOString(),
      });
      cache.orders = null;
      closeSheet(); toast('Order ' + id + ' created'); go('order/' + id);
    } catch (err) { btn.disabled = false; btn.textContent = 'Create order'; toast(err.status === 401 ? 'Session expired' : 'Create failed'); }
    return;
  }
  const lot = e.target.closest('[data-action="submit-lot"]');
  if (lot) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(lot).entries());
    const btn = lot.querySelector('button[type=submit]'); btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      await api.addLot({
        lot_code: (d.lot_code || '').trim(),
        sku: d.sku || null,
        purity: d.purity ? Number(d.purity) : null,
        tested_on: d.tested_on || null,
        result: d.result || 'pass',
        coa_url: (d.coa_url || '').trim() || null,
      });
      cache.lots = undefined;
      closeSheet(); toast('Lot saved'); viewLab();
    } catch (err) { btn.disabled = false; btn.textContent = 'Save lot'; toast(err.status === 401 ? 'Session expired' : 'Save failed'); }
    return;
  }
  const rec = e.target.closest('[data-action="receive"]');
  if (rec) {
    e.preventDefault();
    const qty = Math.max(0, parseInt(new FormData(rec).get('qty'), 10) || 0);
    if (!qty) { toast('Enter a quantity'); return; }
    const btn = rec.querySelector('button[type=submit]'); btn.textContent = '…'; btn.disabled = true;
    try {
      const next = await api.adjustInventory(rec.dataset.sku, Number(rec.dataset.cur), qty);
      cache.inventory = null;
      toast(rec.dataset.sku + ' received → ' + next);
      viewRestock();
    } catch (err) { btn.disabled = false; btn.textContent = 'Receive'; toast(err.status === 401 ? 'Session expired' : 'Update failed'); }
    return;
  }
  const shipQ = e.target.closest('[data-action="ship-queue"]');
  if (shipQ) {
    e.preventDefault();
    const id = shipQ.dataset.id;
    const d = Object.fromEntries(new FormData(shipQ).entries());
    const btn = shipQ.querySelector('button[type=submit]'); btn.textContent = '…'; btn.disabled = true;
    try {
      await api.updateOrder(id, {
        status: 'fulfilled',
        ship_carrier: d.carrier || null,
        tracking_carrier: d.carrier || null,
        tracking_number: d.tracking || null,
      });
      cache.orders = null;
      toast(id + ' shipped');
      viewShip(); // re-render the queue; the shipped order drops off
    } catch (err) { btn.disabled = false; btn.textContent = 'Ship'; toast(err.status === 401 ? 'Session expired' : 'Update failed'); }
    return;
  }
});

/* live search (debounced re-render, keeps focus) */
document.addEventListener('input', (e) => {
  const orderS = e.target.closest('#order-search');
  const custS = e.target.closest('#cust-search');
  if (orderS) {
    state.search = orderS.value;
    clearTimeout(window.__searchT);
    window.__searchT = setTimeout(async () => {
      await viewOrders();
      const inp = $('#order-search');
      if (inp) { inp.focus(); const v = inp.value; inp.setSelectionRange(v.length, v.length); }
    }, 160);
  } else if (custS) {
    state.custSearch = custS.value;
    clearTimeout(window.__searchT);
    window.__searchT = setTimeout(async () => {
      await viewCustomers();
      const inp = $('#cust-search');
      if (inp) { inp.focus(); const v = inp.value; inp.setSelectionRange(v.length, v.length); }
    }, 160);
  }
});

/* ---------- CSV export --------------------------------------------- */
function exportCsv() {
  const orders = cache.orders || [];
  const q = state.search.trim().toLowerCase();
  const rows = orders.filter((o) =>
    (state.filterBrand === 'all' || o.store_slug === state.filterBrand) &&
    (state.filterStatus === 'all' || o.status === state.filterStatus) &&
    (!q || o.id.toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q) ||
      (o.ship_name || '').toLowerCase().includes(q) || (o.tracking_number || '').toLowerCase().includes(q)));
  if (!rows.length) { toast('No orders to export'); return; }
  const cols = ['id', 'store_slug', 'status', 'created_at', 'email', 'ship_name', 'ship_city', 'ship_state',
    'total_cents', 'ship_carrier', 'tracking_number', 'np_payment_status', 'pay_currency'];
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [cols.join(',')].concat(rows.map((o) => cols.map((c) => cell(o[c])).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `orders-${state.filterBrand}-${state.filterStatus}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length} order${rows.length === 1 ? '' : 's'}`);
}

/* ---------- boot ---------------------------------------------------- */
restoreSession();
render();
