const app = document.getElementById('app');
const API_BASE = window.location.port === '3000' ? 'http://localhost:5000/api' : '/api';
const TOKEN_KEY = 'subsense_token';
const FLASH_KEY = 'subsense_flash';

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'insights', label: 'Insights' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Settings' },
  { id: 'profile', label: 'Profile' }
];

const state = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  search: '',
  calendarOffset: 0,
  cachedPricing: null,
  subQuery: {
    sort: 'nextChargeDate',
    direction: 'asc',
    category: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    renewalFrom: '',
    renewalTo: ''
  }
};

function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || 'dashboard';
}

function isAuthRoute(route) {
  return route === 'login' || route === 'signup';
}

function setToken(token) {
  state.token = token || '';
  if (state.token) localStorage.setItem(TOKEN_KEY, state.token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_e) {}

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function money(value, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value || 0);
}

function monthlyEquivalent(sub) {
  if (sub.billingCycle === 'annual') return sub.amount / 12;
  if (sub.billingCycle === 'weekly') return sub.amount * 4.345;
  return sub.amount;
}

function saveFlash(message) {
  sessionStorage.setItem(FLASH_KEY, message);
}

function pullFlash() {
  const msg = sessionStorage.getItem(FLASH_KEY);
  sessionStorage.removeItem(FLASH_KEY);
  return msg;
}

async function ensureMe() {
  if (!state.token) return false;
  if (state.user) return true;
  try {
    const data = await api('/auth/me');
    state.user = data.user;
    return true;
  } catch (_e) {
    setToken('');
    state.user = null;
    return false;
  }
}

function redirect(route) {
  window.location.hash = `#/${route}`;
}

function authLayout(title, content) {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="brand-row">
          <img class="logo-icon" src="./assets/favicon.svg" alt="SubSense" />
          <img class="logo-wide" src="./assets/logo-horizontal.svg" alt="SubSense" />
        </div>
        <h1>${title}</h1>
        <p>Track your subscriptions with smarter reminders and insights.</p>
        ${content}
      </div>
    </div>
  `;
}

function appLayout(route, title, content) {
  const nav = NAV.map((item) => `
    <a class="nav-item ${route === item.id ? 'active' : ''}" href="#/${item.id}">${item.label}</a>
  `).join('');

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="logo-block">
          <img src="./assets/favicon.svg" alt="logo" />
          <h2>${htmlEscape(state.user.appName || 'SubSense')}</h2>
        </div>
        <nav class="nav-list">${nav}</nav>
      </aside>
      <main class="main">
        <header class="top-header">
          <div class="header-left">
            <img class="mini-logo" src="./assets/favicon.svg" alt="logo" />
            <h1>${title}</h1>
          </div>
          <div class="header-right">
            <input class="search-box" id="globalSearch" placeholder="Search subscriptions/services..." value="${htmlEscape(state.search)}" />
            <div class="menu">
              <button class="btn-secondary" id="userMenuBtn">${htmlEscape(state.user.name.split(' ')[0])}</button>
              <div class="menu-panel" id="userMenuPanel">
                <button id="goProfile">Profile</button>
                <button id="logoutBtn">Logout</button>
              </div>
            </div>
          </div>
        </header>
        <section class="content">${content}</section>
      </main>
    </div>
    <div class="modal" id="modal"></div>
  `;

  document.getElementById('globalSearch').addEventListener('change', (e) => {
    state.search = e.target.value.trim();
    render();
  });

  const panel = document.getElementById('userMenuPanel');
  document.getElementById('userMenuBtn').addEventListener('click', () => panel.classList.toggle('show'));
  document.getElementById('goProfile').addEventListener('click', () => redirect('profile'));
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch (_e) {}
    setToken('');
    state.user = null;
    redirect('login');
  });
}

