/**
 * Módulo de galeria inline e visualizador ampliado (<dialog> modal) para Cartografias.
 * Mantém a proporção 1:1 nos cards, exibe ícones indicativos de mídia e anima abertura/saída.
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
   * Fecha a modal aguardando a animação de saída em navegadores sem transition de overlay.
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
          new Promise((resolve) => window.setTimeout(resolve, 500)),
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
   * Garante light-dismiss animado (clicar fora da caixa) em navegadores sem closedBy nativo.
   */
  function attachDialogDismissHandlers(dialogElement, closeButton) {
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        closeTopLayerDialog(dialogElement);
      });
    }

    dialogElement.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayerDialog(dialogElement);
    });

    const isPointerOutsideDialog = (event) => {
      const rect = dialogElement.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };

    let startedOutside = false;

    dialogElement.addEventListener('pointerdown', (event) => {
      startedOutside = isPointerOutsideDialog(event);
    });

    dialogElement.addEventListener('pointerup', (event) => {
      if (startedOutside && isPointerOutsideDialog(event)) {
        closeTopLayerDialog(dialogElement);
      }
      startedOutside = false;
    });
  }

  /**
   * Retorna um ícone SVG inline simbolizando foto ou vídeo.
   */
  function createTypeIconMarkup(mediaType) {
    if (mediaType === 'video') {
      return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><polygon points="6.5,5.2 11.2,8 6.5,10.8" fill="currentColor"/></svg>';
    }

    return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="5.75" cy="6.25" r="1" fill="currentColor"/><path d="M3.5 11.5L6.8 8.2L9.2 10.6L10.8 9L13 11.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /**
   * Cria o elemento visual (imagem ou vídeo pausável) com animação de entrada e proteções.
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
    const titleElement = dialogElement.querySelector('#gallery-dialog-title');
    const subtitleElement = dialogElement.querySelector('.gallery-dialog-subtitle');
    const viewportElement = dialogElement.querySelector('.gallery-dialog-viewport');
    const captionElement = dialogElement.querySelector('.gallery-dialog-caption');
    const counterElement = dialogElement.querySelector('.gallery-dialog-counter');
    const tabsElement = dialogElement.querySelector('.gallery-dialog-tabs');
    const prevButton = dialogElement.querySelector('[data-dialog-action="prev"]');
    const nextButton = dialogElement.querySelector('[data-dialog-action="next"]');
    const closeButton = dialogElement.querySelector('[data-dialog-action="close"]');

    if (
      !titleElement ||
      !subtitleElement ||
      !viewportElement ||
      !captionElement ||
      !counterElement ||
      !tabsElement ||
      !prevButton ||
      !nextButton
    ) {
      return null;
    }

    attachDialogDismissHandlers(dialogElement, closeButton);

    let activeEntry = null;
    let activeItemIndex = 0;

    function pauseActiveMedia() {
      const activeVideo = viewportElement.querySelector('video');
      if (activeVideo) {
        activeVideo.pause();
      }
    }

    function renderModalItem() {
      if (!activeEntry) {
        return;
      }

      pauseActiveMedia();

      const items = activeEntry.items;
      const item = items[activeItemIndex];
      const total = items.length;

      viewportElement.innerHTML = '';
      const mediaNode = createMediaNode(item, { allowControls: true });
      mediaNode.className = 'gallery-dialog-media media-enter-animated';
      viewportElement.appendChild(mediaNode);

      captionElement.textContent = item.caption || '';
      counterElement.textContent = `${activeItemIndex + 1} / ${total}`;

      const tabButtons = tabsElement.querySelectorAll('button');
      tabButtons.forEach((button, index) => {
        button.setAttribute('aria-pressed', index === activeItemIndex ? 'true' : 'false');
      });
    }

    function renderTabs() {
      tabsElement.innerHTML = '';
      if (!activeEntry) {
        return;
      }

      activeEntry.items.forEach((item, index) => {
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.className = 'gallery-dialog-tab';
        tabButton.setAttribute('aria-pressed', index === activeItemIndex ? 'true' : 'false');
        tabButton.innerHTML = `${createTypeIconMarkup(item.type)}<span>${item.tag || `Item ${index + 1}`}</span>`;
        tabButton.addEventListener('click', () => {
          activeItemIndex = index;
          renderModalItem();
        });
        tabsElement.appendChild(tabButton);
      });
    }

    prevButton.addEventListener('click', () => {
      if (!activeEntry) {
        return;
      }
      const total = activeEntry.items.length;
      activeItemIndex = (activeItemIndex - 1 + total) % total;
      renderModalItem();
    });

    nextButton.addEventListener('click', () => {
      if (!activeEntry) {
        return;
      }
      const total = activeEntry.items.length;
      activeItemIndex = (activeItemIndex + 1) % total;
      renderModalItem();
    });

    dialogElement.addEventListener('close', () => {
      dialogElement.removeAttribute('data-closing');
      pauseActiveMedia();
      viewportElement.innerHTML = '';
      dialogElement.returnValue = '';
    });

    return {
      open(entry, startIndex = 0) {
        dialogElement.removeAttribute('data-closing');
        activeEntry = entry;
        activeItemIndex = startIndex;
        titleElement.textContent = entry.title;
        subtitleElement.textContent = entry.subtitle || '';
        renderTabs();
        renderModalItem();
        dialogElement.showModal();
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
      !labelElement ||
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

      labelElement.textContent = currentItem.tag || 'Registro';
      counterElement.textContent = `${currentIndex + 1}/${total}`;
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
