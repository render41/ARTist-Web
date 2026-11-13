/**
 * Módulo de feedback para os botões do Acervo Aberto.
 * Exibe aviso acessível quando links ou downloads do acervo ainda estão em preparação.
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
        const customMessage = button.dataset.pendingMessage;
        const resourceName = button.dataset.pendingResource || 'Este material';

        feedbackElement.hidden = false;
        feedbackElement.textContent =
          customMessage ||
          `${resourceName}: os arquivos finais serão disponibilizados para download em breve neste acervo.`;
      });
    });
  }

  namespace.initArchiveFeedback = initArchiveFeedback;
})();
