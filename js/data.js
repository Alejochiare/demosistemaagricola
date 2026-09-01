/* ============================================================
   AgroGestión — Capa de datos
   Modelo de entidades, semilla de datos y persistencia local.
   ============================================================ */

const DB = (() => {

  const STORAGE_KEY = 'agrogestion.db.v1';
  const SCHEMA_VERSION = 1;

  const ENUMS = {
    estadosLote: ['Activo', 'En preparación', 'En descanso', 'Inactivo'],
    tiposCultivo: ['Cereal', 'Oleaginosa', 'Legumbre', 'Hortaliza', 'Forraje', 'Otro'],
    destinosSiembra: ['Consumo interno', 'Venta directa', 'Exportación', 'Reserva de semilla'],
    motivosFumigacion: ['Control de plagas', 'Control de malezas', 'Control de enfermedades', 'Tratamiento preventivo'],
    prioridadesNota: ['Alta', 'Media', 'Baja'],
    categoriasInsumo: ['Fertilizante', 'Fitosanitario', 'Semilla', 'Combustible', 'Sanidad animal', 'Otro'],
    unidadesInsumo: ['L', 'kg', 'ton', 'bolsa', 'dosis', 'unidad'],
    tiposMovimientoHacienda: ['Nacimiento', 'Compra', 'Venta', 'Traslado', 'Muerte', 'Consumo'],
    tiposSanidadAnimal: ['Vacunación', 'Desparasitación', 'Tratamiento', 'Otro'],
    tiposReproduccion: ['Servicio', 'Diagnóstico de preñez', 'Parto'],
    metodosServicio: ['Monta natural', 'Inseminación artificial'],
  };

  const DEFAULT_PRICES_BY_CULTIVO_NAME = {
    'Soja': 295, 'Maíz': 178, 'Trigo': 205, 'Girasol': 365, 'Alfalfa': 145,
  };

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function isoDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
  function isoDaysAhead(days) {
    return isoDaysAgo(-days);
  }

  /* ---------------- Semilla de datos ---------------- */

  function buildSeed() {
    const lotes = [
      { id: 'lot_a1', nombre: 'Lote Norte', tamano: 48.5, ubicacion: 'Sector Norte, camino rural 12', estado: 'Activo', observaciones: 'Suelo franco-arcilloso, buen drenaje natural.', lat: -33.870, lng: -60.575 },
      { id: 'lot_a2', nombre: 'Lote Sur', tamano: 62.0, ubicacion: 'Sector Sur, junto al canal principal', estado: 'Activo', observaciones: 'Riego por gravedad disponible todo el año.', lat: -33.905, lng: -60.560 },
      { id: 'lot_a3', nombre: 'Lote Este', tamano: 35.2, ubicacion: 'Sector Este, límite con Ruta 7', estado: 'En descanso', observaciones: 'En rotación, previsto para siembra en la próxima campaña.', lat: -33.880, lng: -60.540 },
      { id: 'lot_a4', nombre: 'Lote Oeste', tamano: 51.8, ubicacion: 'Sector Oeste, cercano al monte natural', estado: 'Activo', observaciones: '', lat: -33.885, lng: -60.605 },
      { id: 'lot_a5', nombre: 'Lote La Loma', tamano: 27.4, ubicacion: 'Zona elevada, acceso por camino de tierra', estado: 'En preparación', observaciones: 'Requiere nivelación previa a la siembra.', lat: -33.860, lng: -60.585 },
      { id: 'lot_a6', nombre: 'Lote El Bajo', tamano: 40.0, ubicacion: 'Zona baja, próxima al arroyo', estado: 'Inactivo', observaciones: 'Anegado por lluvias, en evaluación de drenaje.', lat: null, lng: null },
    ];

    const cultivos = [
      { id: 'cul_c1', nombre: 'Soja', tipo: 'Oleaginosa', descripcion: 'Variedad de ciclo corto, resistente a sequía moderada.' },
      { id: 'cul_c2', nombre: 'Maíz', tipo: 'Cereal', descripcion: 'Híbrido de alto rendimiento para grano comercial.' },
      { id: 'cul_c3', nombre: 'Trigo', tipo: 'Cereal', descripcion: 'Ciclo invernal, destinado a molienda.' },
      { id: 'cul_c4', nombre: 'Girasol', tipo: 'Oleaginosa', descripcion: '' },
      { id: 'cul_c5', nombre: 'Alfalfa', tipo: 'Forraje', descripcion: 'Pastura perenne para reserva forrajera.' },
    ];

    const siembras = [
      { id: 'sie_s1', fecha: isoDaysAgo(120), loteId: 'lot_a1', cultivoId: 'cul_c1', produccionEstimada: 165, cantidadSemillas: 2200, superficieSembrada: 48.5, destino: 'Venta directa', observaciones: 'Siembra directa sobre rastrojo de trigo.' },
      { id: 'sie_s2', fecha: isoDaysAgo(95), loteId: 'lot_a2', cultivoId: 'cul_c2', produccionEstimada: 520, cantidadSemillas: 1150, superficieSembrada: 62.0, destino: 'Venta directa', observaciones: '' },
      { id: 'sie_s3', fecha: isoDaysAgo(60), loteId: 'lot_a4', cultivoId: 'cul_c4', produccionEstimada: 88, cantidadSemillas: 260, superficieSembrada: 51.8, destino: 'Exportación', observaciones: 'Contrato de exportación firmado con comprador habitual.' },
      { id: 'sie_s4', fecha: isoDaysAhead(10), loteId: 'lot_a5', cultivoId: 'cul_c3', produccionEstimada: 210, cantidadSemillas: 3200, superficieSembrada: 27.4, destino: 'Consumo interno', observaciones: 'Programada, sujeta a condición de humedad del suelo.' },
      { id: 'sie_s5', fecha: isoDaysAgo(200), loteId: 'lot_a3', cultivoId: 'cul_c5', produccionEstimada: 140, cantidadSemillas: 620, superficieSembrada: 35.2, destino: 'Reserva de semilla', observaciones: 'Pastura de tres años, tercer corte previsto.' },
    ];

    const fumigaciones = [
      { id: 'fum_f1', fecha: isoDaysAgo(80), loteId: 'lot_a1', producto: 'Glifosato 48%', dosis: '3 L/ha', aplicador: 'Marcos Ibáñez', motivo: 'Control de malezas', observaciones: 'Aplicación previa a emergencia.', insumoId: 'ins_i1', cantidadUsada: 145.5 },
      { id: 'fum_f2', fecha: isoDaysAgo(45), loteId: 'lot_a2', producto: 'Cipermetrina 25%', dosis: '200 mL/ha', aplicador: 'Equipo Fumiagro S.R.L.', motivo: 'Control de plagas', observaciones: 'Presencia de isoca detectada en monitoreo.', insumoId: 'ins_i2', cantidadUsada: 12.4 },
      { id: 'fum_f3', fecha: isoDaysAgo(20), loteId: 'lot_a4', producto: 'Azoxistrobina', dosis: '0.5 L/ha', aplicador: 'Marcos Ibáñez', motivo: 'Control de enfermedades', observaciones: '', insumoId: 'ins_i3', cantidadUsada: 25.9 },
      { id: 'fum_f4', fecha: isoDaysAgo(8), loteId: 'lot_a1', producto: 'Fertilizante foliar NPK', dosis: '4 L/ha', aplicador: 'Lucía Fernández', motivo: 'Tratamiento preventivo', observaciones: 'Refuerzo nutricional en etapa de floración.', insumoId: 'ins_i4', cantidadUsada: 194 },
      { id: 'fum_f5', fecha: isoDaysAhead(5), loteId: 'lot_a5', producto: 'Fungicida cúprico', dosis: '2.5 kg/ha', aplicador: 'Equipo Fumiagro S.R.L.', motivo: 'Tratamiento preventivo', observaciones: 'Aplicación programada previo a la siembra de trigo.', insumoId: 'ins_i5', cantidadUsada: 68.5 },
    ];

    const cosechas = [
      { id: 'cos_h1', fecha: isoDaysAgo(210), loteId: 'lot_a3', cultivoId: 'cul_c5', produccionReal: 132, siembraId: 'sie_s5', observaciones: 'Corte de alfalfa, rendimiento levemente inferior al estimado.' },
      { id: 'cos_h2', fecha: isoDaysAgo(15), loteId: 'lot_a1', cultivoId: 'cul_c1', produccionReal: 158, siembraId: 'sie_s1', observaciones: 'Buen rendimiento pese a estrés hídrico en enero.' },
    ];

    const insumos = [
      { id: 'ins_i1', nombre: 'Glifosato 48%', categoria: 'Fitosanitario', unidad: 'L', stockActual: 180, stockMinimo: 100, costoUnitario: 3.2, proveedor: 'Agroinsumos del Centro', observaciones: '' },
      { id: 'ins_i2', nombre: 'Cipermetrina 25%', categoria: 'Fitosanitario', unidad: 'L', stockActual: 8, stockMinimo: 15, costoUnitario: 9.5, proveedor: 'Fumiagro S.R.L.', observaciones: 'Reponer antes de la próxima campaña de maíz.' },
      { id: 'ins_i3', nombre: 'Azoxistrobina', categoria: 'Fitosanitario', unidad: 'L', stockActual: 40, stockMinimo: 20, costoUnitario: 22, proveedor: 'AgroQuímica Pergamino', observaciones: '' },
      { id: 'ins_i4', nombre: 'Fertilizante foliar NPK', categoria: 'Fertilizante', unidad: 'L', stockActual: 60, stockMinimo: 50, costoUnitario: 4.1, proveedor: 'NutriCampo', observaciones: '' },
      { id: 'ins_i5', nombre: 'Fungicida cúprico', categoria: 'Fitosanitario', unidad: 'kg', stockActual: 25, stockMinimo: 30, costoUnitario: 6.8, proveedor: 'Fumiagro S.R.L.', observaciones: 'Stock ajustado por aplicación programada.' },
      { id: 'ins_i6', nombre: 'Semilla de Soja DM 53i54', categoria: 'Semilla', unidad: 'bolsa', stockActual: 12, stockMinimo: 10, costoUnitario: 65, proveedor: 'Don Mario Semillas', observaciones: '' },
      { id: 'ins_i7', nombre: 'Gasoil', categoria: 'Combustible', unidad: 'L', stockActual: 1200, stockMinimo: 500, costoUnitario: 0.95, proveedor: 'YPF Agro', observaciones: '' },
      { id: 'ins_i8', nombre: 'Vacuna antiaftosa', categoria: 'Sanidad animal', unidad: 'dosis', stockActual: 150, stockMinimo: 100, costoUnitario: 1.2, proveedor: 'Laboratorio Biogénesis', observaciones: 'Campaña obligatoria SENASA.' },
      { id: 'ins_i9', nombre: 'Ivermectina 1%', categoria: 'Sanidad animal', unidad: 'L', stockActual: 5, stockMinimo: 8, costoUnitario: 18, proveedor: 'AgroVet Pergamino', observaciones: 'Reponer para la próxima desparasitación.' },
    ];

    const precios = [
      { id: 'pre_p1', cultivoId: 'cul_c1', precioTon: 295, moneda: 'USD', actualizado: isoDaysAgo(2), fuente: 'Manual' },
      { id: 'pre_p2', cultivoId: 'cul_c2', precioTon: 178, moneda: 'USD', actualizado: isoDaysAgo(2), fuente: 'Manual' },
      { id: 'pre_p3', cultivoId: 'cul_c3', precioTon: 205, moneda: 'USD', actualizado: isoDaysAgo(6), fuente: 'Manual' },
      { id: 'pre_p4', cultivoId: 'cul_c4', precioTon: 365, moneda: 'USD', actualizado: isoDaysAgo(6), fuente: 'Manual' },
      { id: 'pre_p5', cultivoId: 'cul_c5', precioTon: 145, moneda: 'USD', actualizado: isoDaysAgo(15), fuente: 'Manual' },
    ];

    const notas = [
      { id: 'not_n1', loteId: 'lot_a1', titulo: 'Revisar cerco perimetral', descripcion: 'Se detectaron dos tramos de alambrado dañados en el límite norte.', fecha: isoDaysAgo(5), prioridad: 'Alta', completada: false },
      { id: 'not_n2', loteId: 'lot_a2', titulo: 'Mantenimiento de compuertas de riego', descripcion: 'Coordinar con el encargado de riego el recambio de dos compuertas.', fecha: isoDaysAgo(2), prioridad: 'Media', completada: false },
      { id: 'not_n3', loteId: 'lot_a6', titulo: 'Evaluar drenaje', descripcion: 'Solicitar informe técnico sobre anegamiento recurrente.', fecha: isoDaysAgo(12), prioridad: 'Alta', completada: false },
      { id: 'not_n4', loteId: 'lot_a5', titulo: 'Análisis de suelo previo a siembra', descripcion: 'Tomar muestras compuestas para laboratorio antes de la siembra de trigo.', fecha: isoDaysAgo(1), prioridad: 'Media', completada: false },
      { id: 'not_n5', loteId: 'lot_a4', titulo: 'Capacitación en aplicación de fitosanitarios', descripcion: 'Jornada realizada con el equipo operativo sobre nuevas normas de seguridad.', fecha: isoDaysAgo(30), prioridad: 'Baja', completada: true },
    ];

    const categoriasHacienda = [
      { id: 'cat_c1', nombre: 'Terneros', descripcion: 'Machos post-destete, menores a 1 año.' },
      { id: 'cat_c2', nombre: 'Terneras', descripcion: 'Hembras post-destete, menores a 1 año.' },
      { id: 'cat_c3', nombre: 'Vaquillonas', descripcion: 'Hembras de 1 a 2 años, sin servicio o primer servicio.' },
      { id: 'cat_c4', nombre: 'Novillitos', descripcion: 'Machos de 1 a 2 años.' },
      { id: 'cat_c5', nombre: 'Novillos', descripcion: 'Machos en engorde, mayores a 2 años.' },
      { id: 'cat_c6', nombre: 'Vacas', descripcion: 'Hembras adultas de cría.' },
      { id: 'cat_c7', nombre: 'Toros', descripcion: 'Reproductores machos.' },
    ];

    const movimientosHacienda = [
      { id: 'mov_m1', fecha: isoDaysAgo(180), tipo: 'Compra', categoriaId: 'cat_c6', cantidad: 40, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: 420, precioPorKg: 1.8, contraparte: 'Consignatario Rural Pergamino', observaciones: 'Rodeo de cría base.' },
      { id: 'mov_m2', fecha: isoDaysAgo(180), tipo: 'Compra', categoriaId: 'cat_c7', cantidad: 2, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: 750, precioPorKg: 2.1, contraparte: 'Cabaña San Jorge', observaciones: 'Reposición de toros.' },
      { id: 'mov_m3', fecha: isoDaysAgo(95), tipo: 'Nacimiento', categoriaId: 'cat_c1', cantidad: 12, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: null, precioPorKg: null, contraparte: '', observaciones: 'Parición de otoño.' },
      { id: 'mov_m4', fecha: isoDaysAgo(93), tipo: 'Nacimiento', categoriaId: 'cat_c2', cantidad: 11, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: null, precioPorKg: null, contraparte: '', observaciones: 'Parición de otoño.' },
      { id: 'mov_m5', fecha: isoDaysAgo(150), tipo: 'Compra', categoriaId: 'cat_c5', cantidad: 25, loteId: 'lot_a6', loteDestinoId: null, pesoPromedioKg: 320, precioPorKg: 2.3, contraparte: 'Consignatario Rural Pergamino', observaciones: 'Invernada para engorde.' },
      { id: 'mov_m6', fecha: isoDaysAgo(60), tipo: 'Traslado', categoriaId: 'cat_c1', cantidad: 8, loteId: 'lot_a4', loteDestinoId: 'lot_a6', pesoPromedioKg: null, precioPorKg: null, contraparte: '', observaciones: 'Recría post-destete.' },
      { id: 'mov_m7', fecha: isoDaysAgo(40), tipo: 'Muerte', categoriaId: 'cat_c2', cantidad: 1, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: null, precioPorKg: null, contraparte: '', observaciones: 'Complicación al nacer.' },
      { id: 'mov_m8', fecha: isoDaysAgo(15), tipo: 'Venta', categoriaId: 'cat_c5', cantidad: 10, loteId: 'lot_a6', loteDestinoId: null, pesoPromedioKg: 480, precioPorKg: 2.6, contraparte: 'Frigorífico Pergamino', observaciones: 'Venta por gordura.' },
      { id: 'mov_m9', fecha: isoDaysAgo(8), tipo: 'Nacimiento', categoriaId: 'cat_c1', cantidad: 3, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: null, precioPorKg: null, contraparte: '', observaciones: 'Parición tardía.' },
      { id: 'mov_m10', fecha: isoDaysAgo(8), tipo: 'Nacimiento', categoriaId: 'cat_c2', cantidad: 2, loteId: 'lot_a4', loteDestinoId: null, pesoPromedioKg: null, precioPorKg: null, contraparte: '', observaciones: 'Parición tardía.' },
    ];

    const sanidadAnimal = [
      { id: 'san_s1', fecha: isoDaysAgo(170), tipo: 'Vacunación', categoriaId: 'cat_c6', loteId: 'lot_a4', cantidadAnimales: 40, producto: 'Vacuna antiaftosa', dosis: '5 ml/animal', aplicador: 'Dr. Ricardo Palacios (veterinario)', insumoId: 'ins_i8', cantidadUsada: 40, observaciones: 'Campaña obligatoria SENASA.' },
      { id: 'san_s2', fecha: isoDaysAgo(85), tipo: 'Vacunación', categoriaId: 'cat_c1', loteId: 'lot_a4', cantidadAnimales: 12, producto: 'Vacuna reproductiva + clostridiales', dosis: '2 ml/animal', aplicador: 'Dr. Ricardo Palacios (veterinario)', insumoId: null, cantidadUsada: null, observaciones: '' },
      { id: 'san_s3', fecha: isoDaysAgo(30), tipo: 'Desparasitación', categoriaId: 'cat_c5', loteId: 'lot_a6', cantidadAnimales: 25, producto: 'Ivermectina 1%', dosis: '1 ml/50 kg', aplicador: 'Marcos Ibáñez', insumoId: 'ins_i9', cantidadUsada: 3.2, observaciones: 'Aplicación previa a la venta.' },
      { id: 'san_s4', fecha: isoDaysAgo(5), tipo: 'Tratamiento', categoriaId: 'cat_c2', loteId: 'lot_a4', cantidadAnimales: 2, producto: 'Antibiótico de amplio espectro', dosis: 'Según peso', aplicador: 'Dr. Ricardo Palacios (veterinario)', insumoId: null, cantidadUsada: null, observaciones: 'Tratamiento preventivo post-parto.' },
    ];

    const reproduccion = [
      { id: 'rep_r1', fecha: isoDaysAgo(200), tipo: 'Servicio', categoriaId: 'cat_c6', loteId: 'lot_a4', cantidad: 40, metodoServicio: 'Monta natural', resultado: '', observaciones: 'Servicio de otoño con los 2 toros.' },
      { id: 'rep_r2', fecha: isoDaysAgo(120), tipo: 'Diagnóstico de preñez', categoriaId: 'cat_c6', loteId: 'lot_a4', cantidad: 40, metodoServicio: '', resultado: '36 preñadas (90%)', observaciones: 'Tacto realizado por el veterinario.' },
      { id: 'rep_r3', fecha: isoDaysAgo(95), tipo: 'Parto', categoriaId: 'cat_c6', loteId: 'lot_a4', cantidad: 23, metodoServicio: '', resultado: '12 terneros machos, 11 hembras', observaciones: 'Parición de otoño sin complicaciones mayores.' },
      { id: 'rep_r4', fecha: isoDaysAgo(8), tipo: 'Parto', categoriaId: 'cat_c6', loteId: 'lot_a4', cantidad: 5, metodoServicio: '', resultado: '3 terneros machos, 2 hembras', observaciones: 'Parición tardía.' },
    ];

    const pesadas = [
      { id: 'pes_p1', fecha: isoDaysAgo(150), categoriaId: 'cat_c5', loteId: 'lot_a6', cantidadAnimales: 25, pesoPromedioKg: 320, observaciones: 'Ingreso a invernada.' },
      { id: 'pes_p2', fecha: isoDaysAgo(100), categoriaId: 'cat_c5', loteId: 'lot_a6', cantidadAnimales: 25, pesoPromedioKg: 370, observaciones: '' },
      { id: 'pes_p3', fecha: isoDaysAgo(60), categoriaId: 'cat_c5', loteId: 'lot_a6', cantidadAnimales: 25, pesoPromedioKg: 420, observaciones: '' },
      { id: 'pes_p4', fecha: isoDaysAgo(20), categoriaId: 'cat_c5', loteId: 'lot_a6', cantidadAnimales: 15, pesoPromedioKg: 460, observaciones: 'Tras la venta de 10 cabezas.' },
      { id: 'pes_p5', fecha: isoDaysAgo(90), categoriaId: 'cat_c1', loteId: 'lot_a4', cantidadAnimales: 12, pesoPromedioKg: 95, observaciones: 'Control de recría.' },
    ];

    return {
      version: SCHEMA_VERSION,
      lotes, cultivos, siembras, fumigaciones, cosechas, notas, insumos, precios,
      categoriasHacienda, movimientosHacienda, sanidadAnimal, reproduccion, pesadas,
      settings: { theme: 'light' },
    };
  }

  /* ---------------- Persistencia ---------------- */

  let state = null;

  function migrateLoteCoords(loadedState) {
    if (!loadedState || !Array.isArray(loadedState.lotes)) return false;
    const seedById = {};
    buildSeed().lotes.forEach((l) => { seedById[l.id] = l; });
    let changed = false;
    loadedState.lotes.forEach((l) => {
      if (l.lat === undefined || l.lng === undefined) {
        const seedMatch = seedById[l.id];
        l.lat = (seedMatch && seedMatch.lat !== undefined) ? seedMatch.lat : (l.lat !== undefined ? l.lat : null);
        l.lng = (seedMatch && seedMatch.lng !== undefined) ? seedMatch.lng : (l.lng !== undefined ? l.lng : null);
        changed = true;
      }
    });
    return changed;
  }

  function migratePrecios(loadedState) {
    if (!loadedState || !Array.isArray(loadedState.cultivos)) return false;
    if (!Array.isArray(loadedState.precios)) loadedState.precios = [];
    const existingCultivoIds = new Set(loadedState.precios.map((p) => p.cultivoId));
    let changed = false;
    loadedState.cultivos.forEach((c) => {
      if (!existingCultivoIds.has(c.id) && DEFAULT_PRICES_BY_CULTIVO_NAME[c.nombre] !== undefined) {
        loadedState.precios.push({
          id: uid('pre'),
          cultivoId: c.id,
          precioTon: DEFAULT_PRICES_BY_CULTIVO_NAME[c.nombre],
          moneda: 'USD',
          actualizado: new Date().toISOString().slice(0, 10),
          fuente: 'Manual',
        });
        changed = true;
      }
    });
    return changed;
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
        if (!state || state.version !== SCHEMA_VERSION) throw new Error('schema-mismatch');
        const migratedCoords = migrateLoteCoords(state);
        const migratedPrices = migratePrecios(state);
        if (migratedCoords || migratedPrices) persistLocal();
      } else {
        state = buildSeed();
        persistLocal();
      }
    } catch (err) {
      state = buildSeed();
      persistLocal();
    }
    return state;
  }

  function persistLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ---------------- Sincronización remota (Firestore) ---------------- */

  const REMOTE_COLLECTION = 'agrogestion';
  const REMOTE_DOC_ID = 'main';
  let remoteSaveTimer = null;

  function hasRemote() {
    return typeof firebase !== 'undefined' && !!firebase.apps.length && !!firebase.auth().currentUser;
  }

  function remoteDocRef() {
    return firebase.firestore().collection(REMOTE_COLLECTION).doc(REMOTE_DOC_ID);
  }

  async function persistRemote() {
    if (!hasRemote()) return;
    try {
      await remoteDocRef().set({
        payload: JSON.stringify(state),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('AgroGestión: no se pudo guardar en Firestore.', err);
    }
  }

  function scheduleRemoteSave() {
    if (!hasRemote()) return;
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(persistRemote, 500);
  }

  async function load() {
    loadLocal();
    if (!hasRemote()) return state;
    try {
      const snap = await remoteDocRef().get();
      if (snap.exists && snap.data().payload) {
        const remoteState = JSON.parse(snap.data().payload);
        if (remoteState && remoteState.version === SCHEMA_VERSION) {
          state = remoteState;
          const migratedCoords = migrateLoteCoords(state);
          const migratedPrices = migratePrecios(state);
          persistLocal();
          if (migratedCoords || migratedPrices) scheduleRemoteSave();
        }
      } else {
        await persistRemote();
      }
    } catch (err) {
      console.warn('AgroGestión: sin conexión a Firestore, se usan los datos locales.', err);
    }
    return state;
  }

  function persist() {
    persistLocal();
    scheduleRemoteSave();
  }

  function resetToSeed() {
    state = buildSeed();
    persist();
    return state;
  }

  /* ---------------- CRUD genérico ---------------- */

  function collection(entity) {
    if (!state) loadLocal();
    if (!state[entity]) state[entity] = [];
    return state[entity];
  }

  function getAll(entity) {
    return collection(entity).slice();
  }

  function getById(entity, id) {
    return collection(entity).find((item) => item.id === id) || null;
  }

  function create(entity, prefix, payload) {
    const record = Object.assign({ id: uid(prefix) }, payload);
    collection(entity).push(record);
    persist();
    return record;
  }

  function update(entity, id, payload) {
    const list = collection(entity);
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    list[idx] = Object.assign({}, list[idx], payload, { id });
    persist();
    return list[idx];
  }

  function remove(entity, id) {
    const list = collection(entity);
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    persist();
    return true;
  }

  function count(entity) {
    return collection(entity).length;
  }

  /* ---------------- Dependencias entre entidades ---------------- */

  function dependentsOfLote(loteId) {
    return {
      siembras: collection('siembras').filter((s) => s.loteId === loteId).length,
      fumigaciones: collection('fumigaciones').filter((f) => f.loteId === loteId).length,
      cosechas: collection('cosechas').filter((c) => c.loteId === loteId).length,
      notas: collection('notas').filter((n) => n.loteId === loteId).length,
    };
  }

  function dependentsOfCultivo(cultivoId) {
    return {
      siembras: collection('siembras').filter((s) => s.cultivoId === cultivoId).length,
      cosechas: collection('cosechas').filter((c) => c.cultivoId === cultivoId).length,
    };
  }

  function getSettings() {
    if (!state) loadLocal();
    return state.settings || (state.settings = { theme: 'light' });
  }

  function setSetting(key, value) {
    getSettings()[key] = value;
    persist();
  }

  /* ---------------- Precios de referencia ---------------- */

  function getPrecioByCultivo(cultivoId) {
    return collection('precios').find((p) => p.cultivoId === cultivoId) || null;
  }

  function upsertPrecio(cultivoId, payload) {
    const list = collection('precios');
    const idx = list.findIndex((p) => p.cultivoId === cultivoId);
    if (idx === -1) {
      const record = Object.assign({ id: uid('pre'), cultivoId }, payload);
      list.push(record);
      persist();
      return record;
    }
    list[idx] = Object.assign({}, list[idx], payload, { cultivoId });
    persist();
    return list[idx];
  }

  /* ---------------- Stock de insumos ---------------- */

  function adjustInsumoStock(insumoId, delta) {
    if (!insumoId) return null;
    const insumo = getById('insumos', insumoId);
    if (!insumo) return null;
    const next = Math.max(0, Number(insumo.stockActual || 0) + delta);
    return update('insumos', insumoId, { stockActual: next });
  }

  return {
    ENUMS,
    load, persist, resetToSeed,
    getAll, getById, create, update, remove, count,
    dependentsOfLote, dependentsOfCultivo,
    getSettings, setSetting,
    getPrecioByCultivo, upsertPrecio,
    adjustInsumoStock,
  };
})();
