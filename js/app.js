/* ============================================================
   AgroGestión — Aplicación
   Router SPA, vistas por módulo, formularios y validaciones.
   ============================================================ */

(() => {
  'use strict';

  /* ---------------- Configuración de rutas ---------------- */

  const ROUTES = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid', subtitle: 'Resumen ejecutivo de la operación', group: '' },

    { key: 'lotes', label: 'Lotes', icon: 'layers', subtitle: 'Gestión de lotes y parcelas productivas', group: 'Agricultura' },
    { key: 'mapa', label: 'Mapa', icon: 'map', subtitle: 'Ubicación geográfica de los lotes en Argentina', group: 'Agricultura' },
    { key: 'clima', label: 'Clima', icon: 'cloud', subtitle: 'Pronóstico de 5 días por lote', group: 'Agricultura' },
    { key: 'siembras', label: 'Siembras', icon: 'sprout', subtitle: 'Registro y seguimiento de siembras', group: 'Agricultura' },
    { key: 'fumigaciones', label: 'Fumigaciones', icon: 'droplet', subtitle: 'Historial de aplicaciones fitosanitarias', group: 'Agricultura' },
    { key: 'insumos', label: 'Insumos', icon: 'package', subtitle: 'Stock de fitosanitarios, fertilizantes y semillas', group: 'Agricultura' },
    { key: 'cosechas', label: 'Cosechas', icon: 'basket', subtitle: 'Historial operativo de cosechas', group: 'Agricultura' },
    { key: 'notas', label: 'Notas', icon: 'note', subtitle: 'Seguimiento operativo por lote', group: 'Agricultura' },
    { key: 'cultivos', label: 'Cultivos', icon: 'leaf', subtitle: 'Catálogo de cultivos gestionados', group: 'Agricultura' },
    { key: 'precios', label: 'Precios', icon: 'dollar', subtitle: 'Precios de referencia y valorización de la producción', group: 'Agricultura' },

    { key: 'hacienda', label: 'Hacienda', icon: 'cow', subtitle: 'Stock y composición del rodeo', group: 'Ganadería' },
    { key: 'movimientos', label: 'Movimientos', icon: 'swap', subtitle: 'Altas, bajas, compras, ventas y traslados de hacienda', group: 'Ganadería' },
    { key: 'sanidad', label: 'Sanidad animal', icon: 'cross', subtitle: 'Vacunaciones y tratamientos veterinarios', group: 'Ganadería' },
    { key: 'reproduccion', label: 'Reproducción', icon: 'heart', subtitle: 'Servicios, diagnóstico de preñez y parición', group: 'Ganadería' },
    { key: 'pesadas', label: 'Pesadas', icon: 'trending', subtitle: 'Seguimiento de peso por categoría', group: 'Ganadería' },
  ];

  const VIEW_RENDERERS = {
    dashboard: renderDashboard,
    lotes: renderLotes,
    mapa: renderMapa,
    clima: renderClima,
    cultivos: renderCultivos,
    siembras: renderSiembras,
    fumigaciones: renderFumigaciones,
    insumos: renderInsumos,
    cosechas: renderCosechas,
    notas: renderNotas,
    precios: renderPrecios,
    hacienda: renderHacienda,
    movimientos: renderMovimientos,
    sanidad: renderSanidad,
    reproduccion: renderReproduccion,
    pesadas: renderPesadas,
  };

  const TIPO_VARIANT = { Cereal: 'neutral', Oleaginosa: 'info', Legumbre: 'success', Hortaliza: 'warning', Forraje: 'muted', Otro: 'neutral' };
  const PRIORIDAD_ORDER = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
  const ESTADO_DOT_COLOR = { 'Activo': 'var(--success)', 'En preparación': 'var(--warning)', 'En descanso': 'var(--info)', 'Inactivo': 'var(--text-muted)' };
  const ESTADO_PIN_COLOR = { 'Activo': '#2f8f52', 'En preparación': '#b9791b', 'En descanso': '#5686bf', 'Inactivo': '#8b9689' };
  const ARGENTINA_CENTER = [-38.4161, -63.6167];

  let mapInstance = null;
  let mapMarkers = {};

  const state = {
    route: 'dashboard',
    filters: {
      lotes: { search: '', estado: '' },
      cultivos: { search: '', tipo: '' },
      siembras: { search: '', loteId: '', cultivoId: '', desde: '', hasta: '' },
      fumigaciones: { search: '', loteId: '', aplicador: '', desde: '', hasta: '' },
      cosechas: { search: '', loteId: '', cultivoId: '', desde: '', hasta: '' },
      notas: { search: '', loteId: '', prioridad: '', estado: '' },
      insumos: { search: '', categoria: '', bajo: false },
      movimientos: { tipo: '', categoriaId: '', loteId: '', desde: '', hasta: '' },
      sanidad: { tipo: '', categoriaId: '', loteId: '', desde: '', hasta: '' },
      reproduccion: { tipo: '', categoriaId: '', loteId: '', desde: '', hasta: '' },
      pesadas: { categoriaId: '', loteId: '' },
    },
  };

  /* ---------------- Arranque ---------------- */

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    Auth.whenReady().then(async () => {
      await DB.load();
      UI.initChrome();
      applyTheme(DB.getSettings().theme || 'light');
      renderSidebarNav();
      wireChrome();
      window.addEventListener('hashchange', handleRouteChange);
      handleRouteChange();
      tickClock();
      setInterval(tickClock, 60000);
    });
  }

  function tickClock() {
    const el = document.getElementById('sidebarClock');
    if (!el) return;
    el.textContent = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  }

  /* ---------------- Router ---------------- */

  function currentRouteKey() {
    const hash = (location.hash || '#/dashboard').replace('#/', '').split('?')[0];
    return ROUTES.some((r) => r.key === hash) ? hash : 'dashboard';
  }

  function navigate(key) {
    location.hash = `#/${key}`;
  }

  function handleRouteChange() {
    const key = currentRouteKey();
    state.route = key;
    const route = ROUTES.find((r) => r.key === key);
    document.getElementById('viewTitle').textContent = route.label;
    document.getElementById('viewSubtitle').textContent = route.subtitle;
    document.title = `${route.label} · AgroGestión`;
    highlightNav(key);
    closeMobileSidebar();
    const root = document.getElementById('viewRoot');
    root.classList.remove('fade-in');
    void root.offsetWidth;
    root.classList.add('fade-in');
    VIEW_RENDERERS[key](root);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function refreshCurrentView() {
    const root = document.getElementById('viewRoot');
    VIEW_RENDERERS[state.route](root);
    updateNavCounts();
  }

  function renderSidebarNav() {
    const nav = document.getElementById('sidebarNav');
    let lastGroup = null;
    nav.innerHTML = ROUTES.map((r) => {
      const groupHeader = r.group !== lastGroup && r.group
        ? `<span class="nav-group-label">${r.group}</span>`
        : '';
      lastGroup = r.group;
      return `${groupHeader}
      <button class="nav-item" data-route="${r.key}" type="button">
        ${UI.icon(r.icon, { size: 18 })}
        <span>${r.label}</span>
        <span class="nav-item__count" data-count="${r.key}"></span>
      </button>`;
    }).join('');
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (!btn) return;
      navigate(btn.dataset.route);
    });
    updateNavCounts();
  }

  function updateNavCounts() {
    const map = {
      lotes: DB.count('lotes'),
      cultivos: DB.count('cultivos'),
      siembras: DB.count('siembras'),
      fumigaciones: DB.count('fumigaciones'),
      cosechas: DB.count('cosechas'),
      notas: DB.getAll('notas').filter((n) => !n.completada).length,
      movimientos: DB.count('movimientosHacienda'),
      sanidad: DB.count('sanidadAnimal'),
      reproduccion: DB.count('reproduccion'),
      pesadas: DB.count('pesadas'),
    };
    Object.entries(map).forEach(([key, val]) => {
      const el = document.querySelector(`.nav-item__count[data-count="${key}"]`);
      if (el) el.textContent = val ? String(val) : '';
    });
  }

  function highlightNav(key) {
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('is-active', el.dataset.route === key));
  }

  /* ---------------- Chrome global ---------------- */

  function wireChrome() {
    document.getElementById('sidebarBurger').addEventListener('click', openMobileSidebar);
    document.getElementById('sidebarClose').addEventListener('click', closeMobileSidebar);
    document.getElementById('sidebarBackdrop').addEventListener('click', closeMobileSidebar);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('quickAddBtn').addEventListener('click', openQuickAddMenu);
    document.getElementById('signOutBtn').addEventListener('click', () => Auth.signOut());

    const searchInput = document.getElementById('globalSearch');
    searchInput.addEventListener('input', UI.debounce(handleGlobalSearch, 180));
    searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) handleGlobalSearch(); });
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSearchResults(); searchInput.blur(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.global-search-wrap')) closeSearchResults(); });

    window.addEventListener('scroll', () => {
      document.querySelector('.topbar').classList.toggle('is-scrolled', window.scrollY > 4);
    }, { passive: true });

    window.addEventListener('resize', UI.debounce(() => { if (mapInstance) mapInstance.invalidateSize(); }, 200));
  }

  function openMobileSidebar() {
    document.getElementById('sidebar').classList.add('is-open');
    document.getElementById('sidebarBackdrop').classList.add('is-visible');
  }
  function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('sidebarBackdrop').classList.remove('is-visible');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    DB.setSetting('theme', next);
  }

  /* ---------------- Alta rápida ---------------- */

  function openQuickAddMenu() {
    const items = [
      { key: 'lote', label: 'Nuevo lote', desc: 'Registrar una parcela', icon: 'layers' },
      { key: 'cultivo', label: 'Nuevo cultivo', desc: 'Agregar al catálogo', icon: 'leaf' },
      { key: 'siembra', label: 'Nueva siembra', desc: 'Registrar una siembra', icon: 'sprout' },
      { key: 'fumigacion', label: 'Nueva fumigación', desc: 'Registrar aplicación', icon: 'droplet' },
      { key: 'cosecha', label: 'Nueva cosecha', desc: 'Registrar resultado', icon: 'basket' },
      { key: 'nota', label: 'Nueva nota', desc: 'Seguimiento de lote', icon: 'note' },
    ];
    UI.openModal({
      title: 'Nuevo registro',
      subtitle: 'Elegí qué querés registrar',
      bodyHTML: `<div class="quick-menu">${items.map((i) => `
        <button type="button" class="quick-menu__item" data-quick="${i.key}">
          <span class="icon-wrap">${UI.icon(i.icon, { size: 18 })}</span>
          <span><strong>${i.label}</strong><span>${i.desc}</span></span>
        </button>`).join('')}</div>`,
      onMount: (root) => {
        root.querySelectorAll('[data-quick]').forEach((btn) => btn.addEventListener('click', () => {
          const key = btn.dataset.quick;
          UI.closeModal();
          setTimeout(() => openQuickCreate(key), 220);
        }));
      },
    });
  }

  function openQuickCreate(key) {
    const actions = {
      lote: ['lotes', openLoteForm],
      cultivo: ['cultivos', openCultivoForm],
      siembra: ['siembras', openSiembraForm],
      fumigacion: ['fumigaciones', openFumigacionForm],
      cosecha: ['cosechas', openCosechaForm],
      nota: ['notas', openNotaForm],
    };
    const [route, opener] = actions[key];
    navigate(route);
    setTimeout(() => opener(), 260);
  }

  /* ---------------- Búsqueda global ---------------- */

  function buildSearchIndex() {
    const lotes = DB.getAll('lotes').map((l) => ({ route: 'lotes', id: l.id, icon: 'layers', title: l.nombre, subtitle: l.ubicacion, text: `${l.nombre} ${l.ubicacion}`.toLowerCase() }));
    const cultivos = DB.getAll('cultivos').map((c) => ({ route: 'cultivos', id: c.id, icon: 'leaf', title: c.nombre, subtitle: c.tipo, text: `${c.nombre} ${c.tipo}`.toLowerCase() }));
    const notas = DB.getAll('notas').map((n) => ({ route: 'notas', id: n.id, icon: 'note', title: n.titulo, subtitle: loteName(n.loteId), text: `${n.titulo} ${n.descripcion}`.toLowerCase() }));
    const fumigaciones = DB.getAll('fumigaciones').map((f) => ({ route: 'fumigaciones', id: f.id, icon: 'droplet', title: f.producto, subtitle: `${loteName(f.loteId)} · ${f.aplicador}`, text: `${f.producto} ${f.aplicador} ${loteName(f.loteId)}`.toLowerCase() }));
    const siembras = DB.getAll('siembras').map((s) => ({ route: 'siembras', id: s.id, icon: 'sprout', title: `${cultivoName(s.cultivoId)} en ${loteName(s.loteId)}`, subtitle: UI.formatDate(s.fecha), text: `${cultivoName(s.cultivoId)} ${loteName(s.loteId)}`.toLowerCase() }));
    const cosechas = DB.getAll('cosechas').map((c) => ({ route: 'cosechas', id: c.id, icon: 'basket', title: `${cultivoName(c.cultivoId)} en ${loteName(c.loteId)}`, subtitle: UI.formatDate(c.fecha), text: `${cultivoName(c.cultivoId)} ${loteName(c.loteId)}`.toLowerCase() }));
    return [...lotes, ...cultivos, ...notas, ...fumigaciones, ...siembras, ...cosechas];
  }

  function handleGlobalSearch() {
    const input = document.getElementById('globalSearch');
    const q = input.value.trim().toLowerCase();
    const panel = document.getElementById('searchResults');
    if (!q) { closeSearchResults(); return; }
    const results = buildSearchIndex().filter((item) => item.text.includes(q)).slice(0, 8);
    if (!results.length) {
      panel.innerHTML = `<div class="search-results__empty">Sin resultados para “${UI.escapeHTML(q)}”</div>`;
    } else {
      panel.innerHTML = results.map((r) => `
        <button type="button" class="search-results__item" data-route="${r.route}" data-id="${r.id}">
          <span class="search-results__icon">${UI.icon(r.icon, { size: 15 })}</span>
          <span class="search-results__body"><strong>${UI.escapeHTML(r.title)}</strong><span>${UI.escapeHTML(r.subtitle)}</span></span>
        </button>`).join('');
      panel.querySelectorAll('[data-route]').forEach((btn) => btn.addEventListener('click', () => {
        const { route, id } = btn.dataset;
        closeSearchResults();
        input.value = '';
        navigate(route);
        setTimeout(() => flashRow(id), 300);
      }));
    }
    panel.classList.add('is-open');
  }

  function closeSearchResults() {
    const panel = document.getElementById('searchResults');
    if (panel) panel.classList.remove('is-open');
  }

  function flashRow(id) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1600);
  }

  /* ---------------- Ayudas compartidas ---------------- */

  function loteName(id) { const l = DB.getById('lotes', id); return l ? l.nombre : '—'; }
  function cultivoName(id) { const c = DB.getById('cultivos', id); return c ? c.nombre : '—'; }
  function categoriaName(id) { const c = DB.getById('categoriasHacienda', id); return c ? c.nombre : '—'; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }

  function parseGoogleMapsUrl(text) {
    if (!text) return null;
    const t = text.trim();
    let m = t.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = t.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = t.match(/[?&](?:q|ll|query)=(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = t.match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    return null;
  }

  function isWithinArgentinaBBox(lat, lng) {
    return lat <= -21 && lat >= -56 && lng <= -53 && lng >= -74;
  }

  /* ---------------- Clima (Open-Meteo, sin API key) ---------------- */

  const weatherCache = {};

  function weatherKey(lat, lng) {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }

  function fetchWeather(lat, lng) {
    const key = weatherKey(lat, lng);
    if (weatherCache[key]) return weatherCache[key];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=5`;
    const promise = fetch(url)
      .then((res) => { if (!res.ok) throw new Error('weather-fetch-failed'); return res.json(); })
      .then((data) => data.daily.time.map((fecha, i) => ({
        fecha,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        lluviaProb: data.daily.precipitation_probability_max[i],
        code: data.daily.weathercode[i],
      })));
    weatherCache[key] = promise;
    promise.catch(() => { delete weatherCache[key]; });
    return promise;
  }

  function weatherCodeInfo(code) {
    if (code === 0) return { icon: 'sun', label: 'Despejado', tone: 'clear' };
    if (code === 1 || code === 2) return { icon: 'sunCloud', label: 'Parcialmente nublado', tone: 'clear' };
    if (code === 3) return { icon: 'cloud', label: 'Nublado', tone: 'cloud' };
    if (code === 45 || code === 48) return { icon: 'cloud', label: 'Niebla', tone: 'cloud' };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: 'cloudRain', label: 'Lluvia', tone: 'rain' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: 'cloudRain', label: 'Nieve', tone: 'rain' };
    if ([95, 96, 99].includes(code)) return { icon: 'storm', label: 'Tormenta', tone: 'storm' };
    return { icon: 'cloud', label: 'Variable', tone: 'cloud' };
  }

  function weekdayShort(iso) {
    const d = new Date(`${iso}T00:00:00`);
    return new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d).replace('.', '');
  }

  function weatherStripHTML(days) {
    return `<div class="weather-strip">${days.map((d) => {
      const info = weatherCodeInfo(d.code);
      return `
        <div class="weather-day">
          <span class="weather-day__label">${weekdayShort(d.fecha)}</span>
          <span class="weather-day__icon weather-day__icon--${info.tone}">${UI.icon(info.icon, { size: 18 })}</span>
          <span class="weather-day__temp">${Math.round(d.tempMax)}°<span class="weather-day__temp-min">/${Math.round(d.tempMin)}°</span></span>
          <span class="weather-day__rain">${UI.icon('cloudRain', { size: 10 })}${d.lluviaProb}%</span>
        </div>`;
    }).join('')}</div>`;
  }

  function weatherErrorHTML() {
    return `<div class="weather-error">${UI.icon('alert-circle', { size: 16 })}<span>No se pudo cargar el clima. Verificá tu conexión a internet.</span></div>`;
  }

  function weatherLoadingHTML() {
    return `<div class="weather-skeleton">${UI.icon('cloud', { size: 18, class: 'spin' })}<span>Cargando pronóstico…</span></div>`;
  }

  /* ---------------- Precios oficiales FOB (MAGyP) ---------------- */

  const HS_PREFIX_TO_CULTIVO = { '1201': 'Soja', '1005': 'Maíz', '1001': 'Trigo', '1206': 'Girasol' };
  let preciosOficialesPromise = null;

  function magypDateStr(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  function fetchJsonWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).then((res) => {
      if (!res.ok) throw new Error(`http-${res.status}`);
      return res.json();
    }).finally(() => clearTimeout(timer));
  }

  function fetchMagypForDate(fechaStr) {
    const direct = `https://www.magyp.gob.ar/sitio/areas/ss_mercados_agropecuarios/ws/ssma/precios_fob.php?Fecha=${fechaStr}`;
    return fetchJsonWithTimeout(direct, 6000).catch(() => {
      const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;
      return fetchJsonWithTimeout(proxied, 8000);
    });
  }

  function extractPreciosFromPosts(posts, fechaStr) {
    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();
    const result = {};
    Object.keys(HS_PREFIX_TO_CULTIVO).forEach((prefix) => {
      const candidatos = posts.filter((p) => p.posicion && p.posicion.startsWith(prefix));
      if (!candidatos.length) return;
      const spot = candidatos.find((p) => p.mesDesde === mesActual && p['añoDesde'] === anioActual) || candidatos[0];
      result[HS_PREFIX_TO_CULTIVO[prefix]] = { precioTon: spot.precio, fecha: fechaStr };
    });
    return result;
  }

  function fetchPreciosOficiales() {
    if (preciosOficialesPromise) return preciosOficialesPromise;
    const dias = [0, 1, 2, 3, 4].map((back) => {
      const d = new Date();
      d.setDate(d.getDate() - back);
      return magypDateStr(d);
    });
    preciosOficialesPromise = Promise.allSettled(dias.map((fechaStr) => fetchMagypForDate(fechaStr).then((json) => ({ fechaStr, json }))))
      .then((settled) => {
        for (const r of settled) {
          if (r.status === 'fulfilled' && r.value.json && Array.isArray(r.value.json.posts) && r.value.json.posts.length) {
            return extractPreciosFromPosts(r.value.json.posts, r.value.fechaStr);
          }
        }
        return null;
      });
    preciosOficialesPromise.catch(() => { preciosOficialesPromise = null; });
    return preciosOficialesPromise;
  }

  function syncPreciosOficialesToDB(precios) {
    const cultivos = DB.getAll('cultivos');
    Object.keys(precios).forEach((nombre) => {
      const cultivo = cultivos.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
      if (!cultivo) return;
      DB.upsertPrecio(cultivo.id, { precioTon: precios[nombre].precioTon, moneda: 'USD', actualizado: isoFromDDMMYYYY(precios[nombre].fecha), fuente: 'MAGyP-FOB' });
    });
  }

  function preciosHoyLoadingHTML() {
    return ['Soja', 'Maíz', 'Trigo', 'Girasol'].map((nombre) => `
      <div class="price-ticker">
        <span class="price-ticker__label">${nombre}</span>
        <span class="price-ticker__value price-ticker__value--loading">${UI.icon('dollar', { size: 16, class: 'spin' })}</span>
        <span class="price-ticker__source">Consultando fuente oficial…</span>
      </div>`).join('');
  }

  function preciosHoyGridHTML(preciosOficiales) {
    return ['Soja', 'Maíz', 'Trigo', 'Girasol'].map((nombre) => {
      const oficial = preciosOficiales && preciosOficiales[nombre];
      if (oficial) {
        return `<div class="price-ticker">
          <span class="price-ticker__label">${nombre}</span>
          <span class="price-ticker__value">US$ ${UI.formatNumber(oficial.precioTon, 0)}</span>
          <span class="price-ticker__source">${UI.badge('Oficial', 'success')}<span>FOB · ${UI.formatDate(isoFromDDMMYYYY(oficial.fecha))}</span></span>
        </div>`;
      }
      const cultivo = DB.getAll('cultivos').find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
      const manual = cultivo ? DB.getPrecioByCultivo(cultivo.id) : null;
      return `<div class="price-ticker">
        <span class="price-ticker__label">${nombre}</span>
        <span class="price-ticker__value">${manual ? `US$ ${UI.formatNumber(manual.precioTon, 0)}` : '—'}</span>
        <span class="price-ticker__source">${manual ? `${UI.badge('Manual', 'muted')}<span>${UI.formatDate(manual.actualizado)}</span>` : 'Sin precio cargado'}</span>
      </div>`;
    }).join('');
  }

  function isoFromDDMMYYYY(str) {
    const [dd, mm, yyyy] = str.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  function loadDashboardPreciosOficiales() {
    fetchPreciosOficiales().then((precios) => {
      if (precios) syncPreciosOficialesToDB(precios);
      const grid = document.getElementById('preciosHoyGrid');
      if (grid) grid.innerHTML = preciosHoyGridHTML(precios);
    }).catch(() => {
      const grid = document.getElementById('preciosHoyGrid');
      if (grid) grid.innerHTML = preciosHoyGridHTML(null);
    });
  }

  function enumOptions(values, selected) {
    return values.map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  }
  function selectOptionsPlain(items, selected) {
    return items.map((it) => `<option value="${it.id}" ${it.id === selected ? 'selected' : ''}>${UI.escapeHTML(it.nombre)}</option>`).join('');
  }
  function loteCultivoOptions(items, selected, placeholder) {
    return `<option value="">${placeholder}</option>${selectOptionsPlain(items, selected)}`;
  }
  function mutedNote(text) {
    return `<p class="text-muted" style="font-size:12.6px;padding:6px 2px">${text}</p>`;
  }

  function fieldGroup(form, name) {
    return form.querySelector(`[name="${name}"]`).closest('.form-group');
  }
  function setFieldError(form, name, message) {
    const group = fieldGroup(form, name);
    group.classList.add('has-error');
    const err = group.querySelector('.form-error');
    if (err) err.textContent = message;
  }
  function clearFieldErrorFor(form, name) {
    fieldGroup(form, name).classList.remove('has-error');
  }
  function validateRequired(form, name, message) {
    const input = form.querySelector(`[name="${name}"]`);
    const value = input.value.trim();
    if (!value) { setFieldError(form, name, message); return null; }
    clearFieldErrorFor(form, name);
    return value;
  }
  function validateNumber(form, name, { min = 0 } = {}) {
    const input = form.querySelector(`[name="${name}"]`);
    const raw = input.value.trim();
    if (!raw) { setFieldError(form, name, 'Este campo es obligatorio'); return null; }
    const num = Number(raw);
    if (Number.isNaN(num) || num < min) { setFieldError(form, name, `Ingresá un número válido (mínimo ${min})`); return null; }
    clearFieldErrorFor(form, name);
    return num;
  }

  function periodCount(items, dateKey, days) {
    const now = Date.now();
    const from = now - days * 86400000;
    const fromPrev = now - days * 2 * 86400000;
    const current = items.filter((i) => { const t = new Date(i[dateKey]).getTime(); return t <= now && t > from; }).length;
    const prev = items.filter((i) => { const t = new Date(i[dateKey]).getTime(); return t <= from && t > fromPrev; }).length;
    return { current, prev };
  }
  function trendMeta(current, prev) {
    if (prev === 0 && current === 0) return { dir: 'flat', text: 'sin cambios' };
    if (prev === 0) return { dir: 'up', text: `+${current} nuevo(s)` };
    const diff = current - prev;
    if (diff === 0) return { dir: 'flat', text: 'igual que antes' };
    const pct = Math.round((diff / prev) * 100);
    return { dir: diff > 0 ? 'up' : 'down', text: `${diff > 0 ? '+' : ''}${pct}% vs. anterior` };
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */

  function buildAlerts() {
    const alerts = [];
    const notasAlta = DB.getAll('notas').filter((n) => !n.completada && n.prioridad === 'Alta');
    notasAlta.slice(0, 3).forEach((n) => alerts.push({ tone: 'danger', icon: 'alert', title: n.titulo, desc: `Prioridad alta · ${loteName(n.loteId)}` }));

    const lotesProblema = DB.getAll('lotes').filter((l) => l.estado === 'Inactivo' || l.estado === 'En descanso');
    if (lotesProblema.length) alerts.push({ tone: 'warning', icon: 'layers', title: `${lotesProblema.length} lote(s) sin actividad`, desc: lotesProblema.map((l) => l.nombre).join(', ') });

    const insumosBajos = DB.getAll('insumos').filter(insumoIsLow);
    if (insumosBajos.length) alerts.push({ tone: 'warning', icon: 'package', title: `${insumosBajos.length} insumo(s) con stock bajo`, desc: insumosBajos.map((i) => i.nombre).join(', ') });

    const now = Date.now();
    const in7 = now + 7 * 86400000;
    const fumigProx = DB.getAll('fumigaciones').filter((f) => { const t = new Date(f.fecha).getTime(); return t > now && t <= in7; });
    if (fumigProx.length) alerts.push({ tone: 'info', icon: 'droplet', title: `${fumigProx.length} fumigación(es) programada(s)`, desc: 'En los próximos 7 días' });

    const siembraProx = DB.getAll('siembras').filter((s) => { const t = new Date(s.fecha).getTime(); return t > now && t <= in7; });
    if (siembraProx.length) alerts.push({ tone: 'info', icon: 'sprout', title: `${siembraProx.length} siembra(s) programada(s)`, desc: 'En los próximos 7 días' });

    return alerts.slice(0, 5);
  }

  function buildActivityFeed(limit) {
    const items = [];
    DB.getAll('siembras').forEach((s) => items.push({ fecha: s.fecha, color: 'var(--primary-500)', text: `Siembra de <b>${UI.escapeHTML(cultivoName(s.cultivoId))}</b> en ${UI.escapeHTML(loteName(s.loteId))}` }));
    DB.getAll('fumigaciones').forEach((f) => items.push({ fecha: f.fecha, color: 'var(--accent-blue)', text: `Fumigación con <b>${UI.escapeHTML(f.producto)}</b> en ${UI.escapeHTML(loteName(f.loteId))}` }));
    DB.getAll('cosechas').forEach((c) => items.push({ fecha: c.fecha, color: 'var(--warning)', text: `Cosecha de <b>${UI.escapeHTML(cultivoName(c.cultivoId))}</b> en ${UI.escapeHTML(loteName(c.loteId))}` }));
    DB.getAll('notas').forEach((n) => items.push({ fecha: n.fecha, color: 'var(--text-muted)', text: `Nota registrada: <b>${UI.escapeHTML(n.titulo)}</b>` }));
    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, limit);
  }

  function statCardHTML(s) {
    return `
      <div class="stat-card">
        <div class="stat-card__top">
          <span class="stat-card__icon stat-card__icon--${s.tone}">${UI.icon(s.icon, { size: 18 })}</span>
          ${s.trend ? `<span class="stat-card__trend stat-card__trend--${s.trend.dir}">${UI.icon(s.trend.dir === 'up' ? 'upRight' : s.trend.dir === 'down' ? 'downRight' : 'trending', { size: 11 })}${s.trend.text}</span>` : ''}
        </div>
        <div class="stat-card__value">${UI.formatNumber(s.value)}</div>
        <div class="stat-card__label">${s.label}</div>
        <div class="stat-card__sub">${s.sub}</div>
      </div>`;
  }

  function barRowHTML(label, value, max) {
    const pct = Math.max(4, Math.round((value / max) * 100));
    return `<div class="bar-row"><span class="bar-row__label">${UI.escapeHTML(label)}</span><span class="bar-row__track"><span class="bar-row__fill" style="width:${pct}%"></span></span><span class="bar-row__value">${UI.formatNumber(value, 1)}</span></div>`;
  }

  function activityItemHTML(a) {
    return `<div class="activity-item"><span class="activity-item__dot" style="background:${a.color}"></span><div class="activity-item__body"><p>${a.text}</p><span>${UI.formatDate(a.fecha)} · ${UI.timeAgo(a.fecha)}</span></div></div>`;
  }

  function alertItemHTML(a) {
    return `<div class="alert-item alert-item--${a.tone}"><span class="alert-item__icon">${UI.icon(a.icon, { size: 15 })}</span><div class="alert-item__body"><strong>${UI.escapeHTML(a.title)}</strong><span>${UI.escapeHTML(a.desc)}</span></div></div>`;
  }

  function renderDashboard(root) {
    const lotes = DB.getAll('lotes');
    const siembras = DB.getAll('siembras');
    const fumigaciones = DB.getAll('fumigaciones');
    const cosechas = DB.getAll('cosechas');
    const notas = DB.getAll('notas');

    const lotesActivos = lotes.filter((l) => l.estado === 'Activo').length;
    const cosechaSiembraIds = new Set(cosechas.map((c) => c.siembraId).filter(Boolean));
    const siembrasActivas = siembras.filter((s) => !cosechaSiembraIds.has(s.id)).length;
    const notasPendientes = notas.filter((n) => !n.completada).length;
    const notasAltaPendientes = notas.filter((n) => !n.completada && n.prioridad === 'Alta').length;

    const fumig30 = periodCount(fumigaciones, 'fecha', 30);
    const cosecha90 = periodCount(cosechas, 'fecha', 90);
    const totalCosechado = cosechas.reduce((sum, c) => sum + Number(c.produccionReal || 0), 0);

    const valorTotal = siembras.filter((s) => !cosechaSiembraIds.has(s.id)).reduce((sum, s) => {
      const precio = DB.getPrecioByCultivo(s.cultivoId);
      return sum + (precio ? Number(s.produccionEstimada || 0) * precio.precioTon : 0);
    }, 0) + cosechas.reduce((sum, c) => {
      const precio = DB.getPrecioByCultivo(c.cultivoId);
      return sum + (precio ? Number(c.produccionReal || 0) * precio.precioTon : 0);
    }, 0);

    const statCards = [
      { icon: 'layers', tone: 'green', label: 'Lotes registrados', value: lotes.length, sub: `${lotesActivos} activos`, trend: null },
      { icon: 'sprout', tone: 'blue', label: 'Siembras activas', value: siembrasActivas, sub: `${siembras.length} en total`, trend: null },
      { icon: 'droplet', tone: 'amber', label: 'Fumigaciones', value: fumigaciones.length, sub: 'Últimos 30 días', trend: trendMeta(fumig30.current, fumig30.prev) },
      { icon: 'basket', tone: 'sand', label: 'Cosechas realizadas', value: cosechas.length, sub: `${UI.formatNumber(totalCosechado, 1)} ton. acumuladas`, trend: trendMeta(cosecha90.current, cosecha90.prev) },
      { icon: 'note', tone: notasAltaPendientes ? 'amber' : 'green', label: 'Notas pendientes', value: notasPendientes, sub: notasAltaPendientes ? `${notasAltaPendientes} de prioridad alta` : 'Sin urgencias', trend: null },
    ];

    const supPorLote = lotes
      .map((l) => ({ label: l.nombre, value: siembras.filter((s) => s.loteId === l.id).reduce((sum, s) => sum + Number(s.superficieSembrada || 0), 0) }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const maxSup = Math.max(1, ...supPorLote.map((x) => x.value));

    const alerts = buildAlerts();
    const activity = buildActivityFeed(6);
    const cultivoCounts = DB.getAll('cultivos').map((c) => ({ nombre: c.nombre, count: siembras.filter((s) => s.cultivoId === c.id).length })).sort((a, b) => b.count - a.count);
    const estadoCounts = DB.ENUMS.estadosLote.map((e) => ({ estado: e, count: lotes.filter((l) => l.estado === e).length }));

    root.innerHTML = `
      <div class="stat-grid">${statCards.map(statCardHTML).join('')}</div>
      <div class="value-banner">
        <div class="value-banner__icon">${UI.icon('dollar', { size: 22 })}</div>
        <div class="value-banner__body">
          <span class="value-banner__label">Valor estimado total de la producción</span>
          <strong class="value-banner__value">US$ ${UI.formatNumber(valorTotal, 0)}</strong>
          <span class="value-banner__sub">Siembras activas en pie + cosechas registradas, según tus precios de referencia</span>
        </div>
        <a href="#/precios" class="btn btn--secondary btn--sm value-banner__link">${UI.icon('edit', { size: 12 })}<span>Actualizar precios</span></a>
      </div>
      <div class="panel price-panel">
        <div class="panel__header"><div><h3>Precios del mercado hoy</h3><p>Cotización FOB oficial — Ministerio de Agricultura, Ganadería y Pesca</p></div></div>
        <div class="price-ticker-grid" id="preciosHoyGrid">${preciosHoyLoadingHTML()}</div>
      </div>
      <div class="dash-grid">
        <div class="dash-col">
          <div class="panel">
            <div class="panel__header"><div><h3>Superficie sembrada por lote</h3><p>Hectáreas acumuladas en siembras registradas</p></div></div>
            ${supPorLote.length ? supPorLote.map((x) => barRowHTML(x.label, x.value, maxSup)).join('') : mutedNote('Todavía no hay siembras registradas.')}
          </div>
          <div class="panel">
            <div class="panel__header"><div><h3>Actividad reciente</h3><p>Últimos movimientos registrados en el sistema</p></div></div>
            ${activity.length ? `<div class="activity-list">${activity.map(activityItemHTML).join('')}</div>` : mutedNote('Sin actividad registrada todavía.')}
          </div>
        </div>
        <div class="dash-col">
          <div class="panel">
            <div class="panel__header"><div><h3>Alertas del sistema</h3><p>Puntos que requieren atención</p></div></div>
            <div id="dashAlertsBody">${alerts.length ? `<div class="alert-list">${alerts.map(alertItemHTML).join('')}</div>` : mutedNote('Todo en orden. No hay alertas pendientes.')}</div>
          </div>
          <div class="panel">
            <div class="panel__header"><div><h3>Siembras por cultivo</h3></div></div>
            ${cultivoCounts.length ? `<div class="mini-list">${cultivoCounts.map((c) => `<div class="mini-list__row"><span>${UI.escapeHTML(c.nombre)}</span><b>${c.count}</b></div>`).join('')}</div>` : mutedNote('Sin cultivos registrados.')}
          </div>
          <div class="panel">
            <div class="panel__header"><div><h3>Estado de los lotes</h3></div></div>
            <div class="mini-list">${estadoCounts.map((e) => `<div class="mini-list__row"><span>${UI.badge(e.estado, UI.ESTADO_VARIANT[e.estado])}</span><b>${e.count}</b></div>`).join('')}</div>
          </div>
        </div>
      </div>`;

    loadDashboardWeatherAlert();
    loadDashboardPreciosOficiales();
  }

  function loadDashboardWeatherAlert() {
    const lotesConCoord = DB.getAll('lotes').filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng));
    if (!lotesConCoord.length) return;
    const uniqueLocs = [];
    const seen = new Set();
    lotesConCoord.forEach((l) => {
      const key = `${l.lat.toFixed(1)},${l.lng.toFixed(1)}`;
      if (!seen.has(key)) { seen.add(key); uniqueLocs.push(l); }
    });
    Promise.all(uniqueLocs.slice(0, 5).map((l) => fetchWeather(l.lat, l.lng).then((days) => ({ lote: l, days })).catch(() => null)))
      .then((results) => {
        const body = document.getElementById('dashAlertsBody');
        if (!body) return;
        const rainy = results.filter((r) => r && r.days.slice(0, 2).some((d) => d.lluviaProb >= 60));
        if (!rainy.length) return;
        let list = body.querySelector('.alert-list');
        if (!list) {
          body.innerHTML = '<div class="alert-list"></div>';
          list = body.querySelector('.alert-list');
        }
        rainy.slice(0, 2).forEach((r) => {
          const soonDay = r.days.slice(0, 2).find((d) => d.lluviaProb >= 60);
          const el = document.createElement('div');
          el.className = 'alert-item alert-item--info';
          el.innerHTML = `<span class="alert-item__icon">${UI.icon('cloudRain', { size: 15 })}</span><div class="alert-item__body"><strong>Lluvia probable en ${UI.escapeHTML(r.lote.nombre)}</strong><span>${soonDay.lluviaProb}% de probabilidad ${weekdayShort(soonDay.fecha)} — replanificá fumigaciones</span></div>`;
          list.prepend(el);
        });
      });
  }

  /* ============================================================
     LOTES
     ============================================================ */

  function renderLotes(root) {
    const f = state.filters.lotes;
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Lotes</h2><p>${DB.count('lotes')} lote(s) registrados en el sistema</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addLoteBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo lote</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="loteSearch" placeholder="Buscar por nombre o ubicación…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="loteEstadoFilter"><option value="">Todos los estados</option>${enumOptions(DB.ENUMS.estadosLote, f.estado)}</select>
        <button class="toolbar__reset" id="loteResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="loteResultCount"></span>
      </div>
      <div id="loteResults"></div>`;

    document.getElementById('addLoteBtn').addEventListener('click', () => openLoteForm());
    document.getElementById('loteSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderLoteResults(); }, 180));
    document.getElementById('loteEstadoFilter').addEventListener('change', (e) => { f.estado = e.target.value; renderLoteResults(); });
    document.getElementById('loteResetBtn').addEventListener('click', () => { f.search = ''; f.estado = ''; renderLotes(root); });
    renderLoteResults();
  }

  function getFilteredLotes() {
    const f = state.filters.lotes;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('lotes')
      .filter((l) => !f.estado || l.estado === f.estado)
      .filter((l) => !q || `${l.nombre} ${l.ubicacion}`.toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  function renderLoteResults() {
    const wrap = document.getElementById('loteResults');
    const list = getFilteredLotes();
    document.getElementById('loteResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'layers',
        title: DB.count('lotes') ? 'Sin coincidencias' : 'Todavía no hay lotes',
        message: DB.count('lotes') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá tu primer lote para empezar a organizar la operación.',
        actionLabel: DB.count('lotes') ? '' : 'Nuevo lote',
        actionAttr: 'id="emptyAddLote"',
      });
      const emptyBtn = document.getElementById('emptyAddLote');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openLoteForm());
      return;
    }
    wrap.innerHTML = `<div class="card-grid">${list.map(loteCardHTML).join('')}</div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openLoteForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteLote(btn.dataset.delete)));
    wrap.querySelectorAll('[data-map]').forEach((btn) => btn.addEventListener('click', () => {
      const id = btn.dataset.map;
      navigate('mapa');
      setTimeout(() => focusLoteOnMap(id), 300);
    }));
    wrap.querySelectorAll('[data-ficha]').forEach((el) => {
      el.addEventListener('click', () => openLoteFicha(el.dataset.ficha));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLoteFicha(el.dataset.ficha); } });
    });
  }

  function loteCardHTML(l) {
    const deps = DB.dependentsOfLote(l.id);
    const activeSiembra = activeSiembraForLote(l.id);
    return `
      <article class="record-card" data-id="${l.id}">
        <div class="record-card__head">
          <div>
            <h4 class="record-card__title" data-ficha="${l.id}" role="button" tabindex="0">${UI.escapeHTML(l.nombre)}</h4>
            <div class="record-card__meta">${UI.icon('pin', { size: 12 })}<span>${UI.escapeHTML(l.ubicacion)}</span></div>
          </div>
          ${UI.badge(l.estado, UI.ESTADO_VARIANT[l.estado] || 'neutral')}
        </div>
        <button type="button" class="record-card__crop${activeSiembra ? '' : ' record-card__crop--empty'}" data-ficha="${l.id}">
          ${UI.icon(activeSiembra ? 'sprout' : 'inbox', { size: 13 })}
          <span>${activeSiembra ? `<b>${UI.escapeHTML(cultivoName(activeSiembra.cultivoId))}</b> · sembrado hace ${daysSince(activeSiembra.fecha)} día(s)` : 'Lote libre, sin siembra activa'}</span>
        </button>
        <div class="record-card__stats">
          <div class="record-card__stat"><span>Superficie</span><b>${UI.formatNumber(l.tamano, 1)} ha</b></div>
          <div class="record-card__stat"><span>Siembras</span><b>${deps.siembras}</b></div>
          <div class="record-card__stat"><span>Notas</span><b>${deps.notas}</b></div>
        </div>
        ${l.observaciones ? `<p class="record-card__note">${UI.escapeHTML(l.observaciones)}</p>` : ''}
        <div class="record-card__foot">
          <span class="text-muted" style="font-size:11.5px">${deps.fumigaciones} fumigación(es) · ${deps.cosechas} cosecha(s)</span>
          <div class="record-card__actions">
            <button class="icon-btn" data-ficha="${l.id}" type="button" aria-label="Ver ficha completa">${UI.icon('eye', { size: 15 })}</button>
            ${Number.isFinite(l.lat) && Number.isFinite(l.lng) ? `<button class="icon-btn" data-map="${l.id}" type="button" aria-label="Ver en mapa">${UI.icon('map', { size: 15 })}</button>` : ''}
            <button class="icon-btn" data-edit="${l.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
            <button class="icon-btn icon-btn--danger" data-delete="${l.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
          </div>
        </div>
      </article>`;
  }

  function openLoteForm(id) {
    const editing = id ? DB.getById('lotes', id) : null;
    UI.openModal({
      title: editing ? 'Editar lote' : 'Nuevo lote',
      subtitle: editing ? editing.nombre : 'Completá los datos de la parcela',
      bodyHTML: `
        <form id="loteForm" class="form-grid" novalidate>
          <div class="form-group form-group--full">
            <label for="f-nombre">Nombre del lote <span class="req">*</span></label>
            <input class="form-control" id="f-nombre" name="nombre" placeholder="Ej: Lote Norte" value="${editing ? UI.escapeHTML(editing.nombre) : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="f-tamano">Tamaño (hectáreas) <span class="req">*</span></label>
            <input class="form-control" id="f-tamano" name="tamano" type="number" min="0.1" step="0.1" placeholder="0.0" value="${editing ? editing.tamano : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="f-estado">Estado <span class="req">*</span></label>
            <select class="form-control" id="f-estado" name="estado">
              <option value="">Seleccionar…</option>
              ${enumOptions(DB.ENUMS.estadosLote, editing ? editing.estado : '')}
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group form-group--full">
            <label for="f-ubicacion">Ubicación <span class="req">*</span></label>
            <input class="form-control" id="f-ubicacion" name="ubicacion" placeholder="Ej: Sector Norte, camino rural 12" value="${editing ? UI.escapeHTML(editing.ubicacion) : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group form-group--full">
            <label for="f-observaciones">Observaciones</label>
            <textarea class="form-control" id="f-observaciones" name="observaciones" placeholder="Notas adicionales sobre el lote (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea>
          </div>
          <div class="form-group form-group--full">
            <label for="f-mapsurl">Ubicación en el mapa <span style="font-weight:400;color:var(--text-muted)">(opcional)</span></label>
            <input class="form-control" id="f-mapsurl" name="mapsUrl" placeholder="Pegá un enlace de Google Maps, ej: https://maps.google.com/@-33.88,-60.57,15z">
            <span class="form-hint" id="f-mapsurl-hint">Pegá un enlace de Google Maps para completar la latitud y longitud automáticamente, o ingresalas manualmente abajo.</span>
          </div>
          <div class="form-group">
            <label for="f-lat">Latitud</label>
            <input class="form-control" id="f-lat" name="lat" type="number" step="0.000001" placeholder="-33.880000" value="${editing && editing.lat !== null && editing.lat !== undefined ? editing.lat : ''}">
          </div>
          <div class="form-group">
            <label for="f-lng">Longitud</label>
            <input class="form-control" id="f-lng" name="lng" type="number" step="0.000001" placeholder="-60.575000" value="${editing && editing.lng !== null && editing.lng !== undefined ? editing.lng : ''}">
          </div>
          <div class="form-group form-group--full" id="f-maps-preview-wrap" style="display:none">
            <a class="form-hint" id="f-maps-preview-link" href="#" target="_blank" rel="noopener">${UI.icon('upRight', { size: 11 })} Ver ubicación en Google Maps</a>
          </div>
        </form>`,
      footerHTML: `
        <button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button>
        <button class="btn btn--primary" type="submit" form="loteForm">${editing ? 'Guardar cambios' : 'Crear lote'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#loteForm').addEventListener('submit', (e) => { e.preventDefault(); submitLoteForm(e.target, editing); });

        const mapsUrlInput = mroot.querySelector('#f-mapsurl');
        const latInput = mroot.querySelector('#f-lat');
        const lngInput = mroot.querySelector('#f-lng');
        const previewWrap = mroot.querySelector('#f-maps-preview-wrap');
        const previewLink = mroot.querySelector('#f-maps-preview-link');
        const hint = mroot.querySelector('#f-mapsurl-hint');

        function updatePreviewLink() {
          const lat = parseFloat(latInput.value);
          const lng = parseFloat(lngInput.value);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            previewLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
            previewWrap.style.display = '';
          } else {
            previewWrap.style.display = 'none';
          }
        }
        updatePreviewLink();
        [latInput, lngInput].forEach((inp) => inp.addEventListener('input', updatePreviewLink));

        mapsUrlInput.addEventListener('change', () => {
          const parsed = parseGoogleMapsUrl(mapsUrlInput.value);
          if (parsed) {
            latInput.value = parsed.lat;
            lngInput.value = parsed.lng;
            updatePreviewLink();
            hint.style.color = 'var(--success)';
            hint.textContent = isWithinArgentinaBBox(parsed.lat, parsed.lng)
              ? 'Coordenadas detectadas correctamente.'
              : 'Coordenadas detectadas (parecen estar fuera de Argentina, verificalas).';
          } else if (mapsUrlInput.value.trim()) {
            hint.style.color = 'var(--danger)';
            hint.textContent = 'No pudimos detectar coordenadas en ese enlace. Ingresá la latitud y longitud manualmente.';
          } else {
            hint.style.color = '';
            hint.textContent = 'Pegá un enlace de Google Maps para completar la latitud y longitud automáticamente, o ingresalas manualmente abajo.';
          }
        });
      },
    });
  }

  function submitLoteForm(form, editing) {
    const nombre = validateRequired(form, 'nombre', 'Ingresá el nombre del lote');
    const tamano = validateNumber(form, 'tamano', { min: 0.1 });
    const ubicacion = validateRequired(form, 'ubicacion', 'Ingresá la ubicación');
    const estado = validateRequired(form, 'estado', 'Seleccioná un estado');
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    const latRaw = form.querySelector('[name="lat"]').value.trim();
    const lngRaw = form.querySelector('[name="lng"]').value.trim();
    const lat = latRaw ? Number(latRaw) : null;
    const lng = lngRaw ? Number(lngRaw) : null;
    if (!nombre || tamano === null || !ubicacion || !estado) return;
    if ((lat === null) !== (lng === null)) {
      UI.toast('Completá tanto la latitud como la longitud, o dejá ambas vacías.', 'error', 'Coordenadas incompletas');
      return;
    }
    const payload = { nombre, tamano, ubicacion, estado, observaciones, lat, lng };
    if (editing) {
      DB.update('lotes', editing.id, payload);
      UI.toast(`"${nombre}" se actualizó correctamente.`, 'success', 'Lote actualizado');
    } else {
      DB.create('lotes', 'lot', payload);
      UI.toast(`"${nombre}" se agregó al sistema.`, 'success', 'Lote creado');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteLote(id) {
    const lote = DB.getById('lotes', id);
    if (!lote) return;
    const deps = DB.dependentsOfLote(id);
    const total = deps.siembras + deps.fumigaciones + deps.cosechas + deps.notas;
    const message = total > 0
      ? `Se eliminará <strong>${UI.escapeHTML(lote.nombre)}</strong> junto con ${total} registro(s) asociado(s) (siembras, fumigaciones, cosechas y notas). Esta acción no se puede deshacer.`
      : `Se eliminará <strong>${UI.escapeHTML(lote.nombre)}</strong> del sistema. Esta acción no se puede deshacer.`;
    const ok = await UI.confirmDialog({ title: 'Eliminar lote', message, confirmLabel: 'Eliminar lote', tone: 'danger' });
    if (!ok) return;
    DB.getAll('siembras').filter((s) => s.loteId === id).forEach((s) => DB.remove('siembras', s.id));
    DB.getAll('fumigaciones').filter((x) => x.loteId === id).forEach((x) => DB.remove('fumigaciones', x.id));
    DB.getAll('cosechas').filter((c) => c.loteId === id).forEach((c) => DB.remove('cosechas', c.id));
    DB.getAll('notas').filter((n) => n.loteId === id).forEach((n) => DB.remove('notas', n.id));
    DB.remove('lotes', id);
    UI.toast(`"${lote.nombre}" fue eliminado.`, 'success', 'Lote eliminado');
    refreshCurrentView();
  }

  function daysSince(iso) {
    const d = new Date(`${iso}T00:00:00`).getTime();
    return Math.max(0, Math.round((Date.now() - d) / 86400000));
  }

  function activeSiembraForLote(loteId) {
    const cosechaSiembraIds = new Set(DB.getAll('cosechas').map((c) => c.siembraId).filter(Boolean));
    const candidatas = DB.getAll('siembras').filter((s) => s.loteId === loteId && !cosechaSiembraIds.has(s.id));
    if (!candidatas.length) return null;
    return candidatas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
  }

  function buildLoteTimeline(loteId) {
    const items = [];
    DB.getAll('siembras').filter((s) => s.loteId === loteId).forEach((s) => {
      const hasCosecha = DB.getAll('cosechas').some((c) => c.siembraId === s.id);
      items.push({
        fecha: s.fecha, icon: 'sprout', color: 'var(--primary-500)',
        title: `Siembra de ${cultivoName(s.cultivoId)}`,
        desc: `${UI.formatNumber(s.superficieSembrada, 1)} ha · destino: ${s.destino}${hasCosecha ? '' : ' · en curso'}`,
        onEdit: () => openSiembraForm(s.id),
      });
    });
    DB.getAll('fumigaciones').filter((f) => f.loteId === loteId).forEach((f) => {
      items.push({
        fecha: f.fecha, icon: 'droplet', color: 'var(--accent-blue)',
        title: `Fumigación: ${f.producto}`,
        desc: `${f.dosis} · ${f.motivo}`,
        onEdit: () => openFumigacionForm(f.id),
      });
    });
    DB.getAll('cosechas').filter((c) => c.loteId === loteId).forEach((c) => {
      const siembra = c.siembraId ? DB.getById('siembras', c.siembraId) : null;
      const rendPct = (siembra && siembra.produccionEstimada) ? Math.round((c.produccionReal / siembra.produccionEstimada) * 100) : null;
      items.push({
        fecha: c.fecha, icon: 'basket', color: 'var(--warning)',
        title: `Cosecha de ${cultivoName(c.cultivoId)}`,
        desc: `${UI.formatNumber(c.produccionReal, 1)} ton${rendPct !== null ? ` · ${rendPct}% del estimado` : ''}`,
        onEdit: () => openCosechaForm(c.id),
      });
    });
    DB.getAll('notas').filter((n) => n.loteId === loteId).forEach((n) => {
      items.push({
        fecha: n.fecha, icon: 'note', color: n.completada ? 'var(--text-muted)' : 'var(--danger)',
        title: n.titulo,
        desc: n.completada ? 'Nota completada' : `Prioridad ${n.prioridad}`,
        onEdit: () => openNotaForm(n.id),
      });
    });
    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function timelineItemHTML(item, idx) {
    return `
      <div class="ficha-timeline__item">
        <span class="ficha-timeline__dot" style="background:${item.color}">${UI.icon(item.icon, { size: 12 })}</span>
        <div class="ficha-timeline__body">
          <div class="ficha-timeline__row"><strong>${UI.escapeHTML(item.title)}</strong><span class="ficha-timeline__date">${UI.formatDate(item.fecha)}</span></div>
          <p>${UI.escapeHTML(item.desc)}</p>
        </div>
        <button type="button" class="icon-btn ficha-timeline__edit" data-timeline-edit="${idx}" aria-label="Editar">${UI.icon('edit', { size: 13 })}</button>
      </div>`;
  }

  function openLoteFicha(id) {
    const lote = DB.getById('lotes', id);
    if (!lote) return;
    const activeSiembra = activeSiembraForLote(id);
    const timeline = buildLoteTimeline(id);
    const deps = DB.dependentsOfLote(id);
    const hasCoords = Number.isFinite(lote.lat) && Number.isFinite(lote.lng);

    const cultivoActualHTML = activeSiembra ? `
      <div class="ficha-active-crop">
        <div class="ficha-active-crop__icon">${UI.icon('sprout', { size: 20 })}</div>
        <div class="ficha-active-crop__body">
          <span class="ficha-active-crop__label">Cultivo actual</span>
          <strong>${UI.escapeHTML(cultivoName(activeSiembra.cultivoId))}</strong>
          <span class="ficha-active-crop__meta">Sembrado el ${UI.formatDate(activeSiembra.fecha)} · hace ${daysSince(activeSiembra.fecha)} día(s) · destino: ${activeSiembra.destino}</span>
        </div>
        <button type="button" class="btn btn--ghost btn--sm" data-goto-siembra="${activeSiembra.id}">${UI.icon('edit', { size: 13 })}<span>Ver siembra</span></button>
      </div>` : `
      <div class="ficha-active-crop ficha-active-crop--empty">
        <div class="ficha-active-crop__icon">${UI.icon('inbox', { size: 20 })}</div>
        <div class="ficha-active-crop__body">
          <span class="ficha-active-crop__label">Cultivo actual</span>
          <strong>Lote libre, sin siembra activa</strong>
          <span class="ficha-active-crop__meta">Registrá una siembra para empezar a hacer seguimiento de este lote.</span>
        </div>
        <button type="button" class="btn btn--primary btn--sm" data-new-siembra>${UI.icon('plus', { size: 13 })}<span>Nueva siembra</span></button>
      </div>`;

    const weatherHTML = hasCoords ? `
      <div class="ficha-weather">
        <h3>${UI.icon('cloud', { size: 14 })}<span>Clima en el lote</span></h3>
        <div id="fichaWeatherBody">${weatherLoadingHTML()}</div>
      </div>` : '';

    const timelineHTML = timeline.length
      ? `<div class="ficha-timeline">${timeline.map(timelineItemHTML).join('')}</div>`
      : mutedNote('Todavía no hay actividad registrada en este lote.');

    UI.openModal({
      title: lote.nombre,
      subtitle: `${lote.ubicacion} · ${UI.formatNumber(lote.tamano, 1)} ha`,
      size: 'lg',
      bodyHTML: `
        <div class="ficha">
          <div class="ficha__top">
            ${UI.badge(lote.estado, UI.ESTADO_VARIANT[lote.estado] || 'neutral')}
            <div class="ficha__stats">
              <span>${deps.siembras} siembra(s)</span>
              <span>${deps.fumigaciones} fumigación(es)</span>
              <span>${deps.cosechas} cosecha(s)</span>
              <span>${deps.notas} nota(s)</span>
            </div>
          </div>
          ${cultivoActualHTML}
          ${lote.observaciones ? `<p class="record-card__note" style="margin:14px 0 0">${UI.escapeHTML(lote.observaciones)}</p>` : ''}
          ${weatherHTML}
          <h3 class="ficha__timeline-title">Historial completo</h3>
          ${timelineHTML}
        </div>`,
      footerHTML: `
        <button class="btn btn--ghost" type="button" data-act="cancel">Cerrar</button>
        ${hasCoords ? `<button class="btn btn--secondary" type="button" data-ficha-map>${UI.icon('map', { size: 14 })}<span>Ver en mapa</span></button>` : ''}
        <button class="btn btn--primary" type="button" data-ficha-edit>${UI.icon('edit', { size: 14 })}<span>Editar lote</span></button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('[data-ficha-edit]').addEventListener('click', () => { UI.closeModal(); setTimeout(() => openLoteForm(id), 200); });
        const mapBtn = mroot.querySelector('[data-ficha-map]');
        if (mapBtn) mapBtn.addEventListener('click', () => { UI.closeModal(); navigate('mapa'); setTimeout(() => focusLoteOnMap(id), 300); });
        const newSiembraBtn = mroot.querySelector('[data-new-siembra]');
        if (newSiembraBtn) newSiembraBtn.addEventListener('click', () => { UI.closeModal(); setTimeout(() => openSiembraForm(), 200); });
        const gotoSiembraBtn = mroot.querySelector('[data-goto-siembra]');
        if (gotoSiembraBtn) gotoSiembraBtn.addEventListener('click', () => { UI.closeModal(); setTimeout(() => openSiembraForm(gotoSiembraBtn.dataset.gotoSiembra), 200); });
        mroot.querySelectorAll('[data-timeline-edit]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.timelineEdit);
            UI.closeModal();
            setTimeout(() => timeline[idx].onEdit(), 200);
          });
        });
        if (hasCoords) {
          fetchWeather(lote.lat, lote.lng).then((days) => {
            const el = document.getElementById('fichaWeatherBody');
            if (el) el.innerHTML = weatherStripHTML(days.slice(0, 4));
          }).catch(() => {
            const el = document.getElementById('fichaWeatherBody');
            if (el) el.innerHTML = weatherErrorHTML();
          });
        }
      },
    });
  }

  /* ============================================================
     MAPA
     ============================================================ */

  function renderMapa(root) {
    const lotes = DB.getAll('lotes');
    const ubicados = lotes.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng));
    const sinUbicar = lotes.filter((l) => !(Number.isFinite(l.lat) && Number.isFinite(l.lng)));

    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Mapa de lotes</h2><p>${ubicados.length} de ${lotes.length} lote(s) ubicados en el mapa</p></div>
        <div class="view-header__actions">
          <button class="btn btn--secondary" id="mapFitArgentina" type="button">${UI.icon('map', { size: 14 })}<span>Toda Argentina</span></button>
          <button class="btn btn--primary" id="mapFitLotes" type="button" ${!ubicados.length ? 'disabled' : ''}>${UI.icon('pin', { size: 14 })}<span>Centrar en mis lotes</span></button>
        </div>
      </div>
      <div class="map-layout">
        <div class="map-container" id="lotesMap"></div>
        <aside class="map-sidebar">
          <div class="map-sidebar__section">
            <h3>Lotes ubicados <span class="map-sidebar__count">${ubicados.length}</span></h3>
            ${ubicados.length
              ? `<div class="map-list">${ubicados.map((l) => mapListItemHTML(l, true)).join('')}</div>`
              : `<p class="text-muted" style="font-size:12.4px;padding:4px 2px">Todavía no ubicaste ningún lote en el mapa. Editá un lote y pegá un enlace de Google Maps o sus coordenadas.</p>`}
          </div>
          ${sinUbicar.length ? `
          <div class="map-sidebar__section">
            <h3>Sin coordenadas <span class="map-sidebar__count map-sidebar__count--muted">${sinUbicar.length}</span></h3>
            <div class="map-list">${sinUbicar.map((l) => mapListItemHTML(l, false)).join('')}</div>
          </div>` : ''}
        </aside>
      </div>`;

    initLotesMap(ubicados);

    root.querySelectorAll('[data-focus]').forEach((btn) => btn.addEventListener('click', () => focusLoteOnMap(btn.dataset.focus)));
    root.querySelectorAll('[data-edit-from-map]').forEach((btn) => btn.addEventListener('click', () => openLoteForm(btn.dataset.editFromMap)));

    document.getElementById('mapFitArgentina').addEventListener('click', () => {
      if (mapInstance) mapInstance.setView(ARGENTINA_CENTER, 4);
    });
    const fitBtn = document.getElementById('mapFitLotes');
    if (fitBtn) fitBtn.addEventListener('click', () => fitMapToLotes(ubicados));
  }

  function mapListItemHTML(l, hasCoords) {
    const attr = hasCoords ? `data-focus="${l.id}"` : `data-edit-from-map="${l.id}"`;
    return `
      <button type="button" class="map-list__item" ${attr}>
        <span class="map-list__dot" style="background:${ESTADO_DOT_COLOR[l.estado] || 'var(--text-muted)'}"></span>
        <span class="map-list__body">
          <strong>${UI.escapeHTML(l.nombre)}</strong>
          <span>${UI.escapeHTML(l.ubicacion)}</span>
        </span>
        ${!hasCoords ? `<span class="map-list__hint">${UI.icon('edit', { size: 12 })}</span>` : ''}
      </button>`;
  }

  function buildPinIcon(estado) {
    const color = ESTADO_PIN_COLOR[estado] || '#2f8f52';
    const html = `<svg width="28" height="36" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0Z" fill="${color}" stroke="#12351f" stroke-width="1"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`;
    return L.divIcon({ html, className: 'agro-map-pin', iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -32] });
  }

  function mapPopupHTML(l) {
    const deps = DB.dependentsOfLote(l.id);
    return `
      <div class="map-popup">
        <div class="map-popup__head">
          <h4>${UI.escapeHTML(l.nombre)}</h4>
          ${UI.badge(l.estado, UI.ESTADO_VARIANT[l.estado] || 'neutral')}
        </div>
        <p class="map-popup__loc">${UI.icon('pin', { size: 12 })}<span>${UI.escapeHTML(l.ubicacion)}</span></p>
        <div class="map-popup__stats">
          <span>${UI.formatNumber(l.tamano, 1)} ha</span>
          <span>${deps.siembras} siembra(s)</span>
          <span>${deps.notas} nota(s)</span>
        </div>
        ${l.observaciones ? `<p class="map-popup__note">${UI.escapeHTML(l.observaciones)}</p>` : ''}
        <div class="map-popup__actions">
          <button type="button" data-popup-edit>${UI.icon('edit', { size: 12 })}<span>Editar lote</span></button>
          <a href="https://www.google.com/maps?q=${l.lat},${l.lng}" target="_blank" rel="noopener">${UI.icon('upRight', { size: 11 })}<span>Google Maps</span></a>
        </div>
      </div>`;
  }

  function initLotesMap(ubicados) {
    const container = document.getElementById('lotesMap');
    if (!container) return;
    if (mapInstance) { mapInstance.remove(); mapInstance = null; }
    mapMarkers = {};

    if (typeof L === 'undefined') {
      container.innerHTML = `<div class="map-offline">${UI.icon('alert-circle', { size: 24 })}<p>No se pudo cargar el mapa.</p><span>Verificá tu conexión a internet e intentá de nuevo.</span></div>`;
      return;
    }

    mapInstance = L.map(container, { scrollWheelZoom: true }).setView(ARGENTINA_CENTER, 4);

    mapInstance.createPane('streetPane');

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> — Source: Esri, Maxar, Earthstar Geographics',
    });
    const labelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Labels &copy; Esri',
    });
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      pane: 'streetPane',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    });
    satelliteLayer.addTo(mapInstance);
    labelsLayer.addTo(mapInstance);

    const LayerToggle = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const div = L.DomUtil.create('div', 'map-layer-toggle');
        div.innerHTML = `
          <button type="button" class="map-layer-toggle__btn is-active" data-layer="satellite">${UI.icon('map', { size: 13 })}<span>Satélite</span></button>
          <button type="button" class="map-layer-toggle__btn" data-layer="street">${UI.icon('grid', { size: 13 })}<span>Calles</span></button>`;
        L.DomEvent.disableClickPropagation(div);
        div.querySelectorAll('button').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (btn.classList.contains('is-active')) return;
            div.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            if (btn.dataset.layer === 'satellite') {
              mapInstance.removeLayer(streetLayer);
              satelliteLayer.addTo(mapInstance);
              labelsLayer.addTo(mapInstance);
            } else {
              mapInstance.removeLayer(satelliteLayer);
              mapInstance.removeLayer(labelsLayer);
              streetLayer.addTo(mapInstance);
            }
          });
        });
        return div;
      },
    });
    new LayerToggle().addTo(mapInstance);

    ubicados.forEach((l) => {
      const marker = L.marker([l.lat, l.lng], { icon: buildPinIcon(l.estado) }).addTo(mapInstance);
      marker.bindPopup(mapPopupHTML(l), { closeButton: true, className: 'agro-popup', minWidth: 230 });
      marker.on('popupopen', (e) => {
        const node = e.popup.getElement();
        const editBtn = node && node.querySelector('[data-popup-edit]');
        if (editBtn) editBtn.addEventListener('click', () => openLoteForm(l.id));
      });
      mapMarkers[l.id] = marker;
    });

    setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(); }, 150);
  }

  function focusLoteOnMap(id) {
    const marker = mapMarkers[id];
    if (!mapInstance || !marker) return;
    mapInstance.setView(marker.getLatLng(), 13, { animate: true });
    marker.openPopup();
  }

  function fitMapToLotes(ubicados) {
    if (!mapInstance || !ubicados.length) return;
    if (ubicados.length === 1) {
      mapInstance.setView([ubicados[0].lat, ubicados[0].lng], 13, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(ubicados.map((l) => [l.lat, l.lng]));
    mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }

  /* ============================================================
     CLIMA
     ============================================================ */

  function renderClima(root) {
    const lotesConCoord = DB.getAll('lotes').filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Clima</h2><p>Pronóstico de 5 días para cada lote ubicado en el mapa</p></div>
        <div class="view-header__actions">
          ${lotesConCoord.length ? `<button class="btn btn--secondary" id="climaRefreshBtn" type="button">${UI.icon('refresh', { size: 14 })}<span>Actualizar</span></button>` : ''}
        </div>
      </div>
      ${lotesConCoord.length
        ? `<div class="weather-grid" id="weatherGrid">${lotesConCoord.map((l) => weatherCardSkeletonHTML(l)).join('')}</div>`
        : UI.emptyState({ iconName: 'cloud', title: 'Sin lotes ubicados', message: 'Agregá coordenadas a tus lotes (desde Lotes o el Mapa) para ver el pronóstico del clima de cada campo.', actionLabel: 'Ir a Lotes', actionAttr: 'id="climaGoLotes"' })}`;

    if (!lotesConCoord.length) {
      const goBtn = document.getElementById('climaGoLotes');
      if (goBtn) goBtn.addEventListener('click', () => navigate('lotes'));
      return;
    }

    lotesConCoord.forEach((l) => loadWeatherIntoCard(l.id, l.lat, l.lng));
    document.getElementById('climaRefreshBtn').addEventListener('click', () => {
      Object.keys(weatherCache).forEach((k) => delete weatherCache[k]);
      renderClima(root);
    });
  }

  function weatherCardSkeletonHTML(l) {
    return `
      <div class="weather-card" id="weather-${l.id}">
        <div class="weather-card__head">
          <h4>${UI.escapeHTML(l.nombre)}</h4>
          <span class="weather-card__loc">${UI.icon('pin', { size: 11 })}${UI.escapeHTML(l.ubicacion)}</span>
        </div>
        <div class="weather-card__body">${weatherLoadingHTML()}</div>
      </div>`;
  }

  function loadWeatherIntoCard(loteId, lat, lng) {
    fetchWeather(lat, lng)
      .then((days) => {
        const el = document.getElementById(`weather-${loteId}`);
        if (!el) return;
        el.querySelector('.weather-card__body').innerHTML = weatherStripHTML(days);
      })
      .catch(() => {
        const el = document.getElementById(`weather-${loteId}`);
        if (!el) return;
        el.querySelector('.weather-card__body').innerHTML = weatherErrorHTML();
      });
  }

  /* ============================================================
     CULTIVOS
     ============================================================ */

  function renderCultivos(root) {
    const f = state.filters.cultivos;
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Cultivos</h2><p>${DB.count('cultivos')} cultivo(s) en el catálogo</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addCultivoBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo cultivo</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="cultivoSearch" placeholder="Buscar por nombre…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="cultivoTipoFilter"><option value="">Todos los tipos</option>${enumOptions(DB.ENUMS.tiposCultivo, f.tipo)}</select>
        <button class="toolbar__reset" id="cultivoResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="cultivoResultCount"></span>
      </div>
      <div id="cultivoResults"></div>`;

    document.getElementById('addCultivoBtn').addEventListener('click', () => openCultivoForm());
    document.getElementById('cultivoSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderCultivoResults(); }, 180));
    document.getElementById('cultivoTipoFilter').addEventListener('change', (e) => { f.tipo = e.target.value; renderCultivoResults(); });
    document.getElementById('cultivoResetBtn').addEventListener('click', () => { f.search = ''; f.tipo = ''; renderCultivos(root); });
    renderCultivoResults();
  }

  function getFilteredCultivos() {
    const f = state.filters.cultivos;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('cultivos')
      .filter((c) => !f.tipo || c.tipo === f.tipo)
      .filter((c) => !q || c.nombre.toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  function renderCultivoResults() {
    const wrap = document.getElementById('cultivoResults');
    const list = getFilteredCultivos();
    document.getElementById('cultivoResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'leaf',
        title: DB.count('cultivos') ? 'Sin coincidencias' : 'Todavía no hay cultivos',
        message: DB.count('cultivos') ? 'Probá ajustar los filtros de búsqueda.' : 'Agregá el primer cultivo a tu catálogo.',
        actionLabel: DB.count('cultivos') ? '' : 'Nuevo cultivo',
        actionAttr: 'id="emptyAddCultivo"',
      });
      const emptyBtn = document.getElementById('emptyAddCultivo');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openCultivoForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Cultivo</th><th>Tipo</th><th>Descripción</th><th>Siembras</th><th>Cosechas</th><th></th></tr></thead>
        <tbody>${list.map(cultivoRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openCultivoForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteCultivo(btn.dataset.delete)));
  }

  function cultivoRowHTML(c) {
    const deps = DB.dependentsOfCultivo(c.id);
    return `<tr data-id="${c.id}">
      <td class="cell-strong"><div class="cell-with-icon">${UI.icon('leaf', { size: 15 })}<span>${UI.escapeHTML(c.nombre)}</span></div></td>
      <td>${UI.badge(c.tipo, TIPO_VARIANT[c.tipo] || 'neutral')}</td>
      <td class="cell-muted">${c.descripcion ? UI.escapeHTML(c.descripcion) : '—'}</td>
      <td class="cell-num">${deps.siembras}</td>
      <td class="cell-num">${deps.cosechas}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${c.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${c.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openCultivoForm(id) {
    const editing = id ? DB.getById('cultivos', id) : null;
    UI.openModal({
      title: editing ? 'Editar cultivo' : 'Nuevo cultivo',
      subtitle: editing ? editing.nombre : 'Agregá un cultivo al catálogo',
      bodyHTML: `
        <form id="cultivoForm" class="form-grid" novalidate>
          <div class="form-group form-group--full">
            <label for="cf-nombre">Nombre <span class="req">*</span></label>
            <input class="form-control" id="cf-nombre" name="nombre" placeholder="Ej: Soja" value="${editing ? UI.escapeHTML(editing.nombre) : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group form-group--full">
            <label for="cf-tipo">Tipo <span class="req">*</span></label>
            <select class="form-control" id="cf-tipo" name="tipo"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.tiposCultivo, editing ? editing.tipo : '')}</select>
            <span class="form-error"></span>
          </div>
          <div class="form-group form-group--full">
            <label for="cf-descripcion">Descripción</label>
            <textarea class="form-control" id="cf-descripcion" name="descripcion" placeholder="Descripción opcional">${editing ? UI.escapeHTML(editing.descripcion || '') : ''}</textarea>
          </div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="cultivoForm">${editing ? 'Guardar cambios' : 'Crear cultivo'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#cultivoForm').addEventListener('submit', (e) => { e.preventDefault(); submitCultivoForm(e.target, editing); });
      },
    });
  }

  function submitCultivoForm(form, editing) {
    const nombre = validateRequired(form, 'nombre', 'Ingresá el nombre del cultivo');
    const tipo = validateRequired(form, 'tipo', 'Seleccioná un tipo');
    const descripcion = form.querySelector('[name="descripcion"]').value.trim();
    if (!nombre || !tipo) return;
    const payload = { nombre, tipo, descripcion };
    if (editing) {
      DB.update('cultivos', editing.id, payload);
      UI.toast(`"${nombre}" se actualizó correctamente.`, 'success', 'Cultivo actualizado');
    } else {
      DB.create('cultivos', 'cul', payload);
      UI.toast(`"${nombre}" se agregó al catálogo.`, 'success', 'Cultivo creado');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteCultivo(id) {
    const cultivo = DB.getById('cultivos', id);
    if (!cultivo) return;
    const deps = DB.dependentsOfCultivo(id);
    const total = deps.siembras + deps.cosechas;
    const message = total > 0
      ? `Se eliminará <strong>${UI.escapeHTML(cultivo.nombre)}</strong> junto con ${total} registro(s) asociado(s) (siembras y cosechas). Esta acción no se puede deshacer.`
      : `Se eliminará <strong>${UI.escapeHTML(cultivo.nombre)}</strong> del catálogo. Esta acción no se puede deshacer.`;
    const ok = await UI.confirmDialog({ title: 'Eliminar cultivo', message, confirmLabel: 'Eliminar cultivo', tone: 'danger' });
    if (!ok) return;
    DB.getAll('siembras').filter((s) => s.cultivoId === id).forEach((s) => DB.remove('siembras', s.id));
    DB.getAll('cosechas').filter((c) => c.cultivoId === id).forEach((c) => DB.remove('cosechas', c.id));
    DB.remove('cultivos', id);
    UI.toast(`"${cultivo.nombre}" fue eliminado.`, 'success', 'Cultivo eliminado');
    refreshCurrentView();
  }

  /* ============================================================
     SIEMBRAS
     ============================================================ */

  function renderSiembras(root) {
    const f = state.filters.siembras;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const cultivos = DB.getAll('cultivos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Siembras</h2><p>${DB.count('siembras')} siembra(s) registradas</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addSiembraBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nueva siembra</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="siembraSearch" placeholder="Buscar en observaciones…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="siembraLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <select id="siembraCultivoFilter"><option value="">Todos los cultivos</option>${selectOptionsPlain(cultivos, f.cultivoId)}</select>
        <div class="toolbar__field"><input type="date" id="siembraDesde" value="${f.desde}" title="Desde"></div>
        <div class="toolbar__field"><input type="date" id="siembraHasta" value="${f.hasta}" title="Hasta"></div>
        <button class="toolbar__reset" id="siembraResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="siembraResultCount"></span>
      </div>
      <div id="siembraResults"></div>`;

    document.getElementById('addSiembraBtn').addEventListener('click', () => openSiembraForm());
    document.getElementById('siembraSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderSiembraResults(); }, 180));
    document.getElementById('siembraLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderSiembraResults(); });
    document.getElementById('siembraCultivoFilter').addEventListener('change', (e) => { f.cultivoId = e.target.value; renderSiembraResults(); });
    document.getElementById('siembraDesde').addEventListener('change', (e) => { f.desde = e.target.value; renderSiembraResults(); });
    document.getElementById('siembraHasta').addEventListener('change', (e) => { f.hasta = e.target.value; renderSiembraResults(); });
    document.getElementById('siembraResetBtn').addEventListener('click', () => { Object.assign(f, { search: '', loteId: '', cultivoId: '', desde: '', hasta: '' }); renderSiembras(root); });
    renderSiembraResults();
  }

  function getFilteredSiembras() {
    const f = state.filters.siembras;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('siembras')
      .filter((s) => !f.loteId || s.loteId === f.loteId)
      .filter((s) => !f.cultivoId || s.cultivoId === f.cultivoId)
      .filter((s) => !f.desde || s.fecha >= f.desde)
      .filter((s) => !f.hasta || s.fecha <= f.hasta)
      .filter((s) => !q || (s.observaciones || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function renderSiembraResults() {
    const wrap = document.getElementById('siembraResults');
    const list = getFilteredSiembras();
    document.getElementById('siembraResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'sprout',
        title: DB.count('siembras') ? 'Sin coincidencias' : 'Todavía no hay siembras',
        message: DB.count('siembras') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá la primera siembra de la campaña.',
        actionLabel: DB.count('siembras') ? '' : 'Nueva siembra',
        actionAttr: 'id="emptyAddSiembra"',
      });
      const emptyBtn = document.getElementById('emptyAddSiembra');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openSiembraForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Lote</th><th>Cultivo</th><th>Superficie</th><th>Semillas</th><th>Prod. estimada</th><th>Destino</th><th></th></tr></thead>
        <tbody>${list.map(siembraRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openSiembraForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteSiembra(btn.dataset.delete)));
  }

  function siembraRowHTML(s) {
    return `<tr data-id="${s.id}">
      <td class="cell-muted">${UI.formatDate(s.fecha)}</td>
      <td class="cell-strong">${UI.escapeHTML(loteName(s.loteId))}</td>
      <td><div class="cell-with-icon">${UI.icon('leaf', { size: 14 })}<span>${UI.escapeHTML(cultivoName(s.cultivoId))}</span></div></td>
      <td class="cell-num">${UI.formatNumber(s.superficieSembrada, 1)} ha</td>
      <td class="cell-num">${UI.formatNumber(s.cantidadSemillas, 0)} kg</td>
      <td class="cell-num">${UI.formatNumber(s.produccionEstimada, 1)} ton</td>
      <td>${UI.badge(s.destino, 'neutral')}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${s.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${s.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openSiembraForm(id) {
    const editing = id ? DB.getById('siembras', id) : null;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const cultivos = DB.getAll('cultivos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar siembra' : 'Nueva siembra',
      subtitle: editing ? `${cultivoName(editing.cultivoId)} · ${loteName(editing.loteId)}` : 'Registrá una nueva siembra',
      size: 'lg',
      bodyHTML: `
        <form id="siembraForm" class="form-grid" novalidate>
          <div class="form-group"><label for="sf-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="sf-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-destino">Destino <span class="req">*</span></label><select class="form-control" id="sf-destino" name="destino"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.destinosSiembra, editing ? editing.destino : '')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-lote">Lote <span class="req">*</span></label><select class="form-control" id="sf-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-cultivo">Cultivo <span class="req">*</span></label><select class="form-control" id="sf-cultivo" name="cultivoId">${loteCultivoOptions(cultivos, editing ? editing.cultivoId : '', 'Seleccionar cultivo…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-superficie">Superficie sembrada (ha) <span class="req">*</span></label><input class="form-control" type="number" min="0.1" step="0.1" id="sf-superficie" name="superficieSembrada" value="${editing ? editing.superficieSembrada : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-semillas">Cantidad de semillas (kg) <span class="req">*</span></label><input class="form-control" type="number" min="1" step="1" id="sf-semillas" name="cantidadSemillas" value="${editing ? editing.cantidadSemillas : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-produccion">Producción estimada (ton) <span class="req">*</span></label><input class="form-control" type="number" min="0" step="0.1" id="sf-produccion" name="produccionEstimada" value="${editing ? editing.produccionEstimada : ''}"><span class="form-error"></span></div>
          <div class="form-group form-group--full"><label for="sf-observaciones">Observaciones</label><textarea class="form-control" id="sf-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="siembraForm">${editing ? 'Guardar cambios' : 'Crear siembra'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#siembraForm').addEventListener('submit', (e) => { e.preventDefault(); submitSiembraForm(e.target, editing); });
      },
    });
  }

  function submitSiembraForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const cultivoId = validateRequired(form, 'cultivoId', 'Seleccioná un cultivo');
    const destino = validateRequired(form, 'destino', 'Seleccioná un destino');
    const superficieSembrada = validateNumber(form, 'superficieSembrada', { min: 0.1 });
    const cantidadSemillas = validateNumber(form, 'cantidadSemillas', { min: 1 });
    const produccionEstimada = validateNumber(form, 'produccionEstimada', { min: 0 });
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!fecha || !loteId || !cultivoId || !destino || superficieSembrada === null || cantidadSemillas === null || produccionEstimada === null) return;
    const payload = { fecha, loteId, cultivoId, destino, superficieSembrada, cantidadSemillas, produccionEstimada, observaciones };
    if (editing) {
      DB.update('siembras', editing.id, payload);
      UI.toast('La siembra se actualizó correctamente.', 'success', 'Siembra actualizada');
    } else {
      DB.create('siembras', 'sie', payload);
      UI.toast('La siembra se registró correctamente.', 'success', 'Siembra creada');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteSiembra(id) {
    const s = DB.getById('siembras', id);
    if (!s) return;
    const linkedCosechas = DB.getAll('cosechas').filter((c) => c.siembraId === id).length;
    const message = linkedCosechas > 0
      ? `Se eliminará esta siembra. ${linkedCosechas} cosecha(s) vinculada(s) quedarán sin siembra asociada. Esta acción no se puede deshacer.`
      : `Se eliminará esta siembra de <strong>${UI.escapeHTML(cultivoName(s.cultivoId))}</strong> en <strong>${UI.escapeHTML(loteName(s.loteId))}</strong>. Esta acción no se puede deshacer.`;
    const ok = await UI.confirmDialog({ title: 'Eliminar siembra', message, confirmLabel: 'Eliminar siembra', tone: 'danger' });
    if (!ok) return;
    DB.getAll('cosechas').filter((c) => c.siembraId === id).forEach((c) => DB.update('cosechas', c.id, { siembraId: null }));
    DB.remove('siembras', id);
    UI.toast('La siembra fue eliminada.', 'success', 'Siembra eliminada');
    refreshCurrentView();
  }

  /* ============================================================
     FUMIGACIONES
     ============================================================ */

  function renderFumigaciones(root) {
    const f = state.filters.fumigaciones;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const aplicadores = [...new Set(DB.getAll('fumigaciones').map((x) => x.aplicador))].sort((a, b) => a.localeCompare(b, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Fumigaciones</h2><p>${DB.count('fumigaciones')} aplicación(es) registradas</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addFumigacionBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nueva fumigación</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="fumigacionSearch" placeholder="Buscar por producto…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="fumigacionLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <select id="fumigacionAplicadorFilter"><option value="">Todos los aplicadores</option>${aplicadores.map((a) => `<option value="${UI.escapeHTML(a)}" ${a === f.aplicador ? 'selected' : ''}>${UI.escapeHTML(a)}</option>`).join('')}</select>
        <div class="toolbar__field"><input type="date" id="fumigacionDesde" value="${f.desde}" title="Desde"></div>
        <div class="toolbar__field"><input type="date" id="fumigacionHasta" value="${f.hasta}" title="Hasta"></div>
        <button class="toolbar__reset" id="fumigacionResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="fumigacionResultCount"></span>
      </div>
      <div id="fumigacionResults"></div>`;

    document.getElementById('addFumigacionBtn').addEventListener('click', () => openFumigacionForm());
    document.getElementById('fumigacionSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderFumigacionResults(); }, 180));
    document.getElementById('fumigacionLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderFumigacionResults(); });
    document.getElementById('fumigacionAplicadorFilter').addEventListener('change', (e) => { f.aplicador = e.target.value; renderFumigacionResults(); });
    document.getElementById('fumigacionDesde').addEventListener('change', (e) => { f.desde = e.target.value; renderFumigacionResults(); });
    document.getElementById('fumigacionHasta').addEventListener('change', (e) => { f.hasta = e.target.value; renderFumigacionResults(); });
    document.getElementById('fumigacionResetBtn').addEventListener('click', () => { Object.assign(f, { search: '', loteId: '', aplicador: '', desde: '', hasta: '' }); renderFumigaciones(root); });
    renderFumigacionResults();
  }

  function getFilteredFumigaciones() {
    const f = state.filters.fumigaciones;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('fumigaciones')
      .filter((x) => !f.loteId || x.loteId === f.loteId)
      .filter((x) => !f.aplicador || x.aplicador === f.aplicador)
      .filter((x) => !f.desde || x.fecha >= f.desde)
      .filter((x) => !f.hasta || x.fecha <= f.hasta)
      .filter((x) => !q || x.producto.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function renderFumigacionResults() {
    const wrap = document.getElementById('fumigacionResults');
    const list = getFilteredFumigaciones();
    document.getElementById('fumigacionResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'droplet',
        title: DB.count('fumigaciones') ? 'Sin coincidencias' : 'Todavía no hay fumigaciones',
        message: DB.count('fumigaciones') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá la primera aplicación fitosanitaria.',
        actionLabel: DB.count('fumigaciones') ? '' : 'Nueva fumigación',
        actionAttr: 'id="emptyAddFumigacion"',
      });
      const emptyBtn = document.getElementById('emptyAddFumigacion');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openFumigacionForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Lote</th><th>Producto</th><th>Dosis</th><th>Aplicador</th><th>Motivo</th><th></th></tr></thead>
        <tbody>${list.map(fumigacionRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openFumigacionForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteFumigacion(btn.dataset.delete)));
  }

  function fumigacionRowHTML(x) {
    return `<tr data-id="${x.id}">
      <td class="cell-muted">${UI.formatDate(x.fecha)}</td>
      <td class="cell-strong">${UI.escapeHTML(loteName(x.loteId))}</td>
      <td><div class="cell-with-icon">${UI.icon('droplet', { size: 14 })}<span>${UI.escapeHTML(x.producto)}</span></div></td>
      <td class="cell-num">${UI.escapeHTML(x.dosis)}</td>
      <td>${UI.escapeHTML(x.aplicador)}</td>
      <td>${UI.badge(x.motivo, 'info')}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${x.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${x.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openFumigacionForm(id) {
    const editing = id ? DB.getById('fumigaciones', id) : null;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar fumigación' : 'Nueva fumigación',
      subtitle: editing ? `${editing.producto} · ${loteName(editing.loteId)}` : 'Registrá una aplicación fitosanitaria',
      bodyHTML: `
        <form id="fumigacionForm" class="form-grid" novalidate>
          <div class="form-group"><label for="ff-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="ff-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="ff-lote">Lote <span class="req">*</span></label><select class="form-control" id="ff-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="ff-producto">Producto <span class="req">*</span></label><input class="form-control" id="ff-producto" name="producto" placeholder="Ej: Glifosato 48%" value="${editing ? UI.escapeHTML(editing.producto) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="ff-dosis">Dosis <span class="req">*</span></label><input class="form-control" id="ff-dosis" name="dosis" placeholder="Ej: 3 L/ha" value="${editing ? UI.escapeHTML(editing.dosis) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="ff-aplicador">Aplicador <span class="req">*</span></label><input class="form-control" id="ff-aplicador" name="aplicador" placeholder="Nombre o empresa" value="${editing ? UI.escapeHTML(editing.aplicador) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="ff-motivo">Motivo <span class="req">*</span></label><select class="form-control" id="ff-motivo" name="motivo"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.motivosFumigacion, editing ? editing.motivo : '')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="ff-insumo">Insumo utilizado <span style="font-weight:400;color:var(--text-muted)">(opcional)</span></label><select class="form-control" id="ff-insumo" name="insumoId"><option value="">Sin vincular a stock</option>${DB.getAll('insumos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((i) => `<option value="${i.id}" ${editing && editing.insumoId === i.id ? 'selected' : ''}>${UI.escapeHTML(i.nombre)} (${UI.formatNumber(i.stockActual, 1)} ${i.unidad} disp.)</option>`).join('')}</select></div>
          <div class="form-group"><label for="ff-cantidad">Cantidad usada</label><input class="form-control" id="ff-cantidad" name="cantidadUsada" type="number" min="0" step="0.1" value="${editing && editing.cantidadUsada !== undefined && editing.cantidadUsada !== null ? editing.cantidadUsada : ''}"><span class="form-hint" id="ff-stock-hint"></span></div>
          <div class="form-group form-group--full"><label for="ff-observaciones">Observaciones</label><textarea class="form-control" id="ff-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="fumigacionForm">${editing ? 'Guardar cambios' : 'Crear fumigación'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#fumigacionForm').addEventListener('submit', (e) => { e.preventDefault(); submitFumigacionForm(e.target, editing); });

        const insumoSel = mroot.querySelector('#ff-insumo');
        const cantidadInput = mroot.querySelector('#ff-cantidad');
        const stockHint = mroot.querySelector('#ff-stock-hint');
        function updateStockHint() {
          const insumo = DB.getById('insumos', insumoSel.value);
          if (!insumo) { stockHint.textContent = ''; return; }
          const cantidad = Number(cantidadInput.value) || 0;
          const yaReservado = (editing && editing.insumoId === insumo.id) ? Number(editing.cantidadUsada || 0) : 0;
          const disponible = Number(insumo.stockActual) + yaReservado;
          const restante = disponible - cantidad;
          stockHint.style.color = restante < 0 ? 'var(--danger)' : 'var(--text-muted)';
          stockHint.textContent = restante < 0
            ? `Stock insuficiente: hay ${UI.formatNumber(disponible, 1)} ${insumo.unidad} disponibles.`
            : `Quedarán ${UI.formatNumber(restante, 1)} ${insumo.unidad} en stock.`;
        }
        insumoSel.addEventListener('change', updateStockHint);
        cantidadInput.addEventListener('input', updateStockHint);
        updateStockHint();
      },
    });
  }

  function submitFumigacionForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const producto = validateRequired(form, 'producto', 'Ingresá el producto aplicado');
    const dosis = validateRequired(form, 'dosis', 'Ingresá la dosis aplicada');
    const aplicador = validateRequired(form, 'aplicador', 'Ingresá el aplicador');
    const motivo = validateRequired(form, 'motivo', 'Seleccioná un motivo');
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    const insumoId = form.querySelector('[name="insumoId"]').value || null;
    const cantidadRaw = form.querySelector('[name="cantidadUsada"]').value.trim();
    const cantidadUsada = cantidadRaw ? Number(cantidadRaw) : null;
    if (!fecha || !loteId || !producto || !dosis || !aplicador || !motivo) return;
    if (insumoId && (cantidadUsada === null || cantidadUsada <= 0)) {
      UI.toast('Ingresá la cantidad utilizada del insumo seleccionado.', 'error', 'Cantidad requerida');
      return;
    }
    if (editing && editing.insumoId && editing.cantidadUsada) {
      DB.adjustInsumoStock(editing.insumoId, Number(editing.cantidadUsada));
    }
    if (insumoId && cantidadUsada) {
      DB.adjustInsumoStock(insumoId, -cantidadUsada);
    }
    const payload = { fecha, loteId, producto, dosis, aplicador, motivo, observaciones, insumoId, cantidadUsada };
    if (editing) {
      DB.update('fumigaciones', editing.id, payload);
      UI.toast('La fumigación se actualizó correctamente.', 'success', 'Fumigación actualizada');
    } else {
      DB.create('fumigaciones', 'fum', payload);
      UI.toast('La fumigación se registró correctamente.', 'success', 'Fumigación creada');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteFumigacion(id) {
    const x = DB.getById('fumigaciones', id);
    if (!x) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar fumigación', message: `Se eliminará la aplicación de <strong>${UI.escapeHTML(x.producto)}</strong> en <strong>${UI.escapeHTML(loteName(x.loteId))}</strong>. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar fumigación', tone: 'danger' });
    if (!ok) return;
    if (x.insumoId && x.cantidadUsada) {
      DB.adjustInsumoStock(x.insumoId, Number(x.cantidadUsada));
    }
    DB.remove('fumigaciones', id);
    UI.toast('La fumigación fue eliminada.', 'success', 'Fumigación eliminada');
    refreshCurrentView();
  }

  /* ============================================================
     COSECHAS
     ============================================================ */

  function renderCosechas(root) {
    const f = state.filters.cosechas;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const cultivos = DB.getAll('cultivos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Cosechas</h2><p>${DB.count('cosechas')} cosecha(s) registradas</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addCosechaBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nueva cosecha</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="cosechaSearch" placeholder="Buscar en observaciones…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="cosechaLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <select id="cosechaCultivoFilter"><option value="">Todos los cultivos</option>${selectOptionsPlain(cultivos, f.cultivoId)}</select>
        <div class="toolbar__field"><input type="date" id="cosechaDesde" value="${f.desde}" title="Desde"></div>
        <div class="toolbar__field"><input type="date" id="cosechaHasta" value="${f.hasta}" title="Hasta"></div>
        <button class="toolbar__reset" id="cosechaResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="cosechaResultCount"></span>
      </div>
      <div id="cosechaResults"></div>`;

    document.getElementById('addCosechaBtn').addEventListener('click', () => openCosechaForm());
    document.getElementById('cosechaSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderCosechaResults(); }, 180));
    document.getElementById('cosechaLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderCosechaResults(); });
    document.getElementById('cosechaCultivoFilter').addEventListener('change', (e) => { f.cultivoId = e.target.value; renderCosechaResults(); });
    document.getElementById('cosechaDesde').addEventListener('change', (e) => { f.desde = e.target.value; renderCosechaResults(); });
    document.getElementById('cosechaHasta').addEventListener('change', (e) => { f.hasta = e.target.value; renderCosechaResults(); });
    document.getElementById('cosechaResetBtn').addEventListener('click', () => { Object.assign(f, { search: '', loteId: '', cultivoId: '', desde: '', hasta: '' }); renderCosechas(root); });
    renderCosechaResults();
  }

  function getFilteredCosechas() {
    const f = state.filters.cosechas;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('cosechas')
      .filter((c) => !f.loteId || c.loteId === f.loteId)
      .filter((c) => !f.cultivoId || c.cultivoId === f.cultivoId)
      .filter((c) => !f.desde || c.fecha >= f.desde)
      .filter((c) => !f.hasta || c.fecha <= f.hasta)
      .filter((c) => !q || (c.observaciones || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function renderCosechaResults() {
    const wrap = document.getElementById('cosechaResults');
    const list = getFilteredCosechas();
    document.getElementById('cosechaResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'basket',
        title: DB.count('cosechas') ? 'Sin coincidencias' : 'Todavía no hay cosechas',
        message: DB.count('cosechas') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá el resultado de la primera cosecha.',
        actionLabel: DB.count('cosechas') ? '' : 'Nueva cosecha',
        actionAttr: 'id="emptyAddCosecha"',
      });
      const emptyBtn = document.getElementById('emptyAddCosecha');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openCosechaForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Lote</th><th>Cultivo</th><th>Producción real</th><th>Rendimiento</th><th>Valor estimado</th><th>Siembra vinculada</th><th></th></tr></thead>
        <tbody>${list.map(cosechaRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openCosechaForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteCosecha(btn.dataset.delete)));
  }

  function rendimientoBadgeHTML(produccionReal, produccionEstimada) {
    if (!produccionEstimada) return '<span class="text-muted">—</span>';
    const pct = Math.round((produccionReal / produccionEstimada) * 100);
    const variant = pct >= 100 ? 'success' : pct >= 80 ? 'warning' : 'danger';
    return UI.badge(`${pct}% del estimado`, variant);
  }

  function cosechaRowHTML(c) {
    const siembra = c.siembraId ? DB.getById('siembras', c.siembraId) : null;
    const precio = DB.getPrecioByCultivo(c.cultivoId);
    const valorEstimado = precio ? Number(c.produccionReal || 0) * precio.precioTon : null;
    return `<tr data-id="${c.id}">
      <td class="cell-muted">${UI.formatDate(c.fecha)}</td>
      <td class="cell-strong">${UI.escapeHTML(loteName(c.loteId))}</td>
      <td><div class="cell-with-icon">${UI.icon('leaf', { size: 14 })}<span>${UI.escapeHTML(cultivoName(c.cultivoId))}</span></div></td>
      <td class="cell-num">${UI.formatNumber(c.produccionReal, 1)} ton</td>
      <td>${rendimientoBadgeHTML(c.produccionReal, siembra ? siembra.produccionEstimada : null)}</td>
      <td class="cell-num">${valorEstimado !== null ? `US$ ${UI.formatNumber(valorEstimado, 0)}` : '<span class="text-muted">Sin precio</span>'}</td>
      <td class="cell-muted">${siembra ? UI.formatDate(siembra.fecha) : 'Sin vincular'}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${c.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${c.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openCosechaForm(id) {
    const editing = id ? DB.getById('cosechas', id) : null;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const cultivos = DB.getAll('cultivos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar cosecha' : 'Nueva cosecha',
      subtitle: editing ? `${cultivoName(editing.cultivoId)} · ${loteName(editing.loteId)}` : 'Registrá el resultado de una cosecha',
      bodyHTML: `
        <form id="cosechaForm" class="form-grid" novalidate>
          <div class="form-group"><label for="cof-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="cof-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="cof-produccion">Producción real (ton) <span class="req">*</span></label><input class="form-control" type="number" min="0" step="0.1" id="cof-produccion" name="produccionReal" value="${editing ? editing.produccionReal : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="cof-lote">Lote <span class="req">*</span></label><select class="form-control" id="cof-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="cof-cultivo">Cultivo <span class="req">*</span></label><select class="form-control" id="cof-cultivo" name="cultivoId">${loteCultivoOptions(cultivos, editing ? editing.cultivoId : '', 'Seleccionar cultivo…')}</select><span class="form-error"></span></div>
          <div class="form-group form-group--full"><label for="cof-siembra">Siembra vinculada</label><select class="form-control" id="cof-siembra" name="siembraId"><option value="">Sin vincular</option></select><span class="form-hint">Opcional. Se sugieren siembras del mismo lote y cultivo.</span></div>
          <div class="form-group form-group--full"><label for="cof-observaciones">Observaciones</label><textarea class="form-control" id="cof-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="cosechaForm">${editing ? 'Guardar cambios' : 'Crear cosecha'}</button>`,
      onMount: (mroot) => {
        const loteSel = mroot.querySelector('#cof-lote');
        const cultivoSel = mroot.querySelector('#cof-cultivo');
        const siembraSel = mroot.querySelector('#cof-siembra');
        function refreshSiembraOptions() {
          const matches = DB.getAll('siembras').filter((s) => (!loteSel.value || s.loteId === loteSel.value) && (!cultivoSel.value || s.cultivoId === cultivoSel.value));
          const selected = editing ? editing.siembraId : '';
          siembraSel.innerHTML = `<option value="">Sin vincular</option>${matches.map((s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${UI.escapeHTML(cultivoName(s.cultivoId))} en ${UI.escapeHTML(loteName(s.loteId))} — ${UI.formatDate(s.fecha)}</option>`).join('')}`;
        }
        refreshSiembraOptions();
        loteSel.addEventListener('change', refreshSiembraOptions);
        cultivoSel.addEventListener('change', refreshSiembraOptions);
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#cosechaForm').addEventListener('submit', (e) => { e.preventDefault(); submitCosechaForm(e.target, editing); });
      },
    });
  }

  function submitCosechaForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const cultivoId = validateRequired(form, 'cultivoId', 'Seleccioná un cultivo');
    const produccionReal = validateNumber(form, 'produccionReal', { min: 0 });
    const siembraId = form.querySelector('[name="siembraId"]').value || null;
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!fecha || !loteId || !cultivoId || produccionReal === null) return;
    const payload = { fecha, loteId, cultivoId, produccionReal, siembraId, observaciones };
    if (editing) {
      DB.update('cosechas', editing.id, payload);
      UI.toast('La cosecha se actualizó correctamente.', 'success', 'Cosecha actualizada');
    } else {
      DB.create('cosechas', 'cos', payload);
      UI.toast('La cosecha se registró correctamente.', 'success', 'Cosecha creada');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteCosecha(id) {
    const c = DB.getById('cosechas', id);
    if (!c) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar cosecha', message: `Se eliminará el registro de cosecha de <strong>${UI.escapeHTML(cultivoName(c.cultivoId))}</strong> en <strong>${UI.escapeHTML(loteName(c.loteId))}</strong>. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar cosecha', tone: 'danger' });
    if (!ok) return;
    DB.remove('cosechas', id);
    UI.toast('La cosecha fue eliminada.', 'success', 'Cosecha eliminada');
    refreshCurrentView();
  }

  /* ============================================================
     NOTAS
     ============================================================ */

  function renderNotas(root) {
    const f = state.filters.notas;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Notas</h2><p>${DB.count('notas')} nota(s) de seguimiento</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addNotaBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nueva nota</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="notaSearch" placeholder="Buscar por título…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="notaLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <select id="notaPrioridadFilter"><option value="">Toda prioridad</option>${enumOptions(DB.ENUMS.prioridadesNota, f.prioridad)}</select>
        <select id="notaEstadoFilter">
          <option value="">Pendientes y completadas</option>
          <option value="pendiente" ${f.estado === 'pendiente' ? 'selected' : ''}>Solo pendientes</option>
          <option value="completada" ${f.estado === 'completada' ? 'selected' : ''}>Solo completadas</option>
        </select>
        <button class="toolbar__reset" id="notaResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="notaResultCount"></span>
      </div>
      <div id="notaResults"></div>`;

    document.getElementById('addNotaBtn').addEventListener('click', () => openNotaForm());
    document.getElementById('notaSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderNotaResults(); }, 180));
    document.getElementById('notaLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderNotaResults(); });
    document.getElementById('notaPrioridadFilter').addEventListener('change', (e) => { f.prioridad = e.target.value; renderNotaResults(); });
    document.getElementById('notaEstadoFilter').addEventListener('change', (e) => { f.estado = e.target.value; renderNotaResults(); });
    document.getElementById('notaResetBtn').addEventListener('click', () => { Object.assign(f, { search: '', loteId: '', prioridad: '', estado: '' }); renderNotas(root); });
    renderNotaResults();
  }

  function getFilteredNotas() {
    const f = state.filters.notas;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('notas')
      .filter((n) => !f.loteId || n.loteId === f.loteId)
      .filter((n) => !f.prioridad || n.prioridad === f.prioridad)
      .filter((n) => !f.estado || (f.estado === 'completada' ? n.completada : !n.completada))
      .filter((n) => !q || n.titulo.toLowerCase().includes(q))
      .sort((a, b) => (a.completada - b.completada) || (PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad]) || (new Date(b.fecha) - new Date(a.fecha)));
  }

  function renderNotaResults() {
    const wrap = document.getElementById('notaResults');
    const list = getFilteredNotas();
    document.getElementById('notaResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'note',
        title: DB.count('notas') ? 'Sin coincidencias' : 'Todavía no hay notas',
        message: DB.count('notas') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá la primera nota de seguimiento.',
        actionLabel: DB.count('notas') ? '' : 'Nueva nota',
        actionAttr: 'id="emptyAddNota"',
      });
      const emptyBtn = document.getElementById('emptyAddNota');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openNotaForm());
      return;
    }
    wrap.innerHTML = `<div class="notes-grid">${list.map(notaCardHTML).join('')}</div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openNotaForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteNota(btn.dataset.delete)));
    wrap.querySelectorAll('[data-toggle]').forEach((cb) => cb.addEventListener('change', () => toggleNota(cb.dataset.toggle, cb.checked)));
  }

  function notaCardHTML(n) {
    const cls = `note-card note-card--${n.prioridad.toLowerCase()}${n.completada ? ' is-done' : ''}`;
    return `
      <article class="${cls}" data-id="${n.id}">
        <div class="note-card__top">
          <div>
            <h4>${UI.escapeHTML(n.titulo)}</h4>
            <div class="note-card__lote">${UI.icon('pin', { size: 11 })}<span>${UI.escapeHTML(loteName(n.loteId))}</span></div>
          </div>
          ${UI.badge(n.prioridad, UI.PRIORIDAD_VARIANT[n.prioridad])}
        </div>
        <p class="note-card__desc">${UI.escapeHTML(n.descripcion)}</p>
        <div class="note-card__foot">
          <span class="note-card__date">${UI.formatDate(n.fecha)}</span>
          <div class="record-card__actions">
            <label class="checkbox-row" style="margin-right:4px" title="Marcar como completada">
              <input type="checkbox" data-toggle="${n.id}" ${n.completada ? 'checked' : ''}>
            </label>
            <button class="icon-btn" data-edit="${n.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 14 })}</button>
            <button class="icon-btn icon-btn--danger" data-delete="${n.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 14 })}</button>
          </div>
        </div>
      </article>`;
  }

  function toggleNota(id, completada) {
    DB.update('notas', id, { completada });
    refreshCurrentView();
  }

  function openNotaForm(id) {
    const editing = id ? DB.getById('notas', id) : null;
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar nota' : 'Nueva nota',
      subtitle: editing ? loteName(editing.loteId) : 'Registrá una nota de seguimiento para un lote',
      bodyHTML: `
        <form id="notaForm" class="form-grid" novalidate>
          <div class="form-group form-group--full"><label for="nf-titulo">Título <span class="req">*</span></label><input class="form-control" id="nf-titulo" name="titulo" placeholder="Ej: Revisar cerco perimetral" value="${editing ? UI.escapeHTML(editing.titulo) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="nf-lote">Lote <span class="req">*</span></label><select class="form-control" id="nf-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="nf-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="nf-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group form-group--full"><label>Prioridad <span class="req">*</span></label>
            <div class="radio-pills">${DB.ENUMS.prioridadesNota.map((p) => `<label class="radio-pill"><input type="radio" name="prioridad" value="${p}" ${(editing ? editing.prioridad : 'Media') === p ? 'checked' : ''}><span>${p}</span></label>`).join('')}</div>
          </div>
          <div class="form-group form-group--full"><label for="nf-descripcion">Descripción <span class="req">*</span></label><textarea class="form-control" id="nf-descripcion" name="descripcion" placeholder="Detalle de la nota">${editing ? UI.escapeHTML(editing.descripcion) : ''}</textarea><span class="form-error"></span></div>
          <div class="form-group form-group--full"><div class="checkbox-row"><input type="checkbox" id="nf-completada" name="completada" ${editing && editing.completada ? 'checked' : ''}><label for="nf-completada">Marcar como completada</label></div></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="notaForm">${editing ? 'Guardar cambios' : 'Crear nota'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#notaForm').addEventListener('submit', (e) => { e.preventDefault(); submitNotaForm(e.target, editing); });
      },
    });
  }

  function submitNotaForm(form, editing) {
    const titulo = validateRequired(form, 'titulo', 'Ingresá un título');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const descripcion = validateRequired(form, 'descripcion', 'Ingresá una descripción');
    const prioridadInput = form.querySelector('[name="prioridad"]:checked');
    const prioridad = prioridadInput ? prioridadInput.value : 'Media';
    const completada = form.querySelector('[name="completada"]').checked;
    if (!titulo || !loteId || !fecha || !descripcion) return;
    const payload = { titulo, loteId, fecha, descripcion, prioridad, completada };
    if (editing) {
      DB.update('notas', editing.id, payload);
      UI.toast('La nota se actualizó correctamente.', 'success', 'Nota actualizada');
    } else {
      DB.create('notas', 'not', payload);
      UI.toast('La nota se registró correctamente.', 'success', 'Nota creada');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteNota(id) {
    const n = DB.getById('notas', id);
    if (!n) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar nota', message: `Se eliminará la nota <strong>${UI.escapeHTML(n.titulo)}</strong>. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar nota', tone: 'danger' });
    if (!ok) return;
    DB.remove('notas', id);
    UI.toast('La nota fue eliminada.', 'success', 'Nota eliminada');
    refreshCurrentView();
  }

  /* ============================================================
     INSUMOS / STOCK
     ============================================================ */

  function insumoIsLow(i) {
    return Number(i.stockActual) <= Number(i.stockMinimo);
  }

  function renderInsumos(root) {
    const f = state.filters.insumos;
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Insumos</h2><p>${DB.count('insumos')} producto(s) en stock (fertilizantes, fitosanitarios, semillas y más)</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addInsumoBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo insumo</span></button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar__search">${UI.icon('search', { size: 15 })}<input id="insumoSearch" placeholder="Buscar por nombre o proveedor…" value="${UI.escapeHTML(f.search)}"></div>
        <select id="insumoCategoriaFilter"><option value="">Todas las categorías</option>${enumOptions(DB.ENUMS.categoriasInsumo, f.categoria)}</select>
        <label class="checkbox-row" style="padding:0 4px"><input type="checkbox" id="insumoBajoFilter" ${f.bajo ? 'checked' : ''}><span style="font-size:12.6px;font-weight:600;color:var(--text-secondary)">Solo stock bajo</span></label>
        <button class="toolbar__reset" id="insumoResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="insumoResultCount"></span>
      </div>
      <div id="insumoResults"></div>`;

    document.getElementById('addInsumoBtn').addEventListener('click', () => openInsumoForm());
    document.getElementById('insumoSearch').addEventListener('input', UI.debounce((e) => { f.search = e.target.value; renderInsumoResults(); }, 180));
    document.getElementById('insumoCategoriaFilter').addEventListener('change', (e) => { f.categoria = e.target.value; renderInsumoResults(); });
    document.getElementById('insumoBajoFilter').addEventListener('change', (e) => { f.bajo = e.target.checked; renderInsumoResults(); });
    document.getElementById('insumoResetBtn').addEventListener('click', () => { Object.assign(f, { search: '', categoria: '', bajo: false }); renderInsumos(root); });
    renderInsumoResults();
  }

  function getFilteredInsumos() {
    const f = state.filters.insumos;
    const q = f.search.trim().toLowerCase();
    return DB.getAll('insumos')
      .filter((i) => !f.categoria || i.categoria === f.categoria)
      .filter((i) => !f.bajo || insumoIsLow(i))
      .filter((i) => !q || `${i.nombre} ${i.proveedor || ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  function renderInsumoResults() {
    const wrap = document.getElementById('insumoResults');
    const list = getFilteredInsumos();
    document.getElementById('insumoResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'package',
        title: DB.count('insumos') ? 'Sin coincidencias' : 'Todavía no hay insumos',
        message: DB.count('insumos') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá los productos que tenés en stock: fertilizantes, fitosanitarios, semillas, combustible.',
        actionLabel: DB.count('insumos') ? '' : 'Nuevo insumo',
        actionAttr: 'id="emptyAddInsumo"',
      });
      const emptyBtn = document.getElementById('emptyAddInsumo');
      if (emptyBtn) emptyBtn.addEventListener('click', () => openInsumoForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Mínimo</th><th>Costo unit.</th><th>Proveedor</th><th></th></tr></thead>
        <tbody>${list.map(insumoRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openInsumoForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteInsumo(btn.dataset.delete)));
  }

  function insumoRowHTML(i) {
    const low = insumoIsLow(i);
    return `<tr data-id="${i.id}">
      <td class="cell-strong"><div class="cell-with-icon">${UI.icon('package', { size: 14 })}<span>${UI.escapeHTML(i.nombre)}</span></div></td>
      <td>${UI.badge(i.categoria, TIPO_VARIANT[i.categoria] || 'neutral')}</td>
      <td class="cell-num">${low ? `<span class="stock-low">${UI.icon('alert', { size: 12 })}${UI.formatNumber(i.stockActual, 1)} ${i.unidad}</span>` : `${UI.formatNumber(i.stockActual, 1)} ${i.unidad}`}</td>
      <td class="cell-num cell-muted">${UI.formatNumber(i.stockMinimo, 1)} ${i.unidad}</td>
      <td class="cell-num">${i.costoUnitario ? `US$ ${UI.formatNumber(i.costoUnitario, 1)}` : '—'}</td>
      <td class="cell-muted">${i.proveedor ? UI.escapeHTML(i.proveedor) : '—'}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${i.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${i.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openInsumoForm(id) {
    const editing = id ? DB.getById('insumos', id) : null;
    UI.openModal({
      title: editing ? 'Editar insumo' : 'Nuevo insumo',
      subtitle: editing ? editing.nombre : 'Registrá un producto en el stock',
      bodyHTML: `
        <form id="insumoForm" class="form-grid" novalidate>
          <div class="form-group form-group--full">
            <label for="if-nombre">Nombre <span class="req">*</span></label>
            <input class="form-control" id="if-nombre" name="nombre" placeholder="Ej: Glifosato 48%" value="${editing ? UI.escapeHTML(editing.nombre) : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="if-categoria">Categoría <span class="req">*</span></label>
            <select class="form-control" id="if-categoria" name="categoria"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.categoriasInsumo, editing ? editing.categoria : '')}</select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="if-unidad">Unidad <span class="req">*</span></label>
            <select class="form-control" id="if-unidad" name="unidad"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.unidadesInsumo, editing ? editing.unidad : '')}</select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="if-stock">Stock actual <span class="req">*</span></label>
            <input class="form-control" id="if-stock" name="stockActual" type="number" min="0" step="0.1" value="${editing ? editing.stockActual : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="if-minimo">Stock mínimo <span class="req">*</span></label>
            <input class="form-control" id="if-minimo" name="stockMinimo" type="number" min="0" step="0.1" value="${editing ? editing.stockMinimo : ''}">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="if-costo">Costo unitario (USD) <span style="font-weight:400;color:var(--text-muted)">(opcional)</span></label>
            <input class="form-control" id="if-costo" name="costoUnitario" type="number" min="0" step="0.01" value="${editing && editing.costoUnitario !== undefined ? editing.costoUnitario : ''}">
          </div>
          <div class="form-group">
            <label for="if-proveedor">Proveedor</label>
            <input class="form-control" id="if-proveedor" name="proveedor" placeholder="Opcional" value="${editing ? UI.escapeHTML(editing.proveedor || '') : ''}">
          </div>
          <div class="form-group form-group--full">
            <label for="if-observaciones">Observaciones</label>
            <textarea class="form-control" id="if-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea>
          </div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="insumoForm">${editing ? 'Guardar cambios' : 'Crear insumo'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#insumoForm').addEventListener('submit', (e) => { e.preventDefault(); submitInsumoForm(e.target, editing); });
      },
    });
  }

  function submitInsumoForm(form, editing) {
    const nombre = validateRequired(form, 'nombre', 'Ingresá el nombre del insumo');
    const categoria = validateRequired(form, 'categoria', 'Seleccioná una categoría');
    const unidad = validateRequired(form, 'unidad', 'Seleccioná una unidad');
    const stockActual = validateNumber(form, 'stockActual', { min: 0 });
    const stockMinimo = validateNumber(form, 'stockMinimo', { min: 0 });
    const costoRaw = form.querySelector('[name="costoUnitario"]').value.trim();
    const costoUnitario = costoRaw ? Number(costoRaw) : null;
    const proveedor = form.querySelector('[name="proveedor"]').value.trim();
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!nombre || !categoria || !unidad || stockActual === null || stockMinimo === null) return;
    const payload = { nombre, categoria, unidad, stockActual, stockMinimo, costoUnitario, proveedor, observaciones };
    if (editing) {
      DB.update('insumos', editing.id, payload);
      UI.toast(`"${nombre}" se actualizó correctamente.`, 'success', 'Insumo actualizado');
    } else {
      DB.create('insumos', 'ins', payload);
      UI.toast(`"${nombre}" se agregó al stock.`, 'success', 'Insumo creado');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteInsumo(id) {
    const insumo = DB.getById('insumos', id);
    if (!insumo) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar insumo', message: `Se eliminará <strong>${UI.escapeHTML(insumo.nombre)}</strong> del stock. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar insumo', tone: 'danger' });
    if (!ok) return;
    DB.remove('insumos', id);
    UI.toast(`"${insumo.nombre}" fue eliminado.`, 'success', 'Insumo eliminado');
    refreshCurrentView();
  }

  /* ============================================================
     PRECIOS
     ============================================================ */

  function renderPrecios(root, skipSync) {
    const cultivos = DB.getAll('cultivos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const siembras = DB.getAll('siembras');
    const cosechas = DB.getAll('cosechas');
    const cosechaSiembraIds = new Set(cosechas.map((c) => c.siembraId).filter(Boolean));

    function precioTonFor(cultivoId) {
      const p = DB.getPrecioByCultivo(cultivoId);
      return p ? p.precioTon : null;
    }

    const valorEnPie = siembras.filter((s) => !cosechaSiembraIds.has(s.id)).reduce((sum, s) => {
      const precio = precioTonFor(s.cultivoId);
      return sum + (precio ? Number(s.produccionEstimada || 0) * precio : 0);
    }, 0);

    const valorCosechado = cosechas.reduce((sum, c) => {
      const precio = precioTonFor(c.cultivoId);
      return sum + (precio ? Number(c.produccionReal || 0) * precio : 0);
    }, 0);

    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Precios de referencia</h2><p>Soja, maíz, trigo y girasol se actualizan automáticamente (FOB oficial MAGyP); el resto lo cargás vos</p></div>
        <div class="view-header__actions"><button class="btn btn--secondary" id="preciosRefreshBtn" type="button">${UI.icon('refresh', { size: 14 })}<span>Actualizar precios oficiales</span></button></div>
      </div>
      <div class="stat-grid" style="margin-bottom:18px">
        <div class="stat-card">
          <div class="stat-card__top"><span class="stat-card__icon stat-card__icon--green">${UI.icon('sprout', { size: 18 })}</span></div>
          <div class="stat-card__value">US$ ${UI.formatNumber(valorEnPie, 0)}</div>
          <div class="stat-card__label">Valor estimado en pie</div>
          <div class="stat-card__sub">Siembras activas × precio de referencia</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><span class="stat-card__icon stat-card__icon--amber">${UI.icon('basket', { size: 18 })}</span></div>
          <div class="stat-card__value">US$ ${UI.formatNumber(valorCosechado, 0)}</div>
          <div class="stat-card__label">Valor de cosechas registradas</div>
          <div class="stat-card__sub">Producción real × precio de referencia</div>
        </div>
      </div>
      <div class="panel" style="margin-bottom:0">
        <div class="panel__header"><div><h3>Precio por cultivo</h3><p>Soja/Maíz/Trigo/Girasol: FOB oficial del Ministerio de Agricultura. Otros cultivos: los actualizás vos según el mercado.</p></div></div>
        ${cultivos.length ? `
        <div class="table-scroll"><table class="data-table">
          <thead><tr><th>Cultivo</th><th>Precio (USD/ton)</th><th>Fuente</th><th>Actualizado</th><th></th></tr></thead>
          <tbody id="preciosTableBody">${cultivos.map(precioRowHTML).join('')}</tbody>
        </table></div>` : mutedNote('Todavía no hay cultivos registrados.')}
      </div>`;

    root.querySelectorAll('[data-edit-precio]').forEach((btn) => btn.addEventListener('click', () => openPrecioForm(btn.dataset.editPrecio)));
    document.getElementById('preciosRefreshBtn').addEventListener('click', () => {
      preciosOficialesPromise = null;
      UI.toast('Consultando la fuente oficial (MAGyP)…', 'info', 'Actualizando precios');
      fetchPreciosOficiales().then((precios) => {
        if (precios) {
          syncPreciosOficialesToDB(precios);
          UI.toast('Precios oficiales actualizados correctamente.', 'success', 'Listo');
        } else {
          UI.toast('No se pudo obtener el precio oficial en este momento. Probá de nuevo más tarde.', 'error', 'Sin datos');
        }
        refreshCurrentView();
      });
    });

    if (!skipSync) {
      fetchPreciosOficiales().then((precios) => {
        if (precios && state.route === 'precios') {
          syncPreciosOficialesToDB(precios);
          renderPrecios(root, true);
          updateNavCounts();
        }
      });
    }
  }

  function precioRowHTML(c) {
    const precio = DB.getPrecioByCultivo(c.id);
    const esOficial = precio && precio.fuente === 'MAGyP-FOB';
    return `<tr>
      <td class="cell-strong"><div class="cell-with-icon">${UI.icon('leaf', { size: 14 })}<span>${UI.escapeHTML(c.nombre)}</span></div></td>
      <td class="cell-num">${precio ? `US$ ${UI.formatNumber(precio.precioTon, 0)}` : '<span class="text-muted">Sin cargar</span>'}</td>
      <td>${precio ? (esOficial ? UI.badge('Oficial · MAGyP', 'success') : UI.badge('Manual', 'muted')) : '—'}</td>
      <td class="cell-muted">${precio ? UI.formatDate(precio.actualizado) : '—'}</td>
      <td class="cell-actions"><button class="btn btn--sm btn--secondary" data-edit-precio="${c.id}" type="button">${UI.icon('edit', { size: 13 })}<span>Actualizar</span></button></td>
    </tr>`;
  }

  function openPrecioForm(cultivoId) {
    const cultivo = DB.getById('cultivos', cultivoId);
    if (!cultivo) return;
    const precio = DB.getPrecioByCultivo(cultivoId);
    UI.openModal({
      title: `Precio de ${cultivo.nombre}`,
      subtitle: 'Precio de referencia en dólares por tonelada',
      size: 'sm',
      bodyHTML: `
        <form id="precioForm" class="form-grid" novalidate>
          <div class="form-group form-group--full">
            <label for="pf-precio">Precio (USD/ton) <span class="req">*</span></label>
            <input class="form-control" id="pf-precio" name="precioTon" type="number" min="0" step="0.5" value="${precio ? precio.precioTon : ''}">
            <span class="form-error"></span>
          </div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="precioForm">Guardar</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#precioForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const precioTon = validateNumber(e.target, 'precioTon', { min: 0 });
          if (precioTon === null) return;
          DB.upsertPrecio(cultivoId, { precioTon, moneda: 'USD', actualizado: todayISO(), fuente: 'Manual' });
          UI.toast(`Precio de ${cultivo.nombre} actualizado.`, 'success', 'Precio actualizado');
          UI.closeModal();
          refreshCurrentView();
        });
      },
    });
  }

  /* ============================================================
     GANADERÍA — utilidades compartidas
     ============================================================ */

  const MOVIMIENTO_VARIANT = { Nacimiento: 'success', Compra: 'info', Venta: 'warning', Traslado: 'neutral', Muerte: 'danger', Consumo: 'muted' };
  const MOVIMIENTO_ICON = { Nacimiento: 'heart', Compra: 'upRight', Venta: 'downRight', Traslado: 'swap', Muerte: 'alert', Consumo: 'basket' };
  const MOVIMIENTO_COLOR = { Nacimiento: 'var(--success)', Compra: 'var(--accent-blue)', Venta: 'var(--warning)', Traslado: 'var(--text-muted)', Muerte: 'var(--danger)', Consumo: 'var(--text-muted)' };

  function haciendaStock() {
    const stock = {};
    function add(categoriaId, loteId, delta) {
      if (!loteId) return;
      const key = `${categoriaId}|${loteId}`;
      stock[key] = (stock[key] || 0) + delta;
    }
    DB.getAll('movimientosHacienda').forEach((m) => {
      if (m.tipo === 'Nacimiento' || m.tipo === 'Compra') {
        add(m.categoriaId, m.loteId, m.cantidad);
      } else if (m.tipo === 'Venta' || m.tipo === 'Muerte' || m.tipo === 'Consumo') {
        add(m.categoriaId, m.loteId, -m.cantidad);
      } else if (m.tipo === 'Traslado') {
        add(m.categoriaId, m.loteId, -m.cantidad);
        add(m.categoriaId, m.loteDestinoId, m.cantidad);
      }
    });
    return stock;
  }

  function haciendaStockPorCategoria() {
    const totals = {};
    Object.entries(haciendaStock()).forEach(([key, cantidad]) => {
      const categoriaId = key.split('|')[0];
      totals[categoriaId] = (totals[categoriaId] || 0) + cantidad;
    });
    return totals;
  }

  function haciendaStockPorLote(stockDetalle) {
    const totals = {};
    Object.entries(stockDetalle).forEach(([key, cantidad]) => {
      const loteId = key.split('|')[1];
      totals[loteId] = (totals[loteId] || 0) + cantidad;
    });
    return totals;
  }

  function movimientoActivityHTML(m) {
    const detalle = m.tipo === 'Traslado'
      ? `${UI.escapeHTML(loteName(m.loteId))} → ${UI.escapeHTML(loteName(m.loteDestinoId))}`
      : UI.escapeHTML(loteName(m.loteId));
    return `<div class="activity-item"><span class="activity-item__dot" style="background:${MOVIMIENTO_COLOR[m.tipo]}"></span><div class="activity-item__body"><p><b>${m.tipo}</b> · ${m.cantidad} ${UI.escapeHTML(categoriaName(m.categoriaId))} · ${detalle}</p><span>${UI.formatDate(m.fecha)} · ${UI.timeAgo(m.fecha)}</span></div></div>`;
  }

  /* ============================================================
     HACIENDA (resumen)
     ============================================================ */

  function renderHacienda(root) {
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes');
    const stockDetalle = haciendaStock();
    const stockPorCategoria = haciendaStockPorCategoria();
    const stockPorLote = haciendaStockPorLote(stockDetalle);
    const totalCabezas = Object.values(stockPorCategoria).reduce((s, v) => s + v, 0);
    const categoriasConStock = categorias.filter((c) => (stockPorCategoria[c.id] || 0) > 0).sort((a, b) => stockPorCategoria[b.id] - stockPorCategoria[a.id]);
    const lotesConHacienda = lotes.filter((l) => (stockPorLote[l.id] || 0) > 0).sort((a, b) => stockPorLote[b.id] - stockPorLote[a.id]);
    const maxCategoria = Math.max(1, ...categoriasConStock.map((c) => stockPorCategoria[c.id]));
    const movimientosRecientes = DB.getAll('movimientosHacienda').sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 6);
    const sanidadReciente = DB.getAll('sanidadAnimal').filter((s) => new Date(s.fecha) > Date.now()).length;

    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Hacienda</h2><p>Stock actual del rodeo, calculado a partir de los movimientos registrados</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addMovimientoBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo movimiento</span></button></div>
      </div>
      <div class="stat-grid" style="margin-bottom:18px">
        <div class="stat-card">
          <div class="stat-card__top"><span class="stat-card__icon stat-card__icon--green">${UI.icon('cow', { size: 18 })}</span></div>
          <div class="stat-card__value">${UI.formatNumber(totalCabezas)}</div>
          <div class="stat-card__label">Cabezas totales</div>
          <div class="stat-card__sub">${categoriasConStock.length} categoría(s) con stock</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><span class="stat-card__icon stat-card__icon--blue">${UI.icon('layers', { size: 18 })}</span></div>
          <div class="stat-card__value">${lotesConHacienda.length}</div>
          <div class="stat-card__label">Lotes con hacienda</div>
          <div class="stat-card__sub">de ${lotes.length} lote(s) totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><span class="stat-card__icon stat-card__icon--amber">${UI.icon('cross', { size: 18 })}</span></div>
          <div class="stat-card__value">${DB.count('sanidadAnimal')}</div>
          <div class="stat-card__label">Registros sanitarios</div>
          <div class="stat-card__sub">${sanidadReciente ? `${sanidadReciente} programado(s)` : 'Historial completo'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__top"><span class="stat-card__icon stat-card__icon--sand">${UI.icon('heart', { size: 18 })}</span></div>
          <div class="stat-card__value">${DB.count('reproduccion')}</div>
          <div class="stat-card__label">Eventos reproductivos</div>
          <div class="stat-card__sub">Servicios, tactos y partos</div>
        </div>
      </div>
      <div class="dash-grid">
        <div class="dash-col">
          <div class="panel">
            <div class="panel__header"><div><h3>Composición del rodeo</h3><p>Cabezas por categoría</p></div></div>
            ${categoriasConStock.length ? categoriasConStock.map((c) => barRowHTML(c.nombre, stockPorCategoria[c.id], maxCategoria)).join('') : mutedNote('Todavía no hay hacienda registrada. Agregá un movimiento de compra o nacimiento.')}
          </div>
          <div class="panel">
            <div class="panel__header"><div><h3>Movimientos recientes</h3><p></p></div><a class="panel__link" href="#/movimientos">Ver todos${UI.icon('chevronRight', { size: 12 })}</a></div>
            ${movimientosRecientes.length ? `<div class="activity-list">${movimientosRecientes.map(movimientoActivityHTML).join('')}</div>` : mutedNote('Sin movimientos registrados todavía.')}
          </div>
        </div>
        <div class="dash-col">
          <div class="panel">
            <div class="panel__header"><div><h3>Hacienda por lote</h3></div></div>
            ${lotesConHacienda.length ? `<div class="mini-list">${lotesConHacienda.map((l) => `<div class="mini-list__row"><span>${UI.escapeHTML(l.nombre)}</span><b>${UI.formatNumber(stockPorLote[l.id])} cab.</b></div>`).join('')}</div>` : mutedNote('Sin hacienda asignada a lotes.')}
          </div>
          <div class="panel">
            <div class="panel__header"><div><h3>Categorías</h3><p>Catálogo de categorías de hacienda</p></div></div>
            <div class="mini-list">${categorias.map((c) => `<div class="mini-list__row"><span>${UI.escapeHTML(c.nombre)}</span><b>${UI.formatNumber(stockPorCategoria[c.id] || 0)}</b></div>`).join('')}</div>
          </div>
        </div>
      </div>`;

    document.getElementById('addMovimientoBtn').addEventListener('click', () => openMovimientoForm());
  }

  /* ============================================================
     MOVIMIENTOS DE HACIENDA
     ============================================================ */

  function renderMovimientos(root) {
    const f = state.filters.movimientos;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Movimientos de hacienda</h2><p>${DB.count('movimientosHacienda')} movimiento(s) registrados</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addMovimientoBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo movimiento</span></button></div>
      </div>
      <div class="toolbar">
        <select id="movTipoFilter"><option value="">Todos los tipos</option>${enumOptions(DB.ENUMS.tiposMovimientoHacienda, f.tipo)}</select>
        <select id="movCategoriaFilter"><option value="">Todas las categorías</option>${selectOptionsPlain(categorias, f.categoriaId)}</select>
        <select id="movLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <div class="toolbar__field"><input type="date" id="movDesde" value="${f.desde}" title="Desde"></div>
        <div class="toolbar__field"><input type="date" id="movHasta" value="${f.hasta}" title="Hasta"></div>
        <button class="toolbar__reset" id="movResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="movResultCount"></span>
      </div>
      <div id="movResults"></div>`;

    document.getElementById('addMovimientoBtn').addEventListener('click', () => openMovimientoForm());
    document.getElementById('movTipoFilter').addEventListener('change', (e) => { f.tipo = e.target.value; renderMovimientoResults(); });
    document.getElementById('movCategoriaFilter').addEventListener('change', (e) => { f.categoriaId = e.target.value; renderMovimientoResults(); });
    document.getElementById('movLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderMovimientoResults(); });
    document.getElementById('movDesde').addEventListener('change', (e) => { f.desde = e.target.value; renderMovimientoResults(); });
    document.getElementById('movHasta').addEventListener('change', (e) => { f.hasta = e.target.value; renderMovimientoResults(); });
    document.getElementById('movResetBtn').addEventListener('click', () => { Object.assign(f, { tipo: '', categoriaId: '', loteId: '', desde: '', hasta: '' }); renderMovimientos(root); });
    renderMovimientoResults();
  }

  function getFilteredMovimientos() {
    const f = state.filters.movimientos;
    return DB.getAll('movimientosHacienda')
      .filter((m) => !f.tipo || m.tipo === f.tipo)
      .filter((m) => !f.categoriaId || m.categoriaId === f.categoriaId)
      .filter((m) => !f.loteId || m.loteId === f.loteId || m.loteDestinoId === f.loteId)
      .filter((m) => !f.desde || m.fecha >= f.desde)
      .filter((m) => !f.hasta || m.fecha <= f.hasta)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function renderMovimientoResults() {
    const wrap = document.getElementById('movResults');
    const list = getFilteredMovimientos();
    document.getElementById('movResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'swap',
        title: DB.count('movimientosHacienda') ? 'Sin coincidencias' : 'Todavía no hay movimientos',
        message: DB.count('movimientosHacienda') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá compras, ventas, nacimientos o traslados de hacienda.',
        actionLabel: DB.count('movimientosHacienda') ? '' : 'Nuevo movimiento',
        actionAttr: 'id="emptyAddMov"',
      });
      const btn = document.getElementById('emptyAddMov');
      if (btn) btn.addEventListener('click', () => openMovimientoForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Cantidad</th><th>Lote</th><th>Peso / Precio</th><th></th></tr></thead>
        <tbody>${list.map(movimientoRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openMovimientoForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteMovimiento(btn.dataset.delete)));
  }

  function movimientoRowHTML(m) {
    const loteTxt = m.tipo === 'Traslado' ? `${loteName(m.loteId)} → ${loteName(m.loteDestinoId)}` : loteName(m.loteId);
    const pesoTxt = m.pesoPromedioKg ? `${UI.formatNumber(m.pesoPromedioKg, 0)} kg` : '';
    const precioTxt = m.precioPorKg ? `US$ ${UI.formatNumber(m.precioPorKg, 2)}/kg` : '';
    return `<tr data-id="${m.id}">
      <td class="cell-muted">${UI.formatDate(m.fecha)}</td>
      <td><div class="cell-with-icon">${UI.icon(MOVIMIENTO_ICON[m.tipo], { size: 13 })}${UI.badge(m.tipo, MOVIMIENTO_VARIANT[m.tipo])}</div></td>
      <td class="cell-strong">${UI.escapeHTML(categoriaName(m.categoriaId))}</td>
      <td class="cell-num">${UI.formatNumber(m.cantidad)}</td>
      <td class="cell-muted">${UI.escapeHTML(loteTxt)}</td>
      <td class="cell-num">${[pesoTxt, precioTxt].filter(Boolean).join(' · ') || '—'}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${m.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${m.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openMovimientoForm(id) {
    const editing = id ? DB.getById('movimientosHacienda', id) : null;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar movimiento' : 'Nuevo movimiento',
      subtitle: editing ? `${editing.tipo} · ${categoriaName(editing.categoriaId)}` : 'Registrá un alta, baja o traslado de hacienda',
      size: 'lg',
      bodyHTML: `
        <form id="movForm" class="form-grid" novalidate>
          <div class="form-group"><label for="mf-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="mf-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="mf-tipo">Tipo <span class="req">*</span></label><select class="form-control" id="mf-tipo" name="tipo"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.tiposMovimientoHacienda, editing ? editing.tipo : '')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="mf-categoria">Categoría <span class="req">*</span></label><select class="form-control" id="mf-categoria" name="categoriaId">${loteCultivoOptions(categorias, editing ? editing.categoriaId : '', 'Seleccionar categoría…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="mf-cantidad">Cantidad (cabezas) <span class="req">*</span></label><input class="form-control" type="number" min="1" step="1" id="mf-cantidad" name="cantidad" value="${editing ? editing.cantidad : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="mf-lote">Lote <span class="req">*</span></label><select class="form-control" id="mf-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group" id="mf-destino-group"><label for="mf-destino">Lote destino <span class="req">*</span></label><select class="form-control" id="mf-destino" name="loteDestinoId">${loteCultivoOptions(lotes, editing ? editing.loteDestinoId : '', 'Seleccionar lote destino…')}</select><span class="form-error"></span></div>
          <div class="form-group" id="mf-peso-group"><label for="mf-peso">Peso promedio (kg)</label><input class="form-control" type="number" min="0" step="1" id="mf-peso" name="pesoPromedioKg" value="${editing && editing.pesoPromedioKg != null ? editing.pesoPromedioKg : ''}"></div>
          <div class="form-group" id="mf-precio-group"><label for="mf-precio">Precio por kg (USD)</label><input class="form-control" type="number" min="0" step="0.01" id="mf-precio" name="precioPorKg" value="${editing && editing.precioPorKg != null ? editing.precioPorKg : ''}"></div>
          <div class="form-group form-group--full" id="mf-contraparte-group"><label for="mf-contraparte">Comprador / Vendedor</label><input class="form-control" id="mf-contraparte" name="contraparte" placeholder="Nombre o empresa (opcional)" value="${editing ? UI.escapeHTML(editing.contraparte || '') : ''}"></div>
          <div class="form-group form-group--full"><label for="mf-observaciones">Observaciones</label><textarea class="form-control" id="mf-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="movForm">${editing ? 'Guardar cambios' : 'Crear movimiento'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#movForm').addEventListener('submit', (e) => { e.preventDefault(); submitMovimientoForm(e.target, editing); });
        const tipoSel = mroot.querySelector('#mf-tipo');
        const destinoGroup = mroot.querySelector('#mf-destino-group');
        const pesoGroup = mroot.querySelector('#mf-peso-group');
        const precioGroup = mroot.querySelector('#mf-precio-group');
        const contraparteGroup = mroot.querySelector('#mf-contraparte-group');
        function updateVisibility() {
          const tipo = tipoSel.value;
          destinoGroup.style.display = tipo === 'Traslado' ? '' : 'none';
          const esComercial = tipo === 'Compra' || tipo === 'Venta';
          pesoGroup.style.display = esComercial ? '' : 'none';
          precioGroup.style.display = esComercial ? '' : 'none';
          contraparteGroup.style.display = esComercial ? '' : 'none';
        }
        updateVisibility();
        tipoSel.addEventListener('change', updateVisibility);
      },
    });
  }

  function submitMovimientoForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const tipo = validateRequired(form, 'tipo', 'Seleccioná un tipo');
    const categoriaId = validateRequired(form, 'categoriaId', 'Seleccioná una categoría');
    const cantidad = validateNumber(form, 'cantidad', { min: 1 });
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const loteDestinoIdRaw = form.querySelector('[name="loteDestinoId"]').value || null;
    const pesoRaw = form.querySelector('[name="pesoPromedioKg"]').value.trim();
    const precioRaw = form.querySelector('[name="precioPorKg"]').value.trim();
    const contraparte = form.querySelector('[name="contraparte"]').value.trim();
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!fecha || !tipo || !categoriaId || cantidad === null || !loteId) return;
    let loteDestinoId = null;
    if (tipo === 'Traslado') {
      if (!loteDestinoIdRaw) { setFieldError(form, 'loteDestinoId', 'Seleccioná el lote destino'); return; }
      if (loteDestinoIdRaw === loteId) { setFieldError(form, 'loteDestinoId', 'El destino debe ser distinto al lote de origen'); return; }
      clearFieldErrorFor(form, 'loteDestinoId');
      loteDestinoId = loteDestinoIdRaw;
    }
    const payload = {
      fecha, tipo, categoriaId, cantidad, loteId, loteDestinoId,
      pesoPromedioKg: pesoRaw ? Number(pesoRaw) : null,
      precioPorKg: precioRaw ? Number(precioRaw) : null,
      contraparte, observaciones,
    };
    if (editing) {
      DB.update('movimientosHacienda', editing.id, payload);
      UI.toast('El movimiento se actualizó correctamente.', 'success', 'Movimiento actualizado');
    } else {
      DB.create('movimientosHacienda', 'mov', payload);
      UI.toast('El movimiento se registró correctamente.', 'success', 'Movimiento creado');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteMovimiento(id) {
    const m = DB.getById('movimientosHacienda', id);
    if (!m) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar movimiento', message: `Se eliminará este movimiento de <strong>${UI.escapeHTML(m.tipo)}</strong> (${m.cantidad} ${UI.escapeHTML(categoriaName(m.categoriaId))}). Esta acción no se puede deshacer y afectará el stock calculado.`, confirmLabel: 'Eliminar movimiento', tone: 'danger' });
    if (!ok) return;
    DB.remove('movimientosHacienda', id);
    UI.toast('El movimiento fue eliminado.', 'success', 'Movimiento eliminado');
    refreshCurrentView();
  }

  /* ============================================================
     SANIDAD ANIMAL
     ============================================================ */

  function renderSanidad(root) {
    const f = state.filters.sanidad;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Sanidad animal</h2><p>${DB.count('sanidadAnimal')} registro(s) sanitarios</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addSanidadBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo registro</span></button></div>
      </div>
      <div class="toolbar">
        <select id="sanTipoFilter"><option value="">Todos los tipos</option>${enumOptions(DB.ENUMS.tiposSanidadAnimal, f.tipo)}</select>
        <select id="sanCategoriaFilter"><option value="">Todas las categorías</option>${selectOptionsPlain(categorias, f.categoriaId)}</select>
        <select id="sanLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <div class="toolbar__field"><input type="date" id="sanDesde" value="${f.desde}" title="Desde"></div>
        <div class="toolbar__field"><input type="date" id="sanHasta" value="${f.hasta}" title="Hasta"></div>
        <button class="toolbar__reset" id="sanResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="sanResultCount"></span>
      </div>
      <div id="sanResults"></div>`;
    document.getElementById('addSanidadBtn').addEventListener('click', () => openSanidadForm());
    document.getElementById('sanTipoFilter').addEventListener('change', (e) => { f.tipo = e.target.value; renderSanidadResults(); });
    document.getElementById('sanCategoriaFilter').addEventListener('change', (e) => { f.categoriaId = e.target.value; renderSanidadResults(); });
    document.getElementById('sanLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderSanidadResults(); });
    document.getElementById('sanDesde').addEventListener('change', (e) => { f.desde = e.target.value; renderSanidadResults(); });
    document.getElementById('sanHasta').addEventListener('change', (e) => { f.hasta = e.target.value; renderSanidadResults(); });
    document.getElementById('sanResetBtn').addEventListener('click', () => { Object.assign(f, { tipo: '', categoriaId: '', loteId: '', desde: '', hasta: '' }); renderSanidad(root); });
    renderSanidadResults();
  }

  function getFilteredSanidad() {
    const f = state.filters.sanidad;
    return DB.getAll('sanidadAnimal')
      .filter((s) => !f.tipo || s.tipo === f.tipo)
      .filter((s) => !f.categoriaId || s.categoriaId === f.categoriaId)
      .filter((s) => !f.loteId || s.loteId === f.loteId)
      .filter((s) => !f.desde || s.fecha >= f.desde)
      .filter((s) => !f.hasta || s.fecha <= f.hasta)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function renderSanidadResults() {
    const wrap = document.getElementById('sanResults');
    const list = getFilteredSanidad();
    document.getElementById('sanResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'cross',
        title: DB.count('sanidadAnimal') ? 'Sin coincidencias' : 'Todavía no hay registros sanitarios',
        message: DB.count('sanidadAnimal') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá vacunaciones, desparasitaciones y tratamientos.',
        actionLabel: DB.count('sanidadAnimal') ? '' : 'Nuevo registro',
        actionAttr: 'id="emptyAddSan"',
      });
      const btn = document.getElementById('emptyAddSan');
      if (btn) btn.addEventListener('click', () => openSanidadForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Lote</th><th>Cant.</th><th>Producto</th><th>Aplicador</th><th></th></tr></thead>
        <tbody>${list.map(sanidadRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openSanidadForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteSanidad(btn.dataset.delete)));
  }

  function sanidadRowHTML(s) {
    return `<tr data-id="${s.id}">
      <td class="cell-muted">${UI.formatDate(s.fecha)}</td>
      <td>${UI.badge(s.tipo, 'info')}</td>
      <td class="cell-strong">${UI.escapeHTML(categoriaName(s.categoriaId))}</td>
      <td class="cell-muted">${UI.escapeHTML(loteName(s.loteId))}</td>
      <td class="cell-num">${UI.formatNumber(s.cantidadAnimales)}</td>
      <td>${UI.escapeHTML(s.producto)}</td>
      <td class="cell-muted">${UI.escapeHTML(s.aplicador)}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${s.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${s.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openSanidadForm(id) {
    const editing = id ? DB.getById('sanidadAnimal', id) : null;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar registro sanitario' : 'Nuevo registro sanitario',
      subtitle: editing ? `${editing.tipo} · ${categoriaName(editing.categoriaId)}` : 'Registrá una vacunación, desparasitación o tratamiento',
      size: 'lg',
      bodyHTML: `
        <form id="sanForm" class="form-grid" novalidate>
          <div class="form-group"><label for="sf-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="sf-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-tipo">Tipo <span class="req">*</span></label><select class="form-control" id="sf-tipo" name="tipo"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.tiposSanidadAnimal, editing ? editing.tipo : '')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-categoria">Categoría <span class="req">*</span></label><select class="form-control" id="sf-categoria" name="categoriaId">${loteCultivoOptions(categorias, editing ? editing.categoriaId : '', 'Seleccionar categoría…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-lote">Lote <span class="req">*</span></label><select class="form-control" id="sf-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-cantidad">Cantidad de animales <span class="req">*</span></label><input class="form-control" type="number" min="1" step="1" id="sf-cantidad" name="cantidadAnimales" value="${editing ? editing.cantidadAnimales : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-producto">Producto <span class="req">*</span></label><input class="form-control" id="sf-producto" name="producto" placeholder="Ej: Vacuna antiaftosa" value="${editing ? UI.escapeHTML(editing.producto) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-dosis">Dosis <span class="req">*</span></label><input class="form-control" id="sf-dosis" name="dosis" placeholder="Ej: 5 ml/animal" value="${editing ? UI.escapeHTML(editing.dosis) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-aplicador">Aplicador <span class="req">*</span></label><input class="form-control" id="sf-aplicador" name="aplicador" placeholder="Veterinario o encargado" value="${editing ? UI.escapeHTML(editing.aplicador) : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="sf-insumo">Insumo utilizado <span style="font-weight:400;color:var(--text-muted)">(opcional)</span></label><select class="form-control" id="sf-insumo" name="insumoId"><option value="">Sin vincular a stock</option>${DB.getAll('insumos').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((i) => `<option value="${i.id}" ${editing && editing.insumoId === i.id ? 'selected' : ''}>${UI.escapeHTML(i.nombre)} (${UI.formatNumber(i.stockActual, 1)} ${i.unidad} disp.)</option>`).join('')}</select></div>
          <div class="form-group"><label for="sf-cantidadUsada">Cantidad usada</label><input class="form-control" id="sf-cantidadUsada" name="cantidadUsada" type="number" min="0" step="0.1" value="${editing && editing.cantidadUsada != null ? editing.cantidadUsada : ''}"><span class="form-hint" id="sf-stock-hint"></span></div>
          <div class="form-group form-group--full"><label for="sf-observaciones">Observaciones</label><textarea class="form-control" id="sf-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="sanForm">${editing ? 'Guardar cambios' : 'Crear registro'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#sanForm').addEventListener('submit', (e) => { e.preventDefault(); submitSanidadForm(e.target, editing); });
        const insumoSel = mroot.querySelector('#sf-insumo');
        const cantidadInput = mroot.querySelector('#sf-cantidadUsada');
        const stockHint = mroot.querySelector('#sf-stock-hint');
        function updateStockHint() {
          const insumo = DB.getById('insumos', insumoSel.value);
          if (!insumo) { stockHint.textContent = ''; return; }
          const cantidad = Number(cantidadInput.value) || 0;
          const yaReservado = (editing && editing.insumoId === insumo.id) ? Number(editing.cantidadUsada || 0) : 0;
          const disponible = Number(insumo.stockActual) + yaReservado;
          const restante = disponible - cantidad;
          stockHint.style.color = restante < 0 ? 'var(--danger)' : 'var(--text-muted)';
          stockHint.textContent = restante < 0
            ? `Stock insuficiente: hay ${UI.formatNumber(disponible, 1)} ${insumo.unidad} disponibles.`
            : `Quedarán ${UI.formatNumber(restante, 1)} ${insumo.unidad} en stock.`;
        }
        insumoSel.addEventListener('change', updateStockHint);
        cantidadInput.addEventListener('input', updateStockHint);
        updateStockHint();
      },
    });
  }

  function submitSanidadForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const tipo = validateRequired(form, 'tipo', 'Seleccioná un tipo');
    const categoriaId = validateRequired(form, 'categoriaId', 'Seleccioná una categoría');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const cantidadAnimales = validateNumber(form, 'cantidadAnimales', { min: 1 });
    const producto = validateRequired(form, 'producto', 'Ingresá el producto aplicado');
    const dosis = validateRequired(form, 'dosis', 'Ingresá la dosis aplicada');
    const aplicador = validateRequired(form, 'aplicador', 'Ingresá el aplicador');
    const insumoId = form.querySelector('[name="insumoId"]').value || null;
    const cantidadRaw = form.querySelector('[name="cantidadUsada"]').value.trim();
    const cantidadUsada = cantidadRaw ? Number(cantidadRaw) : null;
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!fecha || !tipo || !categoriaId || !loteId || cantidadAnimales === null || !producto || !dosis || !aplicador) return;
    if (insumoId && (cantidadUsada === null || cantidadUsada <= 0)) {
      UI.toast('Ingresá la cantidad utilizada del insumo seleccionado.', 'error', 'Cantidad requerida');
      return;
    }
    if (editing && editing.insumoId && editing.cantidadUsada) {
      DB.adjustInsumoStock(editing.insumoId, Number(editing.cantidadUsada));
    }
    if (insumoId && cantidadUsada) {
      DB.adjustInsumoStock(insumoId, -cantidadUsada);
    }
    const payload = { fecha, tipo, categoriaId, loteId, cantidadAnimales, producto, dosis, aplicador, insumoId, cantidadUsada, observaciones };
    if (editing) {
      DB.update('sanidadAnimal', editing.id, payload);
      UI.toast('El registro se actualizó correctamente.', 'success', 'Registro actualizado');
    } else {
      DB.create('sanidadAnimal', 'san', payload);
      UI.toast('El registro se guardó correctamente.', 'success', 'Registro creado');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteSanidad(id) {
    const s = DB.getById('sanidadAnimal', id);
    if (!s) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar registro sanitario', message: `Se eliminará el registro de <strong>${UI.escapeHTML(s.tipo)}</strong> (${UI.escapeHTML(s.producto)}). Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar registro', tone: 'danger' });
    if (!ok) return;
    if (s.insumoId && s.cantidadUsada) {
      DB.adjustInsumoStock(s.insumoId, Number(s.cantidadUsada));
    }
    DB.remove('sanidadAnimal', id);
    UI.toast('El registro fue eliminado.', 'success', 'Registro eliminado');
    refreshCurrentView();
  }

  /* ============================================================
     REPRODUCCIÓN
     ============================================================ */

  const REPRODUCCION_VARIANT = { 'Servicio': 'info', 'Diagnóstico de preñez': 'warning', 'Parto': 'success' };

  function renderReproduccion(root) {
    const f = state.filters.reproduccion;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Reproducción</h2><p>${DB.count('reproduccion')} evento(s) reproductivo(s)</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addReproBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nuevo evento</span></button></div>
      </div>
      <div class="toolbar">
        <select id="repTipoFilter"><option value="">Todos los tipos</option>${enumOptions(DB.ENUMS.tiposReproduccion, f.tipo)}</select>
        <select id="repCategoriaFilter"><option value="">Todas las categorías</option>${selectOptionsPlain(categorias, f.categoriaId)}</select>
        <select id="repLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <div class="toolbar__field"><input type="date" id="repDesde" value="${f.desde}" title="Desde"></div>
        <div class="toolbar__field"><input type="date" id="repHasta" value="${f.hasta}" title="Hasta"></div>
        <button class="toolbar__reset" id="repResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="repResultCount"></span>
      </div>
      <div id="repResults"></div>`;
    document.getElementById('addReproBtn').addEventListener('click', () => openReproduccionForm());
    document.getElementById('repTipoFilter').addEventListener('change', (e) => { f.tipo = e.target.value; renderReproduccionResults(); });
    document.getElementById('repCategoriaFilter').addEventListener('change', (e) => { f.categoriaId = e.target.value; renderReproduccionResults(); });
    document.getElementById('repLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderReproduccionResults(); });
    document.getElementById('repDesde').addEventListener('change', (e) => { f.desde = e.target.value; renderReproduccionResults(); });
    document.getElementById('repHasta').addEventListener('change', (e) => { f.hasta = e.target.value; renderReproduccionResults(); });
    document.getElementById('repResetBtn').addEventListener('click', () => { Object.assign(f, { tipo: '', categoriaId: '', loteId: '', desde: '', hasta: '' }); renderReproduccion(root); });
    renderReproduccionResults();
  }

  function getFilteredReproduccion() {
    const f = state.filters.reproduccion;
    return DB.getAll('reproduccion')
      .filter((r) => !f.tipo || r.tipo === f.tipo)
      .filter((r) => !f.categoriaId || r.categoriaId === f.categoriaId)
      .filter((r) => !f.loteId || r.loteId === f.loteId)
      .filter((r) => !f.desde || r.fecha >= f.desde)
      .filter((r) => !f.hasta || r.fecha <= f.hasta)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function renderReproduccionResults() {
    const wrap = document.getElementById('repResults');
    const list = getFilteredReproduccion();
    document.getElementById('repResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'heart',
        title: DB.count('reproduccion') ? 'Sin coincidencias' : 'Todavía no hay eventos',
        message: DB.count('reproduccion') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá servicios, diagnósticos de preñez y partos.',
        actionLabel: DB.count('reproduccion') ? '' : 'Nuevo evento',
        actionAttr: 'id="emptyAddRep"',
      });
      const btn = document.getElementById('emptyAddRep');
      if (btn) btn.addEventListener('click', () => openReproduccionForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Lote</th><th>Cantidad</th><th>Resultado</th><th></th></tr></thead>
        <tbody>${list.map(reproduccionRowHTML).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openReproduccionForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteReproduccion(btn.dataset.delete)));
  }

  function reproduccionRowHTML(r) {
    return `<tr data-id="${r.id}">
      <td class="cell-muted">${UI.formatDate(r.fecha)}</td>
      <td>${UI.badge(r.tipo, REPRODUCCION_VARIANT[r.tipo] || 'neutral')}</td>
      <td class="cell-strong">${UI.escapeHTML(categoriaName(r.categoriaId))}</td>
      <td class="cell-muted">${UI.escapeHTML(loteName(r.loteId))}</td>
      <td class="cell-num">${UI.formatNumber(r.cantidad)}</td>
      <td class="cell-muted">${r.resultado ? UI.escapeHTML(r.resultado) : '—'}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${r.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${r.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openReproduccionForm(id) {
    const editing = id ? DB.getById('reproduccion', id) : null;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar evento reproductivo' : 'Nuevo evento reproductivo',
      subtitle: editing ? `${editing.tipo} · ${categoriaName(editing.categoriaId)}` : 'Registrá un servicio, diagnóstico de preñez o parto',
      size: 'lg',
      bodyHTML: `
        <form id="repForm" class="form-grid" novalidate>
          <div class="form-group"><label for="rf-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="rf-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="rf-tipo">Tipo <span class="req">*</span></label><select class="form-control" id="rf-tipo" name="tipo"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.tiposReproduccion, editing ? editing.tipo : '')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="rf-categoria">Categoría <span class="req">*</span></label><select class="form-control" id="rf-categoria" name="categoriaId">${loteCultivoOptions(categorias, editing ? editing.categoriaId : '', 'Seleccionar categoría…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="rf-lote">Lote <span class="req">*</span></label><select class="form-control" id="rf-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="rf-cantidad">Cantidad de animales <span class="req">*</span></label><input class="form-control" type="number" min="1" step="1" id="rf-cantidad" name="cantidad" value="${editing ? editing.cantidad : ''}"><span class="form-error"></span></div>
          <div class="form-group" id="rf-metodo-group"><label for="rf-metodo">Método de servicio</label><select class="form-control" id="rf-metodo" name="metodoServicio"><option value="">Seleccionar…</option>${enumOptions(DB.ENUMS.metodosServicio, editing ? editing.metodoServicio : '')}</select></div>
          <div class="form-group form-group--full"><label for="rf-resultado">Resultado</label><input class="form-control" id="rf-resultado" name="resultado" placeholder="Ej: 36 preñadas (90%) o 12 terneros nacidos" value="${editing ? UI.escapeHTML(editing.resultado || '') : ''}"></div>
          <div class="form-group form-group--full"><label for="rf-observaciones">Observaciones</label><textarea class="form-control" id="rf-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="repForm">${editing ? 'Guardar cambios' : 'Crear evento'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#repForm').addEventListener('submit', (e) => { e.preventDefault(); submitReproduccionForm(e.target, editing); });
        const tipoSel = mroot.querySelector('#rf-tipo');
        const metodoGroup = mroot.querySelector('#rf-metodo-group');
        function updateVisibility() { metodoGroup.style.display = tipoSel.value === 'Servicio' ? '' : 'none'; }
        updateVisibility();
        tipoSel.addEventListener('change', updateVisibility);
      },
    });
  }

  function submitReproduccionForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const tipo = validateRequired(form, 'tipo', 'Seleccioná un tipo');
    const categoriaId = validateRequired(form, 'categoriaId', 'Seleccioná una categoría');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const cantidad = validateNumber(form, 'cantidad', { min: 1 });
    const metodoServicio = form.querySelector('[name="metodoServicio"]').value;
    const resultado = form.querySelector('[name="resultado"]').value.trim();
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!fecha || !tipo || !categoriaId || !loteId || cantidad === null) return;
    const payload = { fecha, tipo, categoriaId, loteId, cantidad, metodoServicio, resultado, observaciones };
    if (editing) {
      DB.update('reproduccion', editing.id, payload);
      UI.toast('El evento se actualizó correctamente.', 'success', 'Evento actualizado');
    } else {
      DB.create('reproduccion', 'rep', payload);
      UI.toast('El evento se registró correctamente.', 'success', 'Evento creado');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deleteReproduccion(id) {
    const r = DB.getById('reproduccion', id);
    if (!r) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar evento reproductivo', message: `Se eliminará este registro de <strong>${UI.escapeHTML(r.tipo)}</strong>. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar evento', tone: 'danger' });
    if (!ok) return;
    DB.remove('reproduccion', id);
    UI.toast('El evento fue eliminado.', 'success', 'Evento eliminado');
    refreshCurrentView();
  }

  /* ============================================================
     PESADAS
     ============================================================ */

  function renderPesadas(root) {
    const f = state.filters.pesadas;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    root.innerHTML = `
      <div class="view-header">
        <div class="view-header__text"><h2>Pesadas</h2><p>${DB.count('pesadas')} pesada(s) registradas</p></div>
        <div class="view-header__actions"><button class="btn btn--primary" id="addPesadaBtn" type="button">${UI.icon('plus', { size: 15 })}<span>Nueva pesada</span></button></div>
      </div>
      <div class="toolbar">
        <select id="pesCategoriaFilter"><option value="">Todas las categorías</option>${selectOptionsPlain(categorias, f.categoriaId)}</select>
        <select id="pesLoteFilter"><option value="">Todos los lotes</option>${selectOptionsPlain(lotes, f.loteId)}</select>
        <button class="toolbar__reset" id="pesResetBtn" type="button">${UI.icon('refresh', { size: 13 })}<span>Limpiar filtros</span></button>
        <span class="toolbar__count" id="pesResultCount"></span>
      </div>
      <div id="pesResults"></div>`;
    document.getElementById('addPesadaBtn').addEventListener('click', () => openPesadaForm());
    document.getElementById('pesCategoriaFilter').addEventListener('change', (e) => { f.categoriaId = e.target.value; renderPesadaResults(); });
    document.getElementById('pesLoteFilter').addEventListener('change', (e) => { f.loteId = e.target.value; renderPesadaResults(); });
    document.getElementById('pesResetBtn').addEventListener('click', () => { Object.assign(f, { categoriaId: '', loteId: '' }); renderPesadas(root); });
    renderPesadaResults();
  }

  function getFilteredPesadas() {
    const f = state.filters.pesadas;
    return DB.getAll('pesadas')
      .filter((p) => !f.categoriaId || p.categoriaId === f.categoriaId)
      .filter((p) => !f.loteId || p.loteId === f.loteId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function pesadaVariacionHTML(p, allPesadas) {
    const anteriores = allPesadas
      .filter((x) => x.id !== p.id && x.categoriaId === p.categoriaId && x.loteId === p.loteId && new Date(x.fecha) < new Date(p.fecha))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (!anteriores.length) return '<span class="text-muted">—</span>';
    const diff = p.pesoPromedioKg - anteriores[0].pesoPromedioKg;
    const variant = diff > 0 ? 'success' : diff < 0 ? 'danger' : 'muted';
    const sign = diff > 0 ? '+' : '';
    return UI.badge(`${sign}${UI.formatNumber(diff, 0)} kg`, variant);
  }

  function renderPesadaResults() {
    const wrap = document.getElementById('pesResults');
    const list = getFilteredPesadas();
    const allPesadas = DB.getAll('pesadas');
    document.getElementById('pesResultCount').textContent = `${list.length} resultado(s)`;
    if (!list.length) {
      wrap.innerHTML = UI.emptyState({
        iconName: 'trending',
        title: DB.count('pesadas') ? 'Sin coincidencias' : 'Todavía no hay pesadas',
        message: DB.count('pesadas') ? 'Probá ajustar los filtros de búsqueda.' : 'Registrá el peso promedio por categoría para seguir la evolución del rodeo.',
        actionLabel: DB.count('pesadas') ? '' : 'Nueva pesada',
        actionAttr: 'id="emptyAddPes"',
      });
      const btn = document.getElementById('emptyAddPes');
      if (btn) btn.addEventListener('click', () => openPesadaForm());
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap"><div class="table-scroll"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Categoría</th><th>Lote</th><th>Cant. animales</th><th>Peso promedio</th><th>Variación</th><th></th></tr></thead>
        <tbody>${list.map((p) => pesadaRowHTML(p, allPesadas)).join('')}</tbody>
      </table></div></div>`;
    wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openPesadaForm(btn.dataset.edit)));
    wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deletePesada(btn.dataset.delete)));
  }

  function pesadaRowHTML(p, allPesadas) {
    return `<tr data-id="${p.id}">
      <td class="cell-muted">${UI.formatDate(p.fecha)}</td>
      <td class="cell-strong">${UI.escapeHTML(categoriaName(p.categoriaId))}</td>
      <td class="cell-muted">${UI.escapeHTML(loteName(p.loteId))}</td>
      <td class="cell-num">${UI.formatNumber(p.cantidadAnimales)}</td>
      <td class="cell-num">${UI.formatNumber(p.pesoPromedioKg, 0)} kg</td>
      <td>${pesadaVariacionHTML(p, allPesadas)}</td>
      <td class="cell-actions">
        <button class="icon-btn" data-edit="${p.id}" type="button" aria-label="Editar">${UI.icon('edit', { size: 15 })}</button>
        <button class="icon-btn icon-btn--danger" data-delete="${p.id}" type="button" aria-label="Eliminar">${UI.icon('trash', { size: 15 })}</button>
      </td>
    </tr>`;
  }

  function openPesadaForm(id) {
    const editing = id ? DB.getById('pesadas', id) : null;
    const categorias = DB.getAll('categoriasHacienda').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const lotes = DB.getAll('lotes').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    UI.openModal({
      title: editing ? 'Editar pesada' : 'Nueva pesada',
      subtitle: editing ? `${categoriaName(editing.categoriaId)} · ${loteName(editing.loteId)}` : 'Registrá el peso promedio de una categoría',
      bodyHTML: `
        <form id="pesForm" class="form-grid" novalidate>
          <div class="form-group"><label for="pf-fecha">Fecha <span class="req">*</span></label><input class="form-control" type="date" id="pf-fecha" name="fecha" value="${editing ? editing.fecha : todayISO()}"><span class="form-error"></span></div>
          <div class="form-group"><label for="pf-categoria">Categoría <span class="req">*</span></label><select class="form-control" id="pf-categoria" name="categoriaId">${loteCultivoOptions(categorias, editing ? editing.categoriaId : '', 'Seleccionar categoría…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="pf-lote">Lote <span class="req">*</span></label><select class="form-control" id="pf-lote" name="loteId">${loteCultivoOptions(lotes, editing ? editing.loteId : '', 'Seleccionar lote…')}</select><span class="form-error"></span></div>
          <div class="form-group"><label for="pf-cantidad">Cantidad de animales <span class="req">*</span></label><input class="form-control" type="number" min="1" step="1" id="pf-cantidad" name="cantidadAnimales" value="${editing ? editing.cantidadAnimales : ''}"><span class="form-error"></span></div>
          <div class="form-group"><label for="pf-peso">Peso promedio (kg) <span class="req">*</span></label><input class="form-control" type="number" min="0" step="1" id="pf-peso" name="pesoPromedioKg" value="${editing ? editing.pesoPromedioKg : ''}"><span class="form-error"></span></div>
          <div class="form-group form-group--full"><label for="pf-observaciones">Observaciones</label><textarea class="form-control" id="pf-observaciones" name="observaciones" placeholder="Notas adicionales (opcional)">${editing ? UI.escapeHTML(editing.observaciones || '') : ''}</textarea></div>
        </form>`,
      footerHTML: `<button class="btn btn--ghost" type="button" data-act="cancel">Cancelar</button><button class="btn btn--primary" type="submit" form="pesForm">${editing ? 'Guardar cambios' : 'Crear pesada'}</button>`,
      onMount: (mroot) => {
        mroot.querySelector('[data-act="cancel"]').addEventListener('click', UI.closeModal);
        mroot.querySelector('#pesForm').addEventListener('submit', (e) => { e.preventDefault(); submitPesadaForm(e.target, editing); });
      },
    });
  }

  function submitPesadaForm(form, editing) {
    const fecha = validateRequired(form, 'fecha', 'Seleccioná una fecha');
    const categoriaId = validateRequired(form, 'categoriaId', 'Seleccioná una categoría');
    const loteId = validateRequired(form, 'loteId', 'Seleccioná un lote');
    const cantidadAnimales = validateNumber(form, 'cantidadAnimales', { min: 1 });
    const pesoPromedioKg = validateNumber(form, 'pesoPromedioKg', { min: 1 });
    const observaciones = form.querySelector('[name="observaciones"]').value.trim();
    if (!fecha || !categoriaId || !loteId || cantidadAnimales === null || pesoPromedioKg === null) return;
    const payload = { fecha, categoriaId, loteId, cantidadAnimales, pesoPromedioKg, observaciones };
    if (editing) {
      DB.update('pesadas', editing.id, payload);
      UI.toast('La pesada se actualizó correctamente.', 'success', 'Pesada actualizada');
    } else {
      DB.create('pesadas', 'pes', payload);
      UI.toast('La pesada se registró correctamente.', 'success', 'Pesada creada');
    }
    UI.closeModal();
    refreshCurrentView();
  }

  async function deletePesada(id) {
    const p = DB.getById('pesadas', id);
    if (!p) return;
    const ok = await UI.confirmDialog({ title: 'Eliminar pesada', message: `Se eliminará esta pesada de <strong>${UI.escapeHTML(categoriaName(p.categoriaId))}</strong>. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar pesada', tone: 'danger' });
    if (!ok) return;
    DB.remove('pesadas', id);
    UI.toast('La pesada fue eliminada.', 'success', 'Pesada eliminada');
    refreshCurrentView();
  }

})();