function openModal(innerHtml) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div class="modal-card">${innerHtml}</div>`;
  modal.classList.add('show');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('show');
    modal.innerHTML = '';
  }
}

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function authLinks(type) {
  return type === 'login'
    ? `<p class="muted">No account? <a href="#/signup"><strong>Create one</strong></a></p>`
    : `<p class="muted">Already have an account? <a href="#/login"><strong>Login</strong></a></p>`;
}

function renderLogin() {
  const flash = pullFlash();
  authLayout('Login', `
    ${flash ? `<p class="form-success">${htmlEscape(flash)}</p>` : ''}
    <form class="form-grid" id="loginForm">
      <div class="form-row">
        <label>Email</label>
        <input type="email" id="email" required />
      </div>
      <div class="form-row">
        <label>Password</label>
        <input type="password" id="password" required />
      </div>
      <div id="formMsg" class="form-error"></div>
      <button class="btn-primary" type="submit">Login</button>
      ${authLinks('login')}
    </form>
  `);

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const msg = document.getElementById('formMsg');
    msg.textContent = '';

    if (!validateEmail(email)) return (msg.textContent = 'Enter a valid email');
    if (!password) return (msg.textContent = 'Password is required');

    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(data.token);
      state.user = data.user;
      redirect('dashboard');
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

function renderSignup() {
  const flash = pullFlash();
  authLayout('Create Your Account', `
    ${flash ? `<p class="form-success">${htmlEscape(flash)}</p>` : ''}
    <form class="form-grid" id="signupForm">
      <div class="form-row">
        <label>Name</label>
        <input id="name" required />
      </div>
      <div class="form-row">
        <label>Email</label>
        <input type="email" id="email" required />
      </div>
      <div class="form-row">
        <label>Password</label>
        <input type="password" id="password" required />
      </div>
      <div class="form-row">
        <label>Confirm Password</label>
        <input type="password" id="confirmPassword" required />
      </div>
      <label class="checkbox"><input type="checkbox" id="terms" /> I accept the terms and privacy policy</label>
      <div id="formMsg" class="form-error"></div>
      <button class="btn-primary" type="submit">Sign Up</button>
      ${authLinks('signup')}
    </form>
  `);

  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      termsAccepted: document.getElementById('terms').checked
    };

    const msg = document.getElementById('formMsg');
    msg.textContent = '';

    if (!payload.name) return (msg.textContent = 'Name is required');
    if (!validateEmail(payload.email)) return (msg.textContent = 'Enter a valid email');
    if (payload.password.length < 6) return (msg.textContent = 'Password must be at least 6 characters');
    if (payload.password !== payload.confirmPassword) return (msg.textContent = 'Passwords do not match');
    if (!payload.termsAccepted) return (msg.textContent = 'You must accept terms');

    try {
      const data = await api('/auth/signup', { method: 'POST', body: payload });
      setToken(data.token);
      state.user = data.user;
      redirect('dashboard');
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

async function getSubscriptions(params = {}) {
  const q = new URLSearchParams(params).toString();
  const data = await api(`/subscriptions${q ? `?${q}` : ''}`);
  return data.items;
}

function renderStats(subs) {
  const now = new Date();
  const in7 = new Date(); in7.setDate(now.getDate() + 7);
  const in30 = new Date(); in30.setDate(now.getDate() + 30);

  let monthly = 0;
  let activeCount = 0;
  let up7 = 0;
  let up30 = 0;

  subs.forEach((s) => {
    if (s.status === 'active') activeCount += 1;
    monthly += monthlyEquivalent(s);
    const d = new Date(`${s.nextChargeDate}T00:00:00`);
    if (d >= now && d <= in7) up7 += 1;
    if (d >= now && d <= in30) up30 += 1;
  });

  return `
    <div class="grid-4">
      <div class="card"><div class="stat-label">Total Monthly Spend</div><div class="stat-value">${money(monthly, state.user.currency)}</div></div>
      <div class="card"><div class="stat-label">Upcoming Renewals (7 days)</div><div class="stat-value">${up7}</div></div>
      <div class="card"><div class="stat-label">Upcoming Renewals (30 days)</div><div class="stat-value">${up30}</div></div>
      <div class="card"><div class="stat-label">Active Subscriptions</div><div class="stat-value">${activeCount}</div></div>
    </div>
  `;
}

async function pageDashboard() {
  const subs = await getSubscriptions(state.search ? { search: state.search } : {});
  const biggest = [...subs]
    .sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))
    .slice(0, 5);

  const notifications = await api('/notifications');

  return {
    title: 'Dashboard',
    html: `
      ${renderStats(subs)}
      <div class="grid-2">
        <div class="card">
          <div class="inline-actions" style="justify-content:space-between; margin-bottom:10px;">
            <h3>Biggest Spenders</h3>
            <button class="btn-primary" id="quickAddBtn">Quick Add</button>
          </div>
          <div class="list">
            ${biggest.length ? biggest.map((s) => `
              <div class="list-item">
                <div>
                  <strong>${htmlEscape(s.service)}</strong>
                  <div class="muted">${htmlEscape(s.plan)} • ${htmlEscape(s.billingCycle)}</div>
                </div>
                <strong>${money(monthlyEquivalent(s), s.currency)} / mo</strong>
              </div>
            `).join('') : '<div class="empty">No subscriptions yet. Use Quick Add to create one.</div>'}
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">Upcoming Reminders</h3>
          <div class="list">
            ${notifications.upcoming.length ? notifications.upcoming.slice(0, 8).map((n) => `
              <div class="list-item">
                <div>${htmlEscape(n.message)}</div>
                <span class="badge">${htmlEscape(n.scheduledFor)}</span>
              </div>
            `).join('') : '<div class="empty">No reminders in the next 30 days.</div>'}
          </div>
        </div>
      </div>
    `,
    afterRender: () => {
      document.getElementById('quickAddBtn').addEventListener('click', () => openSubscriptionModal());
    }
  };
}

async function loadPricing() {
  if (state.cachedPricing) return state.cachedPricing;
  const data = await api('/pricing/library');
  state.cachedPricing = data.services;
  return data.services;
}

function subscriptionFormTemplate(pricing = []) {
  const services = pricing.map((x) => `<option value="${htmlEscape(x.service)}">${htmlEscape(x.service)}</option>`).join('');
  return `
    <h3 id="subTitle">Add Subscription</h3>
    <form class="form-grid" id="subscriptionForm" style="margin-top:12px;">
      <div class="grid-2">
        <div class="form-row"><label>Service</label><select id="service" required><option value="">Select service</option>${services}</select></div>
        <div class="form-row"><label>Plan</label><select id="plan" required><option value="">Select plan</option></select></div>
      </div>
      <div class="grid-3">
        <div class="form-row"><label>Category</label><input id="category" required /></div>
        <div class="form-row"><label>Billing Cycle</label><select id="billingCycle"><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="weekly">Weekly</option></select></div>
        <div class="form-row"><label>Status</label><select id="status"><option value="active">Active</option><option value="paused">Paused</option><option value="canceled">Canceled</option></select></div>
      </div>
      <div class="grid-3">
        <div class="form-row"><label>Amount (${state.user.currency})</label><input id="amount" type="number" step="0.01" min="0" required /></div>
        <div class="form-row"><label>Start Date</label><input id="startDate" type="date" required /></div>
        <div class="form-row"><label>Next Charge Date</label><input id="nextChargeDate" type="date" required /></div>
      </div>
      <div class="grid-2">
        <div class="form-row"><label>Payment Method</label><input id="paymentMethod" placeholder="Visa ending 1234" /></div>
        <div class="form-row"><label>Usage Last Seen (days ago)</label><input id="usageDaysAgo" type="number" min="0" /></div>
      </div>
      <div class="form-row"><label>Notes</label><textarea id="notes"></textarea></div>
      <div class="grid-2">
        <div class="card" style="box-shadow:none;">
          <strong>Reminder Rules</strong>
          <label class="checkbox"><input type="checkbox" id="r7" checked /> 7 days before</label>
          <label class="checkbox"><input type="checkbox" id="r1" checked /> 1 day before</label>
          <label class="checkbox"><input type="checkbox" id="r0" checked /> Same day</label>
        </div>
        <div class="card" style="box-shadow:none;">
          <strong>Delivery</strong>
          <label class="checkbox"><input type="checkbox" id="emailN" checked /> Email</label>
          <label class="checkbox"><input type="checkbox" id="smsN" ${state.user.smsEnabled ? '' : 'disabled'} /> SMS ${state.user.smsEnabled ? '' : '(enable in profile/settings)'}</label>
          <p class="muted" id="priceInfo" style="margin-top:8px;"></p>
        </div>
      </div>
      <div id="subMsg" class="form-error"></div>
      <div class="inline-actions">
        <button class="btn-primary" type="submit" id="submitSub">Create Subscription</button>
        <button class="btn-secondary" type="button" id="cancelSub">Cancel</button>
      </div>
    </form>
  `;
}

async function openSubscriptionModal(subscription = null) {
  const pricing = await loadPricing();
  openModal(subscriptionFormTemplate(pricing));

  const serviceEl = document.getElementById('service');
  const planEl = document.getElementById('plan');
  const categoryEl = document.getElementById('category');
  const titleEl = document.getElementById('subTitle');
  const submitEl = document.getElementById('submitSub');

  function populatePlans(serviceName) {
    const service = pricing.find((x) => x.service === serviceName);
    const options = service ? service.plans.map((p) => `<option value="${htmlEscape(p)}">${htmlEscape(p)}</option>`).join('') : '';
    planEl.innerHTML = `<option value="">Select plan</option>${options}`;
    if (service && !categoryEl.value) categoryEl.value = service.category || '';
  }

  async function tryResolvePrice() {
    const service = serviceEl.value;
    const plan = planEl.value;
    if (!service || !plan) return;

    const priceInfo = document.getElementById('priceInfo');
    try {
      const data = await api(`/pricing/resolve?service=${encodeURIComponent(service)}&plan=${encodeURIComponent(plan)}&currency=${state.user.currency}`);
      if (data.found) {
        document.getElementById('amount').value = data.amount;
        priceInfo.textContent = `Auto-filled from library. Last updated: ${data.updatedAt}`;
      } else {
        const hint = data.closest
          ? ` Closest: ${data.closest.country} ${data.closest.currency} ${data.closest.amount} (updated ${data.closest.updatedAt}).`
          : '';
        priceInfo.textContent = `Not available-enter manually.${hint}`;
      }
    } catch (_e) {
      priceInfo.textContent = '';
    }
  }

  serviceEl.addEventListener('change', () => {
    populatePlans(serviceEl.value);
    tryResolvePrice();
  });
  planEl.addEventListener('change', tryResolvePrice);

  if (subscription) {
    titleEl.textContent = 'Edit Subscription';
    submitEl.textContent = 'Save Changes';
    serviceEl.value = subscription.service;
    populatePlans(subscription.service);
    planEl.value = subscription.plan;
    categoryEl.value = subscription.category;
    document.getElementById('billingCycle').value = subscription.billingCycle;
    document.getElementById('status').value = subscription.status;
    document.getElementById('amount').value = subscription.amount;
    document.getElementById('startDate').value = subscription.startDate;
    document.getElementById('nextChargeDate').value = subscription.nextChargeDate;
    document.getElementById('paymentMethod').value = subscription.paymentMethod || '';
    document.getElementById('usageDaysAgo').value = subscription.usageDaysAgo ?? 7;
    document.getElementById('notes').value = subscription.notes || '';
    document.getElementById('r7').checked = subscription.reminders?.sevenDays;
    document.getElementById('r1').checked = subscription.reminders?.oneDay;
    document.getElementById('r0').checked = subscription.reminders?.sameDay;
    document.getElementById('emailN').checked = subscription.reminders?.email;
    document.getElementById('smsN').checked = subscription.reminders?.sms;
  }

  document.getElementById('cancelSub').addEventListener('click', closeModal);

  document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      service: serviceEl.value,
      plan: planEl.value,
      category: categoryEl.value.trim(),
      billingCycle: document.getElementById('billingCycle').value,
      amount: Number(document.getElementById('amount').value),
      currency: state.user.currency,
      startDate: document.getElementById('startDate').value,
      nextChargeDate: document.getElementById('nextChargeDate').value,
      paymentMethod: document.getElementById('paymentMethod').value.trim(),
      notes: document.getElementById('notes').value.trim(),
      status: document.getElementById('status').value,
      usageDaysAgo: Number(document.getElementById('usageDaysAgo').value || 7),
      manualPriceOverride: true,
      reminders: {
        sevenDays: document.getElementById('r7').checked,
        oneDay: document.getElementById('r1').checked,
        sameDay: document.getElementById('r0').checked,
        email: document.getElementById('emailN').checked,
        sms: document.getElementById('smsN').checked
      }
    };

    const msg = document.getElementById('subMsg');
    msg.textContent = '';

    if (!payload.service || !payload.plan || !payload.category) return (msg.textContent = 'Service, plan and category are required');
    if (!payload.startDate || !payload.nextChargeDate) return (msg.textContent = 'Dates are required');
    if (Number.isNaN(payload.amount) || payload.amount < 0) return (msg.textContent = 'Valid amount required');

    try {
      if (subscription) {
        await api(`/subscriptions/${subscription._id}`, { method: 'PUT', body: payload });
      } else {
        await api('/subscriptions', { method: 'POST', body: payload });
      }
      closeModal();
      render();
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

function subscriptionDetailModal(item) {
  openModal(`
    <h3>${htmlEscape(item.service)} - ${htmlEscape(item.plan)}</h3>
    <p class="muted" style="margin:8px 0 14px;">Status: ${htmlEscape(item.status)} | Next charge: ${htmlEscape(item.nextChargeDate)}</p>
    <div class="grid-2">
      <div class="card" style="box-shadow:none;">
        <p><strong>Category:</strong> ${htmlEscape(item.category)}</p>
        <p><strong>Billing:</strong> ${htmlEscape(item.billingCycle)}</p>
        <p><strong>Amount:</strong> ${money(item.amount, item.currency)}</p>
        <p><strong>Payment:</strong> ${htmlEscape(item.paymentMethod || '-')}</p>
      </div>
      <div class="card" style="box-shadow:none;">
        <p><strong>Start:</strong> ${htmlEscape(item.startDate)}</p>
        <p><strong>Usage Days Ago:</strong> ${item.usageDaysAgo ?? '-'}</p>
        <p><strong>Reminders:</strong> ${item.reminders.sevenDays ? '7d ' : ''}${item.reminders.oneDay ? '1d ' : ''}${item.reminders.sameDay ? 'same day' : ''}</p>
        <p><strong>Notes:</strong> ${htmlEscape(item.notes || '-')}</p>
      </div>
    </div>
    <div class="inline-actions" style="margin-top:14px;">
      <button class="btn-secondary" id="closeDetail">Close</button>
    </div>
  `);
  document.getElementById('closeDetail').addEventListener('click', closeModal);
}

async function pageSubscriptions() {
  const query = { ...state.subQuery };
  if (state.search) query.search = state.search;
  const items = await getSubscriptions(query);
  const categories = [...new Set(items.map((i) => i.category))].sort();

  return {
    title: 'Subscriptions',
    html: `
      <div class="card">
        <div class="inline-actions" style="justify-content:space-between; margin-bottom:10px;">
          <div class="inline-actions">
            <button class="btn-primary" id="addSubBtn">Add Subscription</button>
            <button class="btn-secondary" id="exportCsv">Export CSV</button>
          </div>
          <div class="inline-actions">
            <select id="sortBy">
              <option value="nextChargeDate">Renewal Date</option>
              <option value="amount">Amount</option>
              <option value="service">Service</option>
              <option value="category">Category</option>
              <option value="status">Status</option>
            </select>
            <select id="statusFilter">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="canceled">Canceled</option>
            </select>
            <select id="categoryFilter">
              <option value="">All Categories</option>
              ${categories.map((c) => `<option value="${htmlEscape(c)}">${htmlEscape(c)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="inline-actions" style="margin-bottom:10px;">
          <input id="minAmount" type="number" step="0.01" placeholder="Min amount" />
          <input id="maxAmount" type="number" step="0.01" placeholder="Max amount" />
          <input id="renewalFrom" type="date" />
          <input id="renewalTo" type="date" />
          <button class="btn-secondary" id="applyFilters">Apply Filters</button>
          <button class="btn-secondary" id="clearFilters">Clear</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Service</th><th>Plan</th><th>Amount</th><th>Category</th><th>Renewal</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${items.length ? items.map((s) => `
                <tr>
                  <td>${htmlEscape(s.service)}</td>
                  <td>${htmlEscape(s.plan)}</td>
                  <td>${money(s.amount, s.currency)}</td>
                  <td>${htmlEscape(s.category)}</td>
                  <td>${htmlEscape(s.nextChargeDate)}</td>
                  <td><span class="badge ${s.status === 'canceled' ? 'danger' : s.status === 'paused' ? 'warn' : ''}">${htmlEscape(s.status)}</span></td>
                  <td>
                    <div class="inline-actions">
                      <button class="btn-secondary detail-btn" data-id="${s._id}">View</button>
                      <button class="btn-secondary edit-btn" data-id="${s._id}">Edit</button>
                      <button class="btn-danger delete-btn" data-id="${s._id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="7"><div class="empty">No subscriptions found.</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,
    afterRender: () => {
      document.getElementById('sortBy').value = state.subQuery.sort;
      document.getElementById('statusFilter').value = state.subQuery.status;
      document.getElementById('categoryFilter').value = state.subQuery.category;
      document.getElementById('minAmount').value = state.subQuery.minAmount;
      document.getElementById('maxAmount').value = state.subQuery.maxAmount;
      document.getElementById('renewalFrom').value = state.subQuery.renewalFrom;
      document.getElementById('renewalTo').value = state.subQuery.renewalTo;

      document.getElementById('addSubBtn').addEventListener('click', () => openSubscriptionModal());
      document.getElementById('exportCsv').addEventListener('click', async () => {
        const response = await fetch(`${API_BASE}/subscriptions/export/csv`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subscriptions.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

      document.querySelectorAll('.detail-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const data = await api(`/subscriptions/${btn.dataset.id}`);
          subscriptionDetailModal(data.item);
        });
      });

      document.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const data = await api(`/subscriptions/${btn.dataset.id}`);
          openSubscriptionModal(data.item);
        });
      });

      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!window.confirm('Delete this subscription?')) return;
          await api(`/subscriptions/${btn.dataset.id}`, { method: 'DELETE' });
          render();
        });
      });

      document.getElementById('sortBy').addEventListener('change', (e) => {
        state.subQuery.sort = e.target.value;
        render();
      });
      document.getElementById('statusFilter').addEventListener('change', (e) => {
        state.subQuery.status = e.target.value;
        render();
      });
      document.getElementById('categoryFilter').addEventListener('change', (e) => {
        state.subQuery.category = e.target.value;
        render();
      });
      document.getElementById('applyFilters').addEventListener('click', () => {
        state.subQuery.minAmount = document.getElementById('minAmount').value;
        state.subQuery.maxAmount = document.getElementById('maxAmount').value;
        state.subQuery.renewalFrom = document.getElementById('renewalFrom').value;
        state.subQuery.renewalTo = document.getElementById('renewalTo').value;
        render();
      });
      document.getElementById('clearFilters').addEventListener('click', () => {
        state.subQuery = {
          sort: 'nextChargeDate',
          direction: 'asc',
          category: '',
          status: '',
          minAmount: '',
          maxAmount: '',
          renewalFrom: '',
          renewalTo: ''
        };
        render();
      });
    }
  };
}

