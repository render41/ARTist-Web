/**
 * Módulo de acessibilidade visual para movimento reduzido.
 * Congela GIFs animados no primeiro quadro quando o usuário ativa
 * prefers-reduced-motion no sistema operacional (WCAG 2.2.2).
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});

  function captureFirstFrame(imageElement) {
    if (imageElement.dataset.frozen === 'true') {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;
      const context = canvas.getContext('2d');

      if (!context || canvas.width === 0 || canvas.height === 0) {
        return;
      }

      context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      imageElement.dataset.frozen = 'true';
      imageElement.src = canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Não foi possível congelar a animação do recurso:', error);
    }
  }

  function initReducedMotion() {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reducedMotionQuery.matches) {
      return;
    }

    const animatedImages = document.querySelectorAll('img[data-animated-gif]');
    animatedImages.forEach((imageElement) => {
      if (imageElement.complete && imageElement.naturalWidth > 0) {
        captureFirstFrame(imageElement);
        return;
      }

      imageElement.addEventListener(
        'load',
        () => captureFirstFrame(imageElement),
        { once: true }
      );
    });
  }

  namespace.initReducedMotion = initReducedMotion;
})();

