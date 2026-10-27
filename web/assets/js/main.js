/* Gemiura · web corporativa
   Interacciones sin dependencias. Respeta prefers-reduced-motion y admite
   el modo "?estatico" (sin animaciones) para capturas y revisión. */

(() => {
  'use strict';

  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const estatico = reducido || new URLSearchParams(location.search).has('estatico');
  if (estatico) document.body.classList.add('estatico');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ── 0 · tema claro / oscuro ─────────────────────────────────── */
  const raiz = document.documentElement;
  const botonTema = $('#tema-btn');
  const metaTema = $('meta[name="theme-color"]');
  const CLAVE_TEMA = 'gemiura-tema';

  function aplicarTema(oscuro, guardar = true) {
    raiz.dataset.tema = oscuro ? 'oscuro' : 'claro';
    if (botonTema) {
      botonTema.hidden = false;
      botonTema.setAttribute('aria-pressed', String(oscuro));
      botonTema.title = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }
    if (metaTema) metaTema.setAttribute('content', oscuro ? '#171415' : '#f6efe6');
    if (guardar) {
      try { localStorage.setItem(CLAVE_TEMA, oscuro ? 'oscuro' : 'claro'); } catch (e) {}
    }
  }

  aplicarTema(raiz.dataset.tema === 'oscuro', false);
  if (botonTema) {
    botonTema.addEventListener('click', () => aplicarTema(raiz.dataset.tema !== 'oscuro'));
  }
  addEventListener('storage', e => {
    if (e.key === CLAVE_TEMA) aplicarTema(e.newValue === 'oscuro', false);
  });

  /* ── 1 · entrada del hero ─────────────────────────────────────── */
  const hero = $('.hero');
  const mostrarHero = () => hero && hero.classList.add('visible');
  if (estatico) mostrarHero();
  else requestAnimationFrame(() => requestAnimationFrame(mostrarHero));

  /* ── 2 · año ──────────────────────────────────────────────────── */
  const anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* ── 3 · nav: fondo, barra de progreso y sección activa ──────── */
  const nav = $('#nav');
  const barra = $('#barra-progreso');
  let ticking = false;

  const banda = $('.banda');
  const bandaImg = banda && $('img', banda);

  function actualizarBanda() {
    if (!banda || !bandaImg || estatico) return;
    const r = banda.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    bandaImg.style.transform =
      `translate3d(0, ${((p - 0.5) * 44).toFixed(2)}px, 0) scale(1.06)`;
  }

  function alScroll() {
    const y = scrollY;
    const alto = document.documentElement.scrollHeight - innerHeight;
    if (barra) barra.style.width = (alto > 0 ? (y / alto) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('fijo', y > 40);
    actualizarMetodo();
    actualizarBanda();
    ticking = false;
  }
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(alScroll); ticking = true; }
  }, { passive: true });

  const enlacesNav = $$('.nav__enlaces a');
  const secciones = ['servicios', 'plataforma', 'colaboraciones', 'planes', 'metodo', 'contacto']
    .map(id => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const vigia = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        enlacesNav.forEach(a => a.classList.toggle(
          'activa', a.dataset.seccion === e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secciones.forEach(s => vigia.observe(s));
  }

  /* ── 4 · revelados al entrar en pantalla ─────────────────────── */
  const aRevelar = $$('[data-reveal]');
  if (estatico || !('IntersectionObserver' in window)) {
    aRevelar.forEach(el => el.classList.add('rev'));
  } else {
    const observador = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('rev');
          observador.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    aRevelar.forEach(el => observador.observe(el));
  }

  /* ── 5 · servicios: acordeón ─────────────────────────────────── */
  const servicios = $$('.servicio');
  const abrir = item => {
    const det = $('.servicio__detalle', item);
    const btn = $('.servicio__cabecera', item);
    if (!det || item.classList.contains('abierto')) return;
    det.hidden = false;
    det.style.maxHeight = det.scrollHeight + 'px';
    item.classList.add('abierto');
    btn.setAttribute('aria-expanded', 'true');
  };
  const cerrar = item => {
    const det = $('.servicio__detalle', item);
    const btn = $('.servicio__cabecera', item);
    if (!det || !item.classList.contains('abierto')) return;
    det.style.maxHeight = det.scrollHeight + 'px';
    item.classList.remove('abierto');
    btn.setAttribute('aria-expanded', 'false');
    requestAnimationFrame(() => { det.style.maxHeight = '0px'; });
    setTimeout(() => {
      if (!item.classList.contains('abierto')) det.hidden = true;
    }, 650);
  };
  servicios.forEach(item => {
    const btn = $('.servicio__cabecera', item);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const abierto = item.classList.contains('abierto');
      servicios.forEach(otro => { if (otro !== item) cerrar(otro); });
      abierto ? cerrar(item) : abrir(item);
    });
  });

  let redimension = null;
  addEventListener('resize', () => {
    clearTimeout(redimension);
    redimension = setTimeout(() => {
      servicios.forEach(item => {
        if (!item.classList.contains('abierto')) return;
        const det = $('.servicio__detalle', item);
        if (det) det.style.maxHeight = det.scrollHeight + 'px';
      });
      $$('[data-desplegable]').forEach(box => {
        if (!box.classList.contains('abierto')) return;
        const panel = $('.estado-desplegable__panel', box);
        if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
      });
    }, 180);
  });

  /* ── 5b · desplegable: estado real de las herramientas propias ── */
  $$('[data-desplegable]').forEach(box => {
    const btn = $('.estado-desplegable__cabecera', box);
    const panel = $('.estado-desplegable__panel', box);
    if (!btn || !panel) return;
    const abrir = () => {
      panel.hidden = false;
      panel.style.maxHeight = panel.scrollHeight + 'px';
      box.classList.add('abierto');
      btn.setAttribute('aria-expanded', 'true');
    };
    const cerrar = () => {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      box.classList.remove('abierto');
      btn.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(() => { panel.style.maxHeight = '0px'; });
      setTimeout(() => {
        if (!box.classList.contains('abierto')) panel.hidden = true;
      }, 650);
    };
    btn.addEventListener('click', () => {
      box.classList.contains('abierto') ? cerrar() : abrir();
    });
  });

  /* ── 6 · menú móvil ─────────────────────────────────────────── */
  const menuBtn = $('#menu-btn');
  const menuMovil = $('#menu-movil');
  if (menuBtn && menuMovil) {
    const abrirMenu = () => {
      menuMovil.hidden = false;
      void menuMovil.offsetWidth;
      menuMovil.classList.add('abierto');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const cerrarMenu = () => {
      menuMovil.classList.remove('abierto');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!menuMovil.classList.contains('abierto')) menuMovil.hidden = true;
      }, 350);
    };
    menuBtn.addEventListener('click', () => {
      menuMovil.classList.contains('abierto') ? cerrarMenu() : abrirMenu();
    });
    $$('a', menuMovil).forEach(a => a.addEventListener('click', cerrarMenu));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuMovil.classList.contains('abierto')) cerrarMenu();
    });
    matchMedia('(min-width: 861px)').addEventListener('change', e => {
      if (e.matches && menuMovil.classList.contains('abierto')) cerrarMenu();
    });
  }

  /* ── 7 · método: recorrido horizontal guiado por scroll ─────── */
  const metodo = $('.metodo');
  const pista = $('#metodo-pista');
  const progreso = $('#metodo-progreso');
  const fantasma = $('#metodo-fantasma');
  const fases = $$('.fase');
  const horizontal = () => matchMedia('(min-width: 821px)').matches && !estatico;

  function actualizarMetodo() {
    if (!metodo || !pista) return;
    if (!horizontal()) {
      fases.forEach(f => f.classList.add('activa'));
      if (progreso) progreso.style.width = '100%';
      return;
    }
    const caja = metodo.getBoundingClientRect();
    const recorrido = metodo.offsetHeight - innerHeight;
    const avance = Math.min(1, Math.max(0, -caja.top / recorrido));
    const sobra = pista.scrollWidth - innerWidth + parseFloat(getComputedStyle(pista).paddingRight);
    pista.style.transform = `translate3d(${-avance * Math.max(0, sobra)}px, 0, 0)`;
    if (progreso) progreso.style.width = avance * 100 + '%';

    const centro = innerWidth / 2;
    let activa = fases[0];
    fases.forEach(f => {
      const r = f.getBoundingClientRect();
      f.classList.toggle('activa', r.left < centro && r.right > centro);
      if (r.left < centro && r.right > centro) activa = f;
    });
    if (fantasma && activa) {
      const n = activa.dataset.fase;
      if (fantasma.textContent !== n) fantasma.textContent = n;
    }
  }

  /* ── 9 · planes y configurador ─────────────────────────────── */
  let calcularPlanes = null;
  let propuestaPlanes = null;
  let imprimirPropuesta = null;

  const formPlanes = $('#config-form');
  if (formPlanes) {
    /* Tarifas de referencia (sin IVA). Sólo cuotas mensuales: la instalación
       y los trabajos puntuales se presupuestan tras la reunión de alcance.
       AJUSTAR aquí; las tarjetas de plan del HTML muestran las mismas cuotas
       base y deben mantenerse en sincronía. */
    const TARIFAS = {
      base: {
        esencial:    { nombre: 'Esencial',    mes: 49,  incluye: { copias: 1 } },
        profesional: { nombre: 'Profesional', mes: 129, incluye: { copias: 1 } },
        integral:    { nombre: 'Integral',    mes: 499, incluye: { copias: 1, auditoria: 1, camaras: 4, formacion: 1 } },
        cero:        { nombre: 'Desde cero',  mes: 0,   incluye: {} }
      },
      modulos: {
        paginas:     { nombre: 'Páginas adicionales', mes: 0, max: 20, presupuesto: true },
        sedes:       { nombre: 'Sedes o ubicaciones', mes: 25, max: 10 },
        camaras:     { nombre: 'Cámaras IP', mes: 6, max: 32 },
        formacion:   { nombre: 'Sesiones de formación', mes: 0, max: 6, presupuesto: true },
        copias:      { nombre: 'Copias de seguridad gestionadas', mes: 25 },
        auditoria:   { nombre: 'Auditoría de seguridad inicial', mes: 90 },
        integracion: { nombre: 'Integración con sus sistemas', mes: 0, presupuesto: true }
      },
      prioridad: {
        normal:      { nombre: 'Normal',      f: 1 },
        prioritario: { nombre: 'Prioritaria', f: 1.2 },
        critico:     { nombre: 'Crítica',     f: 1.4 }
      },
      contrato: {
        mensual:    { nombre: 'Mensual',    f: 1 },
        trimestral: { nombre: 'Trimestral', f: 0.95 },
        anual:      { nombre: 'Anual',      f: 0.9 }
      }
    };
    const NOMBRE_VIA = { llamada: 'Llamada', videollamada: 'Videollamada', mensaje: 'Mensaje' };
    const NOMBRE_FRANJA = {
      manana: 'Mañana (9 a 12)', mediodia: 'Mediodía (12 a 15)',
      tarde: 'Tarde (15 a 18)', indiferente: 'Indiferente'
    };

    /* Agrupación de miles manual: Intl es-ES no agrupa números de 4 cifras
       (CLDR), y aquí conviene que 3040 se lea 3.040, como en los PDF. */
    const agrupar = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const dinero = n => agrupar(n) + ' €';
    const redondear = (n, paso) => Math.round(n / paso) * paso;
    const dato = (fd, k) => (fd.get(k) || '').toString();
    const cuota = n => (n ? dinero(n) + '/mes' : 'a presupuesto');

    const elMes = $('#total-mes');
    const elAnual = $('#total-anual');
    const listaResumen = $('#resumen-lineas');
    const elReunion = $('#resumen-reunion');
    const cajaResumen = $('#resumen');
    const estadoEnvio = $('#estado-envio');

    const estado = (texto, tipo = '') => {
      if (!estadoEnvio) return;
      estadoEnvio.textContent = texto;
      estadoEnvio.className = 'resumen__estado' + (tipo ? ' ' + tipo : '');
    };

    function leerConfig() {
      const fd = new FormData(formPlanes);
      const mod = {};
      Object.keys(TARIFAS.modulos).forEach(clave => {
        const datos = TARIFAS.modulos[clave];
        if ('max' in datos) {
          const n = parseInt(dato(fd, clave) || '0', 10) || 0;
          mod[clave] = Math.max(0, Math.min(datos.max, n));
        } else {
          mod[clave] = fd.has(clave) ? 1 : 0;
        }
      });
      const elegir = (grupo, clave, porDefecto) =>
        TARIFAS[grupo][clave] ? clave : porDefecto;
      return {
        base: elegir('base', dato(fd, 'base'), 'profesional'),
        mod,
        prioridad: elegir('prioridad', dato(fd, 'prioridad'), 'normal'),
        contrato: elegir('contrato', dato(fd, 'contrato'), 'mensual'),
        via: NOMBRE_VIA[dato(fd, 'via')] ? dato(fd, 'via') : 'llamada',
        franja: NOMBRE_FRANJA[dato(fd, 'franja')] ? dato(fd, 'franja') : 'indiferente'
      };
    }

    function pintarCifra(el, valor, sufijo, animar = true) {
      if (!el) return;
      const destino = dinero(valor) + sufijo;
      const desde = Number(el.dataset.valor || 0);
      el.dataset.valor = valor;
      if (estatico || !animar || desde === valor) { el.textContent = destino; return; }
      cancelAnimationFrame(el._anim);
      const t0 = performance.now();
      const paso = ahora => {
        const k = Math.min(1, (ahora - t0) / 420);
        const suave = 1 - Math.pow(1 - k, 3);
        el.textContent = dinero(Math.round(desde + (valor - desde) * suave)) + sufijo;
        if (k < 1) el._anim = requestAnimationFrame(paso);
        else el.textContent = destino;
      };
      el._anim = requestAnimationFrame(paso);
    }

    function calcular(sinAnimacion = false) {
      const c = leerConfig();
      const base = TARIFAS.base[c.base];
      let mes = base.mes;
      const lineas = [{
        t: 'Plan ' + base.nombre,
        v: c.base === 'cero' ? 'sólo módulos' : cuota(base.mes)
      }];

      const incluye = base.incluye || {};

      Object.keys(TARIFAS.modulos).forEach(clave => {
        const v = c.mod[clave];
        if (!v) return;
        const m = TARIFAS.modulos[clave];
        const libre = incluye[clave] || 0;
        const pagadas = Math.max(0, v - libre);
        mes += m.mes * pagadas;
        let etiqueta = 'max' in m ? m.nombre + ' ×' + v : m.nombre;
        let valor;
        if (!pagadas) {
          valor = 'incluido en el plan';
        } else {
          valor = m.presupuesto ? 'a presupuesto' : cuota(m.mes * pagadas);
          if (libre) etiqueta += ' (' + libre + ' incluido' + (libre > 1 ? 's' : '') + ')';
        }
        lineas.push({ t: etiqueta, v: valor });
      });

      const fp = TARIFAS.prioridad[c.prioridad];
      const fc = TARIFAS.contrato[c.contrato];
      if (fc.f !== 1) {
        lineas.push({ t: 'Contrato ' + fc.nombre, v: '−' + Math.round((1 - fc.f) * 100) + ' % cuota' });
      }
      if (fp.f !== 1) {
        lineas.push({ t: 'Prioridad ' + fp.nombre, v: '+' + Math.round((fp.f - 1) * 100) + ' % cuota' });
      }

      const mesFinal = redondear(mes * fp.f * fc.f, 1);
      const anual = redondear(mesFinal * 12, 1);

      pintarCifra(elMes, mesFinal, '/mes', !sinAnimacion);
      pintarCifra(elAnual, anual, '', !sinAnimacion);
      if (listaResumen) {
        listaResumen.innerHTML = '';
        lineas.forEach(l => {
          const li = document.createElement('li');
          const et = document.createElement('span');
          const va = document.createElement('strong');
          et.textContent = l.t;
          va.textContent = l.v;
          li.append(et, va);
          listaResumen.append(li);
        });
      }
      if (elReunion) {
        elReunion.innerHTML = 'Reunión: <b>' + NOMBRE_VIA[c.via] + ' · ' +
          NOMBRE_FRANJA[c.franja] + '</b>';
      }
      pintarInclusiones(incluye);
      $$('.modulo', formPlanes).forEach(fila => {
        const clave = fila.dataset.clave;
        if (clave) fila.classList.toggle('modulo--activo', c.mod[clave] > 0);
      });

      return { ...c, mes: mesFinal, anual, lineas };
    }

    /* los módulos que ya cubre la base elegida no se cobran dos veces */
    function pintarInclusiones(incluye) {
      $$('.modulo', formPlanes).forEach(fila => {
        const clave = fila.dataset.clave;
        if (!clave) return;
        const m = TARIFAS.modulos[clave];
        const libre = incluye[clave] || 0;
        const precio = $('.modulo__precio', fila);
        if (precio) {
          if (!precio.dataset.tarifa) precio.dataset.tarifa = precio.textContent;
          if (!libre) {
            precio.textContent = precio.dataset.tarifa;
          } else if (m.max && libre < m.max) {
            const resto = precio.dataset.tarifa.charAt(0).toLowerCase() + precio.dataset.tarifa.slice(1);
            precio.textContent = 'Incluido: ' + libre + ' · resto ' + resto;
          } else {
            precio.textContent = 'Incluido en su plan';
          }
        }
        fila.classList.toggle('modulo--incluido', libre > 0);
        const entrada = $('input', fila);
        if (entrada) {
          const bloqueado = libre > 0 && !('max' in m);
          if (bloqueado) entrada.checked = false;
          entrada.disabled = bloqueado;
        }
      });
    }

    function construirPropuesta() {
      const c = calcular();
      const fd = new FormData(formPlanes);
      const nombre = dato(fd, 'nombre').trim();
      const empresa = dato(fd, 'empresa').trim();
      const email = dato(fd, 'email').trim();
      const telefono = dato(fd, 'telefono').trim();
      const notas = dato(fd, 'notas').trim().slice(0, 500);

      const texto = [];
      texto.push('PROPUESTA ORIENTATIVA · GEMIURA');
      texto.push('Fecha: ' + new Date().toLocaleDateString('es-ES'));
      texto.push('');
      texto.push('CONFIGURACIÓN');
      c.lineas.forEach(l => texto.push('- ' + l.t + ': ' + l.v));
      texto.push('');
      texto.push('IMPORTES (sin IVA)');
      texto.push('Cuota mensual: ' + dinero(c.mes));
      texto.push('Equivalente anual (12 meses): ' + dinero(c.anual));
      texto.push('Instalación y trabajos puntuales: a presupuesto');
      texto.push('');
      texto.push('CONTACTO');
      texto.push('Nombre: ' + (nombre || '—'));
      texto.push('Empresa: ' + (empresa || '—'));
      texto.push('Correo: ' + (email || '—'));
      texto.push('Teléfono: ' + (telefono || '—'));
      texto.push('');
      texto.push('REUNIÓN');
      texto.push('Método: ' + NOMBRE_VIA[c.via]);
      texto.push('Franja preferida: ' + NOMBRE_FRANJA[c.franja]);
      if (notas) {
        texto.push('');
        texto.push('CONTEXTO');
        texto.push(notas);
      }
      texto.push('');
      texto.push('Tarifas de referencia sin IVA. Propuesta orientativa generada');
      texto.push('automáticamente; no constituye oferta en firme. La propuesta');
      texto.push('definitiva se cierra tras la reunión de alcance.');
      return { texto: texto.join('\n'), config: c, nombre, empresa, email };
    }

    const marcarCampo = (nombre, error) => {
      const input = formPlanes.querySelector('[name="' + nombre + '"]');
      const campo = input && input.closest('.campo');
      if (campo) campo.classList.toggle('campo--error', error);
      if (input) input.setAttribute('aria-invalid', error ? 'true' : 'false');
    };

    formPlanes.addEventListener('input', e => {
      if (e.target.name === 'nombre' || e.target.name === 'email') {
        const campo = e.target.closest('.campo');
        if (campo) campo.classList.remove('campo--error');
        e.target.removeAttribute('aria-invalid');
      }
      calcular();
    });

    formPlanes.addEventListener('change', e => {
      if (e.target.matches('input[type="number"]')) {
        const m = TARIFAS.modulos[e.target.name];
        if (m && 'max' in m) {
          const n = Math.max(0, Math.min(m.max, parseInt(e.target.value, 10) || 0));
          e.target.value = n;
        }
      }
      calcular();
    });

    $$('[data-pasos]', formPlanes).forEach(caja => {
      const input = $('input', caja);
      if (!input) return;
      const ajustar = delta => {
        const max = parseInt(input.max, 10) || 99;
        input.value = Math.min(max, Math.max(0, (parseInt(input.value, 10) || 0) + delta));
        calcular();
      };
      $('[data-menos]', caja).addEventListener('click', () => ajustar(-1));
      $('[data-mas]', caja).addEventListener('click', () => ajustar(1));
    });

    $$('[data-base]').forEach(btn => {
      btn.addEventListener('click', () => {
        const radio = formPlanes.querySelector('input[name="base"][value="' + btn.dataset.base + '"]');
        if (radio) {
          radio.checked = true;
          calcular();
          radio.focus({ preventScroll: true });
        }
        const destino = $('#configurador');
        if (destino) destino.scrollIntoView({ behavior: estatico ? 'auto' : 'smooth', block: 'start' });
        if (cajaResumen) {
          cajaResumen.classList.remove('resumen--pulso');
          void cajaResumen.offsetWidth;
          cajaResumen.classList.add('resumen--pulso');
        }
      });
    });

    formPlanes.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(formPlanes);
      const nombre = dato(fd, 'nombre').trim();
      const email = dato(fd, 'email').trim();
      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      marcarCampo('nombre', !nombre);
      marcarCampo('email', !emailValido);
      if (!nombre || !emailValido) {
        estado('Faltan datos: indique su nombre y un correo válido para enviar la propuesta.', 'error');
        (nombre ? formPlanes.querySelector('[name="email"]') : formPlanes.querySelector('[name="nombre"]')).focus();
        return;
      }
      const destino = formPlanes.dataset.correo || 'gemiurasolution@gmail.com';
      const p = construirPropuesta();
      const asunto = 'Propuesta y reunión — ' + (p.empresa || p.nombre);
      const cuerpo = p.texto.replace(/\n/g, '\r\n');
      location.href = 'mailto:' + destino +
        '?subject=' + encodeURIComponent(asunto) +
        '&body=' + encodeURIComponent(cuerpo);
      estado('Se ha abierto su cliente de correo con la propuesta. Si no ocurre, use Copiar o Descargar y envíela a ' + destino + '.', 'ok');
    });

    const copiarTexto = async texto => {
      try {
        await navigator.clipboard.writeText(texto);
        return true;
      } catch (err) {
        const area = document.createElement('textarea');
        area.value = texto;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (_) {}
        area.remove();
        return ok;
      }
    };

    const btnCopiar = $('#btn-copiar');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', async () => {
        const ok = await copiarTexto(construirPropuesta().texto);
        estado(ok ? 'Propuesta copiada al portapapeles.' : 'No se pudo copiar; descárguela y envíela por correo.', ok ? 'ok' : 'error');
      });
    }

    const btnDescargar = $('#btn-descargar');
    if (btnDescargar) {
      btnDescargar.addEventListener('click', () => {
        const blob = new Blob([construirPropuesta().texto], { type: 'text/plain;charset=utf-8' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = 'Propuesta-Gemiura-' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1500);
        estado('Propuesta descargada. Envíela a ' + (formPlanes.dataset.correo || 'gemiurasolution@gmail.com') + '.', 'ok');
      });
    }

    /* rellena la hoja imprimible (A4) con la configuración actual */
    function prepararPropuesta() {
      const p = construirPropuesta();
      const fd = new FormData(formPlanes);
      const ahora = new Date();
      const iso = ahora.getFullYear() + '-' +
        String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
        String(ahora.getDate()).padStart(2, '0');
      const poner = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };

      poner('#pi-fecha', ahora.toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
      }));
      poner('#pi-cliente', [p.nombre, p.empresa].filter(Boolean).join(' · ') || '—');
      poner('#pi-contacto', [p.email, dato(fd, 'telefono')].filter(Boolean).join(' · ') || '—');
      poner('#pi-mes', dinero(p.config.mes));
      poner('#pi-anual', dinero(p.config.anual));
      poner('#pi-reunion', NOMBRE_VIA[p.config.via] + ' · ' + NOMBRE_FRANJA[p.config.franja]);
      poner('#pi-contexto', dato(fd, 'notas').trim() || '—');

      const lista = $('#pi-lineas');
      if (lista) {
        lista.innerHTML = '';
        p.config.lineas.forEach(l => {
          const li = document.createElement('li');
          const t = document.createElement('span');
          const v = document.createElement('strong');
          t.textContent = l.t;
          v.textContent = l.v;
          li.append(t, v);
          lista.append(li);
        });
      }
      return 'Propuesta-Gemiura-' + iso;
    }

    const btnImprimir = $('#btn-imprimir');
    if (btnImprimir) {
      btnImprimir.addEventListener('click', () => {
        const nombreArchivo = prepararPropuesta();
        const titulo = document.title;
        document.title = nombreArchivo;
        const restaurar = () => {
          document.title = titulo;
          window.removeEventListener('afterprint', restaurar);
        };
        window.addEventListener('afterprint', restaurar);
        window.print();
      });
    }

    calcularPlanes = calcular;
    propuestaPlanes = construirPropuesta;
    imprimirPropuesta = prepararPropuesta;
    calcular(true);
  }

  /* ── 10 · arranque ──────────────────────────────────────────── */
  alScroll();

  if (new URLSearchParams(location.search).has('debug')) {
    window.__gemiura = { actualizar: alScroll, calcular: calcularPlanes, propuesta: propuestaPlanes, imprimir: imprimirPropuesta };
  }
})();