async function pageCalendar() {
  const items = await getSubscriptions();
  const base = new Date();
  base.setMonth(base.getMonth() + state.calendarOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cells = [];

  for (let i = 0; i < start; i += 1) cells.push('<div class="cal-cell"></div>');

  for (let d = 1; d <= days; d += 1) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const matches = items.filter((s) => s.nextChargeDate === date);
    cells.push(`
      <div class="cal-cell">
        <div class="cal-date">${d}</div>
        ${matches.map((m) => `<div class="cal-event">${htmlEscape(m.service)} • ${money(m.amount, m.currency)}</div>`).join('')}
      </div>
    `);
  }

  return {
    title: 'Calendar',
    html: `
      <div class="card">
        <div class="inline-actions" style="justify-content:space-between; margin-bottom:10px;">
          <div class="inline-actions">
            <button class="btn-secondary" id="prevMonth">Prev</button>
            <button class="btn-secondary" id="nextMonth">Next</button>
          </div>
          <h3>${base.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div class="calendar-grid">${labels.map((x) => `<div class="cal-date"><strong>${x}</strong></div>`).join('')}</div>
        <div class="calendar-grid" style="margin-top:8px;">${cells.join('')}</div>
      </div>
    `,
    afterRender: () => {
      document.getElementById('prevMonth').addEventListener('click', () => { state.calendarOffset -= 1; render(); });
      document.getElementById('nextMonth').addEventListener('click', () => { state.calendarOffset += 1; render(); });
    }
  };
}

