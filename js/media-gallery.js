/**
 * Módulo de galeria inline e visualizador expandido minimalista (<dialog>) para Cartografias.
 * Ao expandir, exibe todas as imagens e vídeos da série em sequência vertical imersiva sobre fundo escuro.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});

  let supportsDisplayTransition;

  /**
   * Detecta suporte real à transição discreta de display para animação de saída do top layer.
   */
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) {
      return supportsDisplayTransition;
    }

    if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
      supportsDisplayTransition = false;
      return false;
    }

    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();
  }

  /**
   * Fecha o visualizador aguardando a transição de saída quando overlay/display não é suportado.
   */
  async function closeTopLayerDialog(dialogElement) {
    if (!dialogElement.open) {
      return;
    }

    if (!supportsTopLayerExit()) {
      dialogElement.setAttribute('data-closing', '');
      const animations = dialogElement.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((animation) => animation.finished)),
          new Promise((resolve) => window.setTimeout(resolve, 450)),
        ]);
      }

      if (!dialogElement.hasAttribute('data-closing')) {
        return;
      }
      dialogElement.removeAttribute('data-closing');
    }

    dialogElement.close();
  }

  /**
   * Fecha o modal pelo botão X, pela tecla Esc ou ao tocar no espaço escuro vazio ao redor da mídia.
   */
  function attachDialogDismissHandlers(dialogElement, closeButton, streamElement) {
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        closeTopLayerDialog(dialogElement);
      });
    }

    dialogElement.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayerDialog(dialogElement);
    });

    const isBlankOverlayArea = (target) => {
      return (
        target === dialogElement ||
        target === streamElement ||
        target.classList.contains('gallery-dialog-surface')
      );
    };

    dialogElement.addEventListener('click', (event) => {
      if (isBlankOverlayArea(event.target)) {
        closeTopLayerDialog(dialogElement);
      }
    });
  }

  /**
   * Retorna ícone SVG inline indicando fotografia ou vídeo.
   */
  function createTypeIconMarkup(mediaType) {
    if (mediaType === 'video') {
      return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><polygon points="6.5,5.2 11.2,8 6.5,10.8" fill="currentColor"/></svg>';
    }

    return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="5.75" cy="6.25" r="1" fill="currentColor"/><path d="M3.5 11.5L6.8 8.2L9.2 10.6L10.8 9L13 11.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /**
   * Cria elemento de imagem ou vídeo aplicando as proteções contra download.
   */
  function createMediaNode(item, { allowControls }) {
    if (item.type === 'video') {
      const videoElement = document.createElement('video');
      videoElement.src = item.src;
      videoElement.playsInline = true;
      videoElement.preload = 'metadata';

      if (item.poster) {
        videoElement.poster = item.poster;
      }

      if (allowControls) {
        videoElement.controls = true;
      }

      videoElement.setAttribute('aria-label', item.alt || item.caption || 'Vídeo da intervenção');
      namespace.applyMediaProtection?.(videoElement);
      return videoElement;
    }

    const imageElement = document.createElement('img');
    imageElement.src = item.src;
    imageElement.alt = item.alt || item.caption || 'Registro da intervenção urbana';
    imageElement.loading = 'lazy';
    imageElement.decoding = 'async';
    namespace.applyMediaProtection?.(imageElement);
    return imageElement;
  }

  function initMediaGallery() {
    const catalog = namespace.CARTOGRAPHIES_MEDIA;
    const dialogElement = document.getElementById('gallery-dialog');
    const stageElements = document.querySelectorAll('[data-gallery-id]');

    if (!catalog || stageElements.length === 0) {
      return;
    }

    const modalController = dialogElement ? createDialogController(dialogElement) : null;

    stageElements.forEach((stageElement) => {
      const galleryId = stageElement.dataset.galleryId;
      const galleryEntry = catalog[galleryId];
      if (!galleryEntry || !Array.isArray(galleryEntry.items) || galleryEntry.items.length === 0) {
        return;
      }

      setupSlotGallery(stageElement, galleryEntry, modalController);
    });
  }

  function createDialogController(dialogElement) {
    const streamElement = dialogElement.querySelector('.gallery-dialog-stream');
    const closeButton = dialogElement.querySelector('[data-dialog-action="close"]');

    if (!streamElement) {
      return null;
    }

    attachDialogDismissHandlers(dialogElement, closeButton, streamElement);

    function pauseAllVideos() {
      streamElement.querySelectorAll('video').forEach((videoElement) => {
        videoElement.pause();
      });
    }

    function renderVerticalStream(entry) {
      streamElement.innerHTML = '';

      return entry.items.map((item) => {
        const figureElement = document.createElement('figure');
        figureElement.className = 'gallery-dialog-figure';

        const mediaNode = createMediaNode(item, { allowControls: true });
        mediaNode.className = 'gallery-dialog-media';
        figureElement.appendChild(mediaNode);

        if (item.caption) {
          const captionElement = document.createElement('figcaption');
          captionElement.className = 'gallery-dialog-caption';
          captionElement.textContent = item.caption;
          figureElement.appendChild(captionElement);
        }

        streamElement.appendChild(figureElement);
        return figureElement;
      });
    }

    dialogElement.addEventListener('close', () => {
      dialogElement.removeAttribute('data-closing');
      pauseAllVideos();
      streamElement.innerHTML = '';
      dialogElement.returnValue = '';
    });

    return {
      open(entry, startIndex = 0) {
        dialogElement.removeAttribute('data-closing');
        dialogElement.setAttribute('aria-label', `${entry.title} — galeria ampliada`);
        const renderedFigures = renderVerticalStream(entry);
        dialogElement.showModal();

        const targetFigure = renderedFigures[startIndex] || renderedFigures[0];
        if (targetFigure) {
          requestAnimationFrame(() => {
            targetFigure.scrollIntoView({ block: 'center', behavior: 'auto' });
          });
        }
      },
    };
  }

  function setupSlotGallery(slotElement, galleryEntry, modalController) {
    const viewportElement = slotElement.querySelector('.media-viewport');
    const prevButton = slotElement.querySelector('[data-slot-action="prev"]');
    const nextButton = slotElement.querySelector('[data-slot-action="next"]');
    const expandButton = slotElement.querySelector('[data-slot-action="expand"]');
    const typeIconElement = slotElement.querySelector('.media-type-icon');
    const labelElement = slotElement.querySelector('.media-step-label');
    const counterElement = slotElement.querySelector('.media-step-counter');

    if (
      !viewportElement ||
      !prevButton ||
      !nextButton ||
      !expandButton ||
      !counterElement
    ) {
      return;
    }

    const items = galleryEntry.items;
    const total = items.length;
    let currentIndex = 0;

    function renderSlotItem({ animate }) {
      const currentItem = items[currentIndex];
      const existingVideo = viewportElement.querySelector('video');
      if (existingVideo) {
        existingVideo.pause();
      }

      viewportElement.innerHTML = '';

      const animationClass = animate ? ' media-enter-animated' : '';

      if (currentItem.type === 'video') {
        const videoPreviewWrapper = document.createElement('div');
        videoPreviewWrapper.className = 'media-video-preview';

        const videoElement = createMediaNode(currentItem, { allowControls: true });
        videoElement.className = `media-frame-asset${animationClass}`;
        videoPreviewWrapper.appendChild(videoElement);
        viewportElement.appendChild(videoPreviewWrapper);
      } else {
        const imageElement = createMediaNode(currentItem, { allowControls: false });
        imageElement.className = `media-frame-asset${animationClass}`;
        viewportElement.appendChild(imageElement);
      }

      if (typeIconElement) {
        typeIconElement.innerHTML = createTypeIconMarkup(currentItem.type);
      }

      if (labelElement) {
        labelElement.textContent = '';
      }

      counterElement.textContent = `${currentIndex + 1} / ${total}`;
    }

    prevButton.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + total) % total;
      renderSlotItem({ animate: true });
    });

    nextButton.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % total;
      renderSlotItem({ animate: true });
    });

    expandButton.addEventListener('click', () => {
      if (modalController) {
        modalController.open(galleryEntry, currentIndex);
      }
    });

    viewportElement.addEventListener('click', (event) => {
      if (event.target.closest('video')) {
        return;
      }
      if (modalController) {
        modalController.open(galleryEntry, currentIndex);
      }
    });

    renderSlotItem({ animate: false });
  }

  namespace.initMediaGallery = initMediaGallery;
})();
