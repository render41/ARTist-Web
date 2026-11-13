/**
 * Ponto de entrada da aplicação web Instalação Invisível.
 * Orquestra os módulos independentes carregados em index.html.
 */
(() => {
  'use strict';

  const modules = window.ArtistWebModules || {};

  if (typeof modules.initReducedMotion === 'function') {
    modules.initReducedMotion();
  }

  if (typeof modules.initTerritoriesCarousel === 'function') {
    modules.initTerritoriesCarousel();
  }

  if (typeof modules.initArchiveFeedback === 'function') {
    modules.initArchiveFeedback();
  }
})();