async function pageInsights() {
  const data = await api('/insights');
  const allSubs = await getSubscriptions();
  const byCategory = {};
  const byService = {};
  const byMonth = {};

  allSubs.forEach((s) => {
    const month = s.nextChargeDate.slice(0, 7);
    byCategory[s.category] = (byCategory[s.category] || 0) + monthlyEquivalent(s);
    byService[s.service] = (byService[s.service] || 0) + monthlyEquivalent(s);
    byMonth[month] = (byMonth[month] || 0) + monthlyEquivalent(s);
  });

  const catMax = Math.max(1, ...Object.values(byCategory));

  return {
    title: 'Insights',
    html: `
      <div class="grid-2">
        <div class="card">
          <h3 style="margin-bottom:10px;">AI Suggestions</h3>
          <div class="list">
            ${data.insights.length ? data.insights.map((i) => `
              <div class="list-item">
                <div>
                  <strong>${htmlEscape(i.text)}</strong>
                  <div class="muted">Severity: ${htmlEscape(i.severity)}</div>
                </div>
                <button class="btn-primary apply-insight" data-action="${i.action}" data-id="${i.subscriptionId}">${htmlEscape(i.actionLabel || 'Apply')}</button>
              </div>
            `).join('') : '<div class="empty">No insights yet. Add subscriptions to unlock recommendations.</div>'}
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">Category Breakdown</h3>
          <div class="chart">
            ${Object.keys(byCategory).length ? Object.entries(byCategory).map(([cat, val]) => `
              <div class="bar-row">
                <span>${htmlEscape(cat)}</span>
                <div class="bar-track"><div class="bar-fill" style="width:${(val / catMax) * 100}%"></div></div>
                <strong>${money(val, state.user.currency)}</strong>
              </div>
            `).join('') : '<div class="empty">No category data.</div>'}
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 style="margin-bottom:10px;">Monthly Trend</h3>
          <div class="chart">
            ${Object.keys(byMonth).sort().map((m) => `<div class="list-item"><span>${m}</span><strong>${money(byMonth[m], state.user.currency)}</strong></div>`).join('') || '<div class="empty">No trend data.</div>'}
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">Spend by Service</h3>
          <div class="chart">
            ${Object.keys(byService).sort((a, b) => byService[b] - byService[a]).slice(0, 8).map((s) => `<div class="list-item"><span>${htmlEscape(s)}</span><strong>${money(byService[s], state.user.currency)}</strong></div>`).join('') || '<div class="empty">No service data.</div>'}
          </div>
        </div>
      </div>
    `,
    afterRender: () => {
      document.querySelectorAll('.apply-insight').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await api('/insights/apply', {
            method: 'POST',
            body: { action: btn.dataset.action, subscriptionId: btn.dataset.id }
          });
          render();
        });
      });
    }
  };
}

