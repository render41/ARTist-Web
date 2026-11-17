/**
 * Módulo de galeria inline e visualizador ampliado (<dialog> modal) para Cartografias.
 * Mantém a proporção 1:1 nos cards e permite assistir aos vídeos ou ler QR Codes sem recortes.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});

  /**
   * Garante light-dismiss (fechar ao clicar fora) em navegadores sem suporte nativo a closedBy.
   */
  function attachClosedByFallback(dialogElement) {
    if ('closedBy' in HTMLDialogElement.prototype) {
      return;
    }

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
        dialogElement.close();
      }
      startedOutside = false;
    });
  }

  /**
   * Cria o elemento visual (imagem ou vídeo pausável) correspondente ao item selecionado.
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

    let modalController = null;

    if (dialogElement) {
      modalController = createDialogController(dialogElement);
    }

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

    attachClosedByFallback(dialogElement);

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
      mediaNode.className = 'gallery-dialog-media';
      viewportElement.appendChild(mediaNode);

      captionElement.textContent = item.caption || '';
      counterElement.textContent = `${activeItemIndex + 1} / ${total}`;

      const tabButtons = tabsElement.querySelectorAll('button');
      tabButtons.forEach((button, index) => {
        if (index === activeItemIndex) {
          button.setAttribute('aria-pressed', 'true');
        } else {
          button.setAttribute('aria-pressed', 'false');
        }
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
        tabButton.textContent = item.tag || `Item ${index + 1}`;
        tabButton.setAttribute('aria-pressed', index === activeItemIndex ? 'true' : 'false');
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
      pauseActiveMedia();
      viewportElement.innerHTML = '';
      dialogElement.returnValue = '';
    });

    return {
      open(entry, startIndex = 0) {
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

    function renderSlotItem() {
      const currentItem = items[currentIndex];
      const existingVideo = viewportElement.querySelector('video');
      if (existingVideo) {
        existingVideo.pause();
      }

      viewportElement.innerHTML = '';

      if (currentItem.type === 'video') {
        const videoPreviewWrapper = document.createElement('div');
        videoPreviewWrapper.className = 'media-video-preview';

        const videoElement = createMediaNode(currentItem, { allowControls: true });
        videoElement.className = 'media-frame-asset';
        videoPreviewWrapper.appendChild(videoElement);
        viewportElement.appendChild(videoPreviewWrapper);
      } else {
        const imageElement = createMediaNode(currentItem, { allowControls: false });
        imageElement.className = 'media-frame-asset';
        viewportElement.appendChild(imageElement);
      }

      labelElement.textContent = currentItem.tag || 'Registro';
      counterElement.textContent = `${currentIndex + 1}/${total}`;
    }

    prevButton.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + total) % total;
      renderSlotItem();
    });

    nextButton.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % total;
      renderSlotItem();
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

    renderSlotItem();
  }

  namespace.initMediaGallery = initMediaGallery;
})();
