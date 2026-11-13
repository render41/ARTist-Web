/**
 * Módulo de feedback para os botões do Acervo Aberto.
 * Informa de maneira acessível quando os arquivos de download ainda estão em preparação.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});

  function initArchiveFeedback() {
    const feedbackElement = document.querySelector('.archive-feedback');
    const pendingButtons = document.querySelectorAll('button[data-pending-resource]');

    if (!feedbackElement || pendingButtons.length === 0) {
      return;
    }

    pendingButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const resourceName = button.dataset.pendingResource || 'Este material';
        feedbackElement.hidden = false;
        feedbackElement.textContent = `${resourceName}: os arquivos finais serão disponibilizados para download em breve neste acervo.`;
      });
    });
  }

  namespace.initArchiveFeedback = initArchiveFeedback;
})();

