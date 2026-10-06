// Presentation only: shared themes and live order summaries.
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  let theme = 'light';
  try { theme = localStorage.getItem('tailor-ui-theme') === 'dark' ? 'dark' : 'light'; } catch {}
  function applyTheme() {
    root.dataset.theme = theme;
    toggle.textContent = theme === 'dark' ? '☀' : '☾';
    toggle.title = toggle.ariaLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
  applyTheme();
  toggle.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme();
    try { localStorage.setItem('tailor-ui-theme', theme); } catch {}
  });

  const originalDashboard = dashboard;
  dashboard = () => {
    const counts = stages.map(stage => state.orders.filter(order => order.status === stage).length);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const colors = ['#718360', '#47758a', '#e9500b', '#7f985e', '#a7b2b8'];
    let offset = 0;
    const segments = counts.map((count, i) => {
      const start = offset;
      offset += total ? count / total * 100 : 0;
      return `${colors[i]} ${start}% ${offset}%`;
    });
    const now = new Date();
    const months = Array.from({length: 6}, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        label: date.toLocaleDateString('en', {month:'short'}),
        count: state.orders.filter(order => String(order.deliveryDate || '').startsWith(key)).length
      };
    });
    const max = Math.max(1, ...months.map(month => month.count));
    const collected = state.orders.reduce((sum, order) => sum + Number(order.advance || 0), 0);
    const balance = state.orders.reduce((sum, order) => sum + Math.max(0, Number(order.total || 0) - Number(order.advance || 0)), 0);
    return `${dashboardSummary()}<div class="panel panel-body quick-actions dashboard-quick-actions">
      ${action('+ New Order', 'new-order', '', 'primary')}
      ${action('+ Add Customer', 'add-customer')}
      <button class="outline" data-view="production">Production Board</button>
      ${action('+ Measurements', 'measurement-add')}
    </div><div class="studio-intro"><div><span class="eyebrow">YOUR WORKSPACE, AT A GLANCE</span><h2>A little more clarity.<br>A lot more possibility.</h2><p>Every order, every detail. Beautifully in sync.</p></div></div>
      <div class="grid overview-grid">
        <section class="panel balance-panel"><div class="panel-head"><span class="panel-title">Order collections</span><span class="live-label">LIVE OVERVIEW</span></div><div class="panel-body"><div class="balance-label">Total advance received</div><div class="balance-value">${money(collected)}</div><div class="balance-line" aria-hidden="true"><svg viewBox="0 0 320 60"><path d="M0 45 Q40 65 80 35 T160 30 T240 16 T320 12" fill="none" stroke="currentColor" stroke-width="2"/></svg></div><div class="balance-bottom"><span>Outstanding balance</span><strong>${money(balance)}</strong></div></div></section>
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Delivery activity</div><div class="panel-sub">Last six months · scheduled delivery dates</div></div><span class="chart-tag">Orders</span></div><div class="panel-body"><div class="activity-chart">${months.map(month => `<div class="activity-column"><span>${month.count}</span><div class="activity-track"><div class="activity-bar" style="height:${month.count ? Math.max(5, month.count / max * 100) : 0}%"></div></div><small>${month.label}</small></div>`).join('')}</div></div></section>
        <section class="panel"><div class="panel-head"><div><div class="panel-title">Production mix</div><div class="panel-sub">Orders across your workflow</div></div></div><div class="panel-body production-summary"><div class="order-donut" style="--donut:${total ? `conic-gradient(${segments.join(',')})` : 'var(--line)'}" role="img" aria-label="${escapeHTML(stages.map((stage, i) => `${stage}: ${counts[i]}`).join(', '))}"><div><strong>${total}</strong><span>orders</span></div></div><div class="chart-legend">${stages.map((stage, i) => `<div><span class="legend-dot" style="background:${colors[i]}"></span><span>${escapeHTML(stage)}</span><strong>${counts[i]}</strong></div>`).join('')}</div></div></section>
      </div>${originalDashboard()}`;
  };
  // Use the native select as an in-flow listbox while open. Its increased
  // height reserves real layout space instead of drawing a popup over fields.
  // Delegation also covers wizard steps and dialogs rendered after startup.
  let expandedSelect = null;
  let originalSize = null;
  function closeSelect() {
    if (!expandedSelect) return;
    if (originalSize === null) expandedSelect.removeAttribute('size');
    else expandedSelect.setAttribute('size', originalSize);
    expandedSelect.classList.remove('select-expanded');
    expandedSelect = null;
  }
  function openSelect(select) {
    closeSelect();
    originalSize = select.getAttribute('size');
    expandedSelect = select;
    select.size = Math.min(8, Math.max(2, select.options.length));
    select.classList.add('select-expanded');
    select.focus({preventScroll: true});
  }
  document.addEventListener('pointerdown', event => {
    const select = event.target.closest('select');
    if (select === expandedSelect) return;
    closeSelect();
    if (!select || select.disabled || select.multiple || select.size > 1) return;
    event.preventDefault();
    openSelect(select);
  }, true);
  document.addEventListener('keydown', event => {
    const select = event.target.closest('select');
    if (!select || select.disabled || select.multiple) return;
    if (select === expandedSelect) {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        closeSelect();
      } else if (event.key === 'Tab') closeSelect();
    } else if (select.size <= 1 && [' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      openSelect(select);
    }
  }, true);
  document.addEventListener('change', event => {
    if (event.target === expandedSelect) closeSelect();
  }, true);
  document.addEventListener('focusout', event => {
    if (event.target === expandedSelect) closeSelect();
  }, true);
  // Animate actual step changes, leaving validation and same-step edits alone.
  const originalRenderWizard = renderWizard;
  renderWizard = () => {
    closeSelect();
    const previousShell = document.querySelector('.wizard-shell');
    const previousStep = previousShell?.dataset.wizardStep;
    const changed = previousStep === undefined || Number(previousStep) !== state.wizardStep;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const previousCard = previousShell?.querySelector('.wizard-card');
    const ghost = changed && !reducedMotion && previousCard?.cloneNode
      ? previousCard.cloneNode(true) : null;
    const result = originalRenderWizard();
    const shell = document.querySelector('.wizard-shell');
    if (!shell) return result;
    shell.dataset.wizardStep = String(state.wizardStep);
    if (!changed) return result;
    const card = shell.querySelector('.wizard-card');
    const heading = card?.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({preventScroll:true});
    }
    if (reducedMotion || !card) return result;
    const backwards = previousStep !== undefined && state.wizardStep < Number(previousStep);
    shell.classList.add('wizard-transition');
    shell.style.setProperty('--wizard-direction', backwards ? '-1' : '1');
    card.classList.add('wizard-enter');
    if (state.wizardStep === 7) card.classList.add('wizard-celebrate');
    const completed = !backwards && previousStep !== undefined
      ? shell.querySelectorAll('.step')[Number(previousStep)] : null;
    completed?.classList.add('just-completed');
    if (ghost) {
      ghost.classList.remove('wizard-enter', 'wizard-celebrate');
      ghost.classList.add('wizard-ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      ghost.style.top = `${card.offsetTop}px`;
      shell.appendChild(ghost);
    }
    // Cleanup also runs when the user advances before the animation finishes.
    setTimeout(() => {
      ghost?.remove();
      card.classList.remove('wizard-enter', 'wizard-celebrate');
      shell.classList.remove('wizard-transition');
      completed?.classList.remove('just-completed');
    }, 850);
    return result;
  };
  render();
})();
