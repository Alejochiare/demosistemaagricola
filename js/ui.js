/* ============================================================
   AgroGestión — Capa de interfaz
   Iconos, formateo, toasts, modal y diálogo de confirmación.
   ============================================================ */

const UI = (() => {

  /* ---------------- Iconos (línea, 24x24) ---------------- */

  const ICON_PATHS = {
    grid: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/>',
    leaf: '<path d="M4 20c8-1 13-6 14-14-8 1-13 6-14 14Z"/><path d="M4 20c1.5-3.2 3-6.6 6-9.6"/>',
    sprout: '<path d="M12 21V9"/><path d="M12 9c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Z"/><path d="M12 9c0-3 2-5 5-5 0 3-2 5-5 5Z"/>',
    droplet: '<path d="M12 3s6 6.7 6 11a6 6 0 0 1-12 0c0-4.3 6-11 6-11Z"/>',
    basket: '<path d="M4 10h16l-1.5 9.2a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 10Z"/><path d="m8 10 2-6M16 10l-2-6M9 14v3M15 14v3"/>',
    note: '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8.5 11h7M8.5 15h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
    filter: '<path d="M4 5h16l-6.2 7.4V19l-3.6 2v-8.6L4 5Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.4 2.4L16 9.6"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9.5v3.5"/><circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none"/>',
    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    more: '<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    trending: '<path d="m3 17 6-6 4 4 8-9"/><path d="M14 6h7v7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    inbox: '<path d="m3 9 3-6h12l3 6"/><path d="M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9"/><path d="M3 9h5a1 1 0 0 1 1 1 3 3 0 0 0 6 0 1 1 0 0 1 1-1h5"/>',
    pin: '<path d="M12 21s7-6.7 7-12.2A7 7 0 1 0 5 8.8C5 14.3 12 21 12 21Z"/><circle cx="12" cy="8.7" r="2.3"/>',
    ruler: '<path d="M3 8h18v8H3z"/><path d="M7 8v3M11 8v3M15 8v3M19 8v3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    upRight: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    downRight: '<path d="M7 7 17 17"/><path d="M17 9v8H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>',
    package: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    lightning: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>',
    map: '<path d="M9 3 3 5.2v15.6L9 18.6l6 2.2 6-2.2V2.8l-6 2.2-6-2.2Z"/><path d="M9 3v15.6M15 5v15.8"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    cloud: '<path d="M6.5 18a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.7 3.7 0 0 1 17 18H6.5Z"/>',
    cloudRain: '<path d="M6.5 15a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.7 3.7 0 0 1 17 15H6.5Z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/>',
    sunCloud: '<circle cx="8" cy="8" r="3"/><path d="M8 3v1.4M3 8h1.4M4.4 4.4l1 1"/><path d="M11 20a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-9.4 3.1A3.3 3.3 0 0 0 3 20h8Z"/>',
    storm: '<path d="M6.5 14.5a4 4 0 0 1 .3-8 5.5 5.5 0 0 1 10.6 1.7A3.7 3.7 0 0 1 17 14.5H6.5Z"/><path d="M13 14l-3 5h3l-2 4"/>',
    dollar: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 13h15a3 3 0 1 1-3 3"/><path d="M3 18h8a2 2 0 1 0-2-2"/>',
    cow: '<path d="M4 9c0-2 1.5-3 3-2.5.5-1.5 2-2.5 5-2.5s4.5 1 5 2.5c1.5-.5 3 .5 3 2.5 0 1.2-.7 2-1.5 2.3.9 1 1.5 2.4 1.5 3.9 0 3.2-3 5.8-8 5.8s-8-2.6-8-5.8c0-1.5.6-2.9 1.5-3.9C4.7 11 4 10.2 4 9Z"/><circle cx="9" cy="13.3" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13.3" r="1" fill="currentColor" stroke="none"/><path d="M10.3 16.3c.5.5 1 .6 1.7.6s1.2-.1 1.7-.6"/>',
    swap: '<path d="M7 7h13l-4-4"/><path d="M17 17H4l4 4"/>',
    cross: '<path d="M12 4v16M4 12h16"/>',
    heart: '<path d="M12 21s-7-4.4-9.5-8.9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.5 6.1C19 16.6 12 21 12 21Z"/>',
  };

  function icon(name, opts = {}) {
    const size = opts.size || 18;
    const cls = opts.class ? ` ${opts.class}` : '';
    const body = ICON_PATHS[name] || ICON_PATHS.info;
    return `<svg class="icon${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth || 1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  /* ---------------- Formateo ---------------- */

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso, opts = {}) {
    if (!iso) return '—';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    const fmt = new Intl.DateTimeFormat('es-AR', opts.long
      ? { day: '2-digit', month: 'long', year: 'numeric' }
      : { day: '2-digit', month: 'short', year: 'numeric' });
    return fmt.format(d);
  }

  function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || num === '') return '—';
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(num));
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const target = new Date(`${iso}T00:00:00`).getTime();
    const diffDays = Math.round((target - Date.now()) / 86400000);
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    if (diffDays === -1) return 'ayer';
    if (diffDays > 1) return `en ${diffDays} días`;
    return `hace ${Math.abs(diffDays)} días`;
  }

  function debounce(fn, wait = 220) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  /* ---------------- Badges & chips ---------------- */

  function badge(text, variant = 'neutral') {
    return `<span class="badge badge--${variant}">${escapeHTML(text)}</span>`;
  }

  const ESTADO_VARIANT = {
    'Activo': 'success',
    'En preparación': 'warning',
    'En descanso': 'info',
    'Inactivo': 'muted',
  };
  const PRIORIDAD_VARIANT = { 'Alta': 'danger', 'Media': 'warning', 'Baja': 'info' };

  /* ---------------- Estado vacío ---------------- */

  function emptyState({ iconName = 'inbox', title, message, actionLabel, actionAttr = '' }) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">${icon(iconName, { size: 30 })}</div>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(message)}</p>
        ${actionLabel ? `<button class="btn btn--primary" ${actionAttr}>${icon('plus', { size: 15 })}<span>${escapeHTML(actionLabel)}</span></button>` : ''}
      </div>`;
  }

  /* ---------------- Toasts ---------------- */

  let toastStack;
  const TOAST_ICON = { success: 'check-circle', error: 'alert-circle', warning: 'alert', info: 'info' };

  function toast(message, type = 'success', title = '') {
    if (!toastStack) toastStack = document.getElementById('toastStack');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <span class="toast__icon">${icon(TOAST_ICON[type] || 'info', { size: 18 })}</span>
      <div class="toast__body">
        ${title ? `<strong>${escapeHTML(title)}</strong>` : ''}
        <span>${escapeHTML(message)}</span>
      </div>
      <button class="toast__close" type="button" aria-label="Cerrar">${icon('close', { size: 14 })}</button>`;
    toastStack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));

    let timer = setTimeout(() => dismiss(), 4200);
    function dismiss() {
      clearTimeout(timer);
      el.classList.remove('is-visible');
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 260);
    }
    el.querySelector('.toast__close').addEventListener('click', dismiss);
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 2200); });
  }

  /* ---------------- Modal ---------------- */

  let modalOverlay, modalContainer, modalCloseCb = null;

  function openModal({ title, subtitle = '', bodyHTML = '', footerHTML = '', size = '', onMount, onClose }) {
    if (!modalOverlay) {
      modalOverlay = document.getElementById('modalOverlay');
      modalContainer = document.getElementById('modalContainer');
    }
    modalCloseCb = onClose || null;
    modalContainer.className = `modal${size ? ` modal--${size}` : ''}`;
    modalContainer.innerHTML = `
      <div class="modal__header">
        <div>
          <h2 id="modalTitle">${escapeHTML(title)}</h2>
          ${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ''}
        </div>
        <button class="icon-btn modal__close" type="button" aria-label="Cerrar">${icon('close', { size: 18 })}</button>
      </div>
      <div class="modal__body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal__footer">${footerHTML}</div>` : ''}`;
    modalOverlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
    modalContainer.querySelector('.modal__close').addEventListener('click', closeModal);
    if (onMount) onMount(modalContainer);
    const firstField = modalContainer.querySelector('input, select, textarea');
    if (firstField) setTimeout(() => firstField.focus(), 60);
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    if (modalCloseCb) { const cb = modalCloseCb; modalCloseCb = null; cb(); }
  }

  function isModalOpen() {
    return !!(modalOverlay && modalOverlay.classList.contains('is-open'));
  }

  /* ---------------- Confirmación ---------------- */

  let confirmOverlay, confirmBox;

  function confirmDialog({ title = 'Confirmar acción', message, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', tone = 'danger' }) {
    if (!confirmOverlay) {
      confirmOverlay = document.getElementById('confirmOverlay');
      confirmBox = document.getElementById('confirmBox');
    }
    return new Promise((resolve) => {
      confirmBox.innerHTML = `
        <div class="confirm-box__icon confirm-box__icon--${tone}">${icon(tone === 'danger' ? 'trash' : 'alert', { size: 20 })}</div>
        <h3>${escapeHTML(title)}</h3>
        <p>${message}</p>
        <div class="confirm-box__actions">
          <button class="btn btn--ghost" type="button" data-act="cancel">${escapeHTML(cancelLabel)}</button>
          <button class="btn btn--${tone === 'danger' ? 'danger' : 'primary'}" type="button" data-act="confirm">${escapeHTML(confirmLabel)}</button>
        </div>`;
      confirmOverlay.classList.add('is-open');

      function finish(result) {
        confirmOverlay.classList.remove('is-open');
        confirmBox.querySelector('[data-act="confirm"]').removeEventListener('click', onConfirm);
        confirmBox.querySelector('[data-act="cancel"]').removeEventListener('click', onCancel);
        resolve(result);
      }
      function onConfirm() { finish(true); }
      function onCancel() { finish(false); }
      confirmBox.querySelector('[data-act="confirm"]').addEventListener('click', onConfirm);
      confirmBox.querySelector('[data-act="cancel"]').addEventListener('click', onCancel);
    });
  }

  /* ---------------- Inicialización de chrome global ---------------- */

  function initChrome() {
    modalOverlay = document.getElementById('modalOverlay');
    modalContainer = document.getElementById('modalContainer');
    confirmOverlay = document.getElementById('confirmOverlay');
    confirmBox = document.getElementById('confirmBox');
    toastStack = document.getElementById('toastStack');

    modalOverlay.addEventListener('mousedown', (e) => { if (e.target === modalOverlay) closeModal(); });
    confirmOverlay.addEventListener('mousedown', (e) => {
      if (e.target === confirmOverlay) confirmOverlay.classList.remove('is-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modalOverlay.classList.contains('is-open')) closeModal();
        else if (confirmOverlay.classList.contains('is-open')) confirmOverlay.classList.remove('is-open');
      }
    });
  }

  return {
    icon, escapeHTML, formatDate, formatNumber, timeAgo, debounce,
    badge, ESTADO_VARIANT, PRIORIDAD_VARIANT,
    emptyState, toast,
    openModal, closeModal, isModalOpen,
    confirmDialog, initChrome,
  };
})();