async function pageNotifications() {
  const data = await api('/notifications');

  return {
    title: 'Notifications',
    html: `
      <div class="grid-2">
        <div class="card">
          <h3 style="margin-bottom:10px;">Upcoming Reminders</h3>
          <div class="list">
            ${data.upcoming.length ? data.upcoming.map((n) => `<div class="list-item"><span>${htmlEscape(n.message)}</span><span class="badge">${htmlEscape(n.channel)} • ${htmlEscape(n.scheduledFor)}</span></div>`).join('') : '<div class="empty">No upcoming reminders.</div>'}
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px;">Sent History</h3>
          <div class="list">
            ${data.history.length ? data.history.map((n) => `<div class="list-item"><span>${htmlEscape(n.message)}</span><span class="badge ${n.channel === 'sms' ? 'warn' : ''}">${htmlEscape(n.channel)} • ${String(n.createdAt).slice(0, 10)}</span></div>`).join('') : '<div class="empty">No notification history yet.</div>'}
          </div>
        </div>
      </div>
    `
  };
}

async function pageSettings() {
  return {
    title: 'Settings',
    html: `
      <div class="card">
        <h3 style="margin-bottom:10px;">Branding & Preferences</h3>
        <form id="settingsForm" class="form-grid">
          <div class="grid-3">
            <div class="form-row"><label>App Name</label><input id="appName" value="${htmlEscape(state.user.appName || 'SubSense')}" /></div>
            <div class="form-row"><label>Country</label><select id="country"><option>United States</option><option>India</option><option>UAE</option></select></div>
            <div class="form-row"><label>Currency</label><select id="currency"><option value="USD">USD</option><option value="INR">INR</option><option value="AED">AED</option></select></div>
          </div>
          <div class="checkbox"><input type="checkbox" id="emailEnabled" ${state.user.emailEnabled ? 'checked' : ''}/> Enable email notifications</div>
          <div class="checkbox"><input type="checkbox" id="smsEnabled" ${state.user.smsEnabled ? 'checked' : ''}/> Enable SMS notifications</div>
          <div class="inline-actions">
            <button class="btn-primary" type="submit">Save Settings</button>
            <button class="btn-secondary" type="button" id="testEmail">Test Email Notification</button>
            <button class="btn-secondary" type="button" id="testSms">Test SMS Notification</button>
          </div>
          <div id="settingsMsg" class="form-success"></div>
        </form>
      </div>
    `,
    afterRender: () => {
      document.getElementById('country').value = state.user.country || 'United States';
      document.getElementById('currency').value = state.user.currency || 'USD';

      document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
          appName: document.getElementById('appName').value.trim() || 'SubSense',
          country: document.getElementById('country').value,
          currency: document.getElementById('currency').value,
          emailEnabled: document.getElementById('emailEnabled').checked,
          smsEnabled: document.getElementById('smsEnabled').checked
        };
        const data = await api('/profile', { method: 'PUT', body });
        state.user = data.user;
        state.cachedPricing = null;
        document.getElementById('settingsMsg').textContent = 'Settings saved';
        render();
      });

      document.getElementById('testEmail').addEventListener('click', async () => {
        const msg = document.getElementById('settingsMsg');
        try {
          await api('/notifications/test', { method: 'POST', body: { channel: 'email' } });
          msg.textContent = 'Email test notification sent';
          msg.className = 'form-success';
        } catch (e) {
          msg.textContent = e.message;
          msg.className = 'form-error';
        }
      });

      document.getElementById('testSms').addEventListener('click', async () => {
        const msg = document.getElementById('settingsMsg');
        try {
          await api('/notifications/test', { method: 'POST', body: { channel: 'sms' } });
          msg.textContent = 'SMS test notification sent';
          msg.className = 'form-success';
        } catch (e) {
          msg.textContent = e.message;
          msg.className = 'form-error';
        }
      });
    }
  };
}

