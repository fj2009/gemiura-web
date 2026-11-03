(() => {
  'use strict';

  const CLAVE = 'gemiura-consentimiento-v1';
  const VERSION = 1;
  const DURACION = 365 * 24 * 60 * 60 * 1000;
  const enLegal = location.pathname.includes('/legal/');
  const prefijo = enLegal ? '' : 'legal/';
  const parametros = new URLSearchParams(location.search);
  const silenciar = parametros.has('estatico') && !parametros.has('consent');

  const leer = () => {
    try {
      const bruto = localStorage.getItem(CLAVE);
      if (!bruto) return null;
      const datos = JSON.parse(bruto);
      if (!datos || datos.version !== VERSION) return null;
      if (!datos.expira || Date.now() > datos.expira) return null;
      return datos;
    } catch (e) {
      return null;
    }
  };

  const guardar = (extra = {}) => {
    const datos = {
      version: VERSION,
      fecha: new Date().toISOString(),
      expira: Date.now() + DURACION,
      necesarias: true,
      analitica: false,
      publicidad: false,
      ...extra
    };
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
    return datos;
  };

  const aplicar = datos => {
    document.documentElement.dataset.consentimiento = datos ? 'guardado' : 'pendiente';
  };

  const crear = () => {
    const contenedor = document.createElement('div');
    contenedor.innerHTML = `
      <aside class="consent" role="region" aria-label="Aviso de cookies" hidden>
        <div class="consent__texto">
          <strong>Cookies y almacenamiento local</strong>
          <p>Este sitio solo usa almacenamiento técnico necesario para recordar el tema y tu decisión. No instala cookies de analítica ni de publicidad. <a href="${prefijo}cookies.html">Política de cookies</a>.</p>
        </div>
        <div class="consent__acciones">
          <button class="btn btn--primario" type="button" data-consent-accept>Aceptar solo necesarias</button>
          <button class="btn fantasma" type="button" data-consent-open>Configurar</button>
        </div>
      </aside>
      <dialog class="consent-dialog" id="consent-dialog" aria-labelledby="consent-titulo">
        <div class="consent-dialog__cabecera">
          <span class="kicker">Preferencias</span>
          <button class="consent-dialog__cerrar" type="button" data-consent-close aria-label="Cerrar">×</button>
        </div>
        <h2 id="consent-titulo">Cookies y permisos</h2>
        <p class="consent-dialog__intro">Puedes revisar qué almacenamiento usa esta web. Solo las categorías necesarias están activas.</p>
        <div class="consent-pref">
          <div class="consent-pref__fila">
            <div>
              <strong>Necesarias</strong>
              <span>Tema visual y decisión de cookies. Siempre activas.</span>
            </div>
            <span class="consent-pref__estado">Activas</span>
          </div>
          <div class="consent-pref__fila">
            <div>
              <strong>Analítica</strong>
              <span>No hay herramientas de analítica instaladas.</span>
            </div>
            <label class="consent-pref__switch">
              <input type="checkbox" name="analitica" disabled>
              <span aria-hidden="true"></span>
              <span class="oculto">Analítica</span>
            </label>
          </div>
          <div class="consent-pref__fila">
            <div>
              <strong>Publicidad</strong>
              <span>No hay cookies publicitarias ni píxeles de terceros.</span>
            </div>
            <label class="consent-pref__switch">
              <input type="checkbox" name="publicidad" disabled>
              <span aria-hidden="true"></span>
              <span class="oculto">Publicidad</span>
            </label>
          </div>
        </div>
        <div class="consent-dialog__acciones">
          <button class="btn btn--primario" type="button" data-consent-save>Guardar solo necesarias</button>
          <button class="btn fantasma" type="button" data-consent-close>Cancelar</button>
        </div>
        <p class="consent-dialog__pie">Más información en la <a href="${prefijo}cookies.html">política de cookies</a> y en la <a href="${prefijo}privacidad.html">política de privacidad</a>.</p>
      </dialog>
    `;

    document.body.append(...contenedor.children);

    const banner = document.querySelector('.consent');
    const dialogo = document.querySelector('#consent-dialog');
    if (!banner || !dialogo) return null;

    const mostrarBanner = () => {
      banner.hidden = false;
      requestAnimationFrame(() => banner.classList.add('visible'));
    };

    const ocultarBanner = () => {
      banner.classList.remove('visible');
      setTimeout(() => { banner.hidden = true; }, 320);
    };

    const abrir = () => {
      if (typeof dialogo.showModal === 'function') {
        if (!dialogo.open) dialogo.showModal();
      } else {
        dialogo.setAttribute('open', '');
      }
      const primero = dialogo.querySelector('[data-consent-save]');
      if (primero) primero.focus();
    };

    const cerrar = () => {
      if (typeof dialogo.close === 'function' && dialogo.open) dialogo.close();
      else dialogo.removeAttribute('open');
    };

    const aceptar = () => {
      const datos = guardar();
      aplicar(datos);
      ocultarBanner();
      cerrar();
    };

    banner.querySelector('[data-consent-accept]').addEventListener('click', aceptar);
    banner.querySelector('[data-consent-open]').addEventListener('click', abrir);
    dialogo.querySelector('[data-consent-save]').addEventListener('click', aceptar);
    dialogo.querySelectorAll('[data-consent-close]').forEach(boton => {
      boton.addEventListener('click', cerrar);
    });
    dialogo.addEventListener('click', e => {
      if (e.target === dialogo) cerrar();
    });
    dialogo.addEventListener('close', () => {
      if (!leer() && !silenciar) mostrarBanner();
    });

    if (!leer() && !silenciar) mostrarBanner();
    return { abrir, cerrar, banner, dialogo };
  };

  let control = null;

  const iniciar = () => {
    control = crear();
    aplicar(leer());
    document.querySelectorAll('[data-consent-open]').forEach(boton => {
      if (boton.closest('.consent, .consent-dialog')) return;
      boton.addEventListener('click', e => {
        e.preventDefault();
        if (!control) control = crear();
        if (control) control.abrir();
      });
    });
    window.GemiuraConsent = {
      abrir: () => { if (!control) control = crear(); if (control) control.abrir(); },
      obtener: leer,
      aceptar: () => { guardar(); aplicar(leer()); if (control) control.cerrar(); }
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
