/**
 * Módulo de proteção casual contra download direto de imagens e vídeos.
 * Desativa clique direito, arrasto e opção nativa de download em mídias da exposição.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});
  const PROTECTED_MEDIA_SELECTOR =
    '.media-frame-asset, .gallery-dialog-media, .footer-media-image, .hero-figure-image, .media-viewport video, .gallery-dialog-viewport video';

  /**
   * Aplica atributos de proteção em um elemento de mídia estático ou dinâmico.
   */
  function applyMediaProtection(mediaElement) {
    if (!mediaElement) {
      return;
    }

    mediaElement.draggable = false;

    if (mediaElement.tagName === 'VIDEO') {
      mediaElement.setAttribute('controlsList', 'nodownload noremoteplayback');
      mediaElement.disablePictureInPicture = true;
    }
  }

  function initMediaProtection() {
    document.querySelectorAll(PROTECTED_MEDIA_SELECTOR).forEach(applyMediaProtection);

    document.addEventListener('contextmenu', (event) => {
      if (event.target instanceof Element && event.target.closest(PROTECTED_MEDIA_SELECTOR)) {
        event.preventDefault();
      }
    });

    document.addEventListener('dragstart', (event) => {
      if (event.target instanceof Element && event.target.closest(PROTECTED_MEDIA_SELECTOR)) {
        event.preventDefault();
      }
    });
  }

  namespace.applyMediaProtection = applyMediaProtection;
  namespace.initMediaProtection = initMediaProtection;
})();