async function pageProfile() {
  return {
    title: 'Profile',
    html: `
      <div class="card">
        <form id="profileForm" class="form-grid">
          <div class="grid-2">
            <div class="form-row"><label>Name</label><input id="name" value="${htmlEscape(state.user.name)}" required /></div>
            <div class="form-row"><label>Email (read-only)</label><input value="${htmlEscape(state.user.email)}" disabled /></div>
          </div>
          <div class="grid-3">
            <div class="form-row"><label>Country</label><select id="country"><option>United States</option><option>India</option><option>UAE</option></select></div>
            <div class="form-row"><label>Currency</label><select id="currency"><option value="USD">USD</option><option value="INR">INR</option><option value="AED">AED</option></select></div>
            <div class="form-row"><label>Timezone</label><input id="timezone" value="${htmlEscape(state.user.timezone || 'UTC')}" /></div>
          </div>
          <div class="grid-2">
            <div class="form-row"><label>Phone (SMS)</label><input id="phone" value="${htmlEscape(state.user.phone || '')}" /></div>
            <div class="form-row">
              <label>Phone Verification</label>
              <div class="inline-actions">
                <button class="btn-secondary" type="button" id="sendCode">Send Code</button>
                <input id="verifyCode" placeholder="Enter code" />
                <button class="btn-secondary" type="button" id="verifyBtn">Verify</button>
              </div>
            </div>
          </div>
          <div class="inline-actions">
            <button class="btn-primary" type="submit">Save Profile</button>
            <button class="btn-danger" type="button" id="deleteAccount">Delete Account</button>
          </div>
          <div id="profileMsg" class="form-success"></div>
        </form>
      </div>
    `,
    afterRender: () => {
      document.getElementById('country').value = state.user.country || 'United States';
      document.getElementById('currency').value = state.user.currency || 'USD';

      document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
          name: document.getElementById('name').value.trim(),
          country: document.getElementById('country').value,
          currency: document.getElementById('currency').value,
          timezone: document.getElementById('timezone').value.trim() || 'UTC',
          phone: document.getElementById('phone').value.trim()
        };
        const data = await api('/profile', { method: 'PUT', body });
        state.user = data.user;
        document.getElementById('profileMsg').textContent = 'Profile updated';
      });

      document.getElementById('sendCode').addEventListener('click', async () => {
        const msg = document.getElementById('profileMsg');
        try {
          const phone = document.getElementById('phone').value.trim();
          if (!phone) throw new Error('Enter phone first');
          await api('/profile', { method: 'PUT', body: { phone } });
          const data = await api('/profile/verify-phone/send', { method: 'POST' });
          msg.textContent = `Code sent. Demo code: ${data.demoCode}`;
          msg.className = 'form-success';
        } catch (e) {
          msg.textContent = e.message;
          msg.className = 'form-error';
        }
      });

      document.getElementById('verifyBtn').addEventListener('click', async () => {
        const msg = document.getElementById('profileMsg');
        try {
          await api('/profile/verify-phone/check', { method: 'POST', body: { code: document.getElementById('verifyCode').value.trim() } });
          msg.textContent = 'Phone verified and SMS enabled';
          msg.className = 'form-success';
          const me = await api('/auth/me');
          state.user = me.user;
        } catch (e) {
          msg.textContent = e.message;
          msg.className = 'form-error';
        }
      });

      document.getElementById('deleteAccount').addEventListener('click', async () => {
        if (!window.confirm('Delete account and all subscriptions/reminders/notifications? This cannot be undone.')) return;
        await api('/auth/account', { method: 'DELETE' });
        setToken('');
        state.user = null;
        saveFlash('Account deleted successfully. Create a new account to continue.');
        redirect('signup');
      });
    }
  };
}

async function render() {
  const route = getRoute();

  if (isAuthRoute(route)) {
    if (await ensureMe()) return redirect('dashboard');
    if (route === 'login') return renderLogin();
    return renderSignup();
  }

  if (!(await ensureMe())) return redirect('login');

  try {
    let page;
    if (route === 'dashboard') page = await pageDashboard();
    else if (route === 'subscriptions') page = await pageSubscriptions();
    else if (route === 'calendar') page = await pageCalendar();
    else if (route === 'insights') page = await pageInsights();
    else if (route === 'notifications') page = await pageNotifications();
    else if (route === 'settings') page = await pageSettings();
    else if (route === 'profile') page = await pageProfile();
    else return redirect('dashboard');

    appLayout(route, page.title, page.html);
    if (typeof page.afterRender === 'function') page.afterRender();
  } catch (error) {
    appLayout(route, 'Error', `<div class="card"><p class="form-error">${htmlEscape(error.message)}</p></div>`);
  }
}

window.addEventListener('hashchange', render);

if (!window.location.hash) {
  window.location.hash = state.token ? '#/dashboard' : '#/login';
}
render();
