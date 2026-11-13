/**
 * Módulo do carrossel acessível de Cartografias.
 * Baseado em scroll nativo horizontal + CSS scroll-snap, com controles HTML,
 * marcadores dinâmicos, anúncio em região aria-live e loop progressivo.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});
  const DEBOUNCE_SCROLL_SETTLE_MS = 140;

  /**
   * Calcula a distância horizontal entre o centro do slide e o centro visível da trilha.
   * Usa getBoundingClientRect para independer de offsetParent e incluir scrollLeft.
   */
  function getCenterScrollDelta(trackElement, slideElement) {
    const trackRect = trackElement.getBoundingClientRect();
    const slideRect = slideElement.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    const slideCenter = slideRect.left + slideRect.width / 2;
    return slideCenter - trackCenter;
  }

  /**
   * Ordena os slides pela posição visual atual no eixo horizontal.
   */
  function getSlidesInVisualOrder(slides) {
    return [...slides].sort((slideA, slideB) => {
      return slideA.getBoundingClientRect().left - slideB.getBoundingClientRect().left;
    });
  }

  /**
   * Localiza o slide mais próximo do centro visível da trilha.
   */
  function findNearestSlide(trackElement, slides) {
    let nearestSlide = slides[0];
    let shortestDistance = Number.POSITIVE_INFINITY;

    for (const slide of slides) {
      const distance = Math.abs(getCenterScrollDelta(trackElement, slide));
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestSlide = slide;
      }
    }

    return nearestSlide;
  }

  /**
   * Cria os botões marcadores a partir de data-marker-name de cada slide.
   */
  function createMarkerButtons(domSlides, markersContainer, onSelectSlide) {
    markersContainer.innerHTML = '';

    return domSlides.map((slide, domIndex) => {
      const markerButton = document.createElement('button');
      markerButton.type = 'button';
      markerButton.className = 'carousel-marker';
      markerButton.setAttribute(
        'aria-label',
        slide.dataset.markerName || `Ir para território ${domIndex + 1}`
      );
      markerButton.addEventListener('click', () => onSelectSlide(domIndex));
      markersContainer.appendChild(markerButton);
      return markerButton;
    });
  }

  function initTerritoriesCarousel() {
    const carouselRoot = document.querySelector('.carousel');
    if (!carouselRoot) {
      return;
    }

    const trackElement = carouselRoot.querySelector('.carousel-track');
    const previousButton = carouselRoot.querySelector('[data-direction="previous"]');
    const nextButton = carouselRoot.querySelector('[data-direction="next"]');
    const markersContainer = carouselRoot.querySelector('.carousel-markers');
    const statusRegion = carouselRoot.querySelector('.carousel-status');

    if (!trackElement || !previousButton || !nextButton || !markersContainer || !statusRegion) {
      return;
    }

    const domSlides = Array.from(trackElement.children);
    if (domSlides.length === 0) {
      return;
    }

    const supportsSiblingIndexLooping =
      domSlides.length >= 3 && CSS.supports('order', 'calc(sibling-index())');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let pendingTargetDomIndex = null;
    let navigationToken = 0;
    let lastMarkerDomIndex = -1;
    let lastSettledDomIndex = -1;
    let isScrollFrameScheduled = false;
    let scrollSettleTimerId = null;
    let isCompensatingScroll = false;
    let hasUserInteracted = false;

    const markerButtons = createMarkerButtons(
      domSlides,
      markersContainer,
      (domIndex) => {
        hasUserInteracted = true;
        navigateToDomIndex(domIndex);
      }
    );

    function updateMarkerIndicators(activeDomIndex) {
      if (activeDomIndex === lastMarkerDomIndex) {
        return;
      }

      lastMarkerDomIndex = activeDomIndex;
      markerButtons.forEach((button, index) => {
        if (index === activeDomIndex) {
          button.setAttribute('aria-current', 'true');
        } else {
          button.removeAttribute('aria-current');
        }
      });
    }

    function updateButtonDisabledStates(activeDomIndex) {
      if (supportsSiblingIndexLooping) {
        previousButton.disabled = false;
        nextButton.disabled = false;
        return;
      }

      const visualSlides = getSlidesInVisualOrder(domSlides);
      const activeSlide = domSlides[activeDomIndex];
      const visualIndex = visualSlides.indexOf(activeSlide);
      previousButton.disabled = visualIndex <= 0;
      nextButton.disabled = visualIndex >= visualSlides.length - 1;
    }

    function updateParkedSlidesAccessibility() {
      if (!supportsSiblingIndexLooping) {
        return;
      }

      domSlides.forEach((slide) => {
        const computedOrder = Number.parseInt(getComputedStyle(slide).order, 10) || 0;
        slide.inert = computedOrder !== 0;
      });
    }

    /**
     * Ajusta --current para estacionar slides extremos sem deslocar o card visível.
     */
    function syncLoopParkingWithCompensation(activeDomIndex) {
      if (!supportsSiblingIndexLooping) {
        return;
      }

      const nextVarValue = String(activeDomIndex);
      if (trackElement.style.getPropertyValue('--current') === nextVarValue) {
        updateParkedSlidesAccessibility();
        return;
      }

      const activeSlide = domSlides[activeDomIndex];
      const leftBefore = activeSlide.getBoundingClientRect().left;

      isCompensatingScroll = true;
      const originalBehavior = trackElement.style.scrollBehavior;
      trackElement.style.scrollBehavior = 'auto';
      trackElement.style.scrollSnapType = 'none';
      trackElement.style.overflowX = 'hidden';
      trackElement.style.setProperty('--current', nextVarValue);

      const leftAfter = activeSlide.getBoundingClientRect().left;
      const shiftDelta = leftAfter - leftBefore;
      if (Math.abs(shiftDelta) >= 0.5) {
        trackElement.scrollLeft += shiftDelta;
      }

      updateParkedSlidesAccessibility();
      trackElement.style.scrollSnapType = '';
      trackElement.style.scrollBehavior = originalBehavior;

      // Mantém overflow-x oculto por dois quadros para evitar flicker visual no iOS Safari.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          trackElement.style.overflowX = '';
          isCompensatingScroll = false;
        });
      });
    }

    function scrollToSlide(targetSlide, useSmoothScroll) {
      const delta = getCenterScrollDelta(trackElement, targetSlide);
      if (Math.abs(delta) < 1) {
        return;
      }

      const useSmooth = useSmoothScroll && !reducedMotionQuery.matches;
      const originalBehavior = trackElement.style.scrollBehavior;

      if (!useSmooth) {
        trackElement.style.scrollBehavior = 'auto';
      }

      trackElement.scrollTo({
        left: trackElement.scrollLeft + delta,
        behavior: useSmooth ? 'smooth' : 'auto',
      });

      if (!useSmooth) {
        trackElement.style.scrollBehavior = originalBehavior;
      }
    }

    function navigateToDomIndex(targetDomIndex) {
      const targetSlide = domSlides[targetDomIndex];
      if (!targetSlide) {
        return;
      }

      navigationToken += 1;
      const currentToken = navigationToken;
      pendingTargetDomIndex = targetDomIndex;
      updateMarkerIndicators(targetDomIndex);
      scrollToSlide(targetSlide, true);

      // Caso o deslocamento já esteja no alvo (delta < 1px), finaliza de imediato.
      if (Math.abs(getCenterScrollDelta(trackElement, targetSlide)) < 1) {
        handleScrollSettled({ announce: true, token: currentToken });
      }
    }

    function navigateByDirection(step) {
      hasUserInteracted = true;
      const visualSlides = getSlidesInVisualOrder(domSlides);
      const referenceSlide =
        pendingTargetDomIndex !== null
          ? domSlides[pendingTargetDomIndex]
          : findNearestSlide(trackElement, visualSlides);

      const currentVisualIndex = visualSlides.indexOf(referenceSlide);
      if (currentVisualIndex === -1) {
        return;
      }

      const nextVisualIndex = currentVisualIndex + step;
      if (nextVisualIndex < 0 || nextVisualIndex >= visualSlides.length) {
        return;
      }

      const targetSlide = visualSlides[nextVisualIndex];
      navigateToDomIndex(domSlides.indexOf(targetSlide));
    }

    function handleScrollSettled({ announce, token = null }) {
      if (isCompensatingScroll) {
        return;
      }

      // Ignora um scrollend antigo se um novo clique já iniciou outro deslocamento.
      if (token !== null && token !== navigationToken) {
        return;
      }

      const visualSlides = getSlidesInVisualOrder(domSlides);
      const settledSlide = findNearestSlide(trackElement, visualSlides);
      const settledDomIndex = domSlides.indexOf(settledSlide);

      pendingTargetDomIndex = null;
      updateMarkerIndicators(settledDomIndex);
      syncLoopParkingWithCompensation(settledDomIndex);
      updateButtonDisabledStates(settledDomIndex);

      if (announce && settledDomIndex !== lastSettledDomIndex) {
        const territoryTitle =
          settledSlide.querySelector('.territory-name')?.textContent?.replace(':', '') ||
          `Território ${settledDomIndex + 1}`;
        statusRegion.textContent = `Território ${settledDomIndex + 1} de ${domSlides.length}: ${territoryTitle}`;
      }

      lastSettledDomIndex = settledDomIndex;
    }

    function handleLiveScroll() {
      if (isCompensatingScroll || pendingTargetDomIndex !== null || isScrollFrameScheduled) {
        return;
      }

      isScrollFrameScheduled = true;
      requestAnimationFrame(() => {
        isScrollFrameScheduled = false;
        if (isCompensatingScroll || pendingTargetDomIndex !== null) {
          return;
        }

        const visualSlides = getSlidesInVisualOrder(domSlides);
        const nearestSlide = findNearestSlide(trackElement, visualSlides);
        updateMarkerIndicators(domSlides.indexOf(nearestSlide));
      });
    }

    previousButton.addEventListener('click', () => navigateByDirection(-1));
    nextButton.addEventListener('click', () => navigateByDirection(1));

    trackElement.addEventListener(
      'pointerdown',
      () => {
        hasUserInteracted = true;
      },
      { passive: true }
    );

    trackElement.addEventListener('scroll', handleLiveScroll, { passive: true });

    if ('onscrollend' in window) {
      trackElement.addEventListener('scrollend', () => {
        handleScrollSettled({ announce: true, token: navigationToken });
      });
    } else {
      trackElement.addEventListener(
        'scroll',
        () => {
          clearTimeout(scrollSettleTimerId);
          const scheduledToken = navigationToken;
          scrollSettleTimerId = window.setTimeout(() => {
            handleScrollSettled({ announce: true, token: scheduledToken });
          }, DEBOUNCE_SCROLL_SETTLE_MS);
        },
        { passive: true }
      );
    }

    const initialDomIndex = Math.max(
      0,
      domSlides.findIndex((slide) => slide.dataset.initialSlide === 'true')
    );

    if (supportsSiblingIndexLooping) {
      trackElement.style.setProperty('--current', String(initialDomIndex));
      updateParkedSlidesAccessibility();
    }

    scrollToSlide(domSlides[initialDomIndex], false);
    handleScrollSettled({ announce: false });

    // Reajusta o centro inicial após o carregamento das fontes caso o usuário ainda não tenha interagido.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!hasUserInteracted) {
          scrollToSlide(domSlides[initialDomIndex], false);
          handleScrollSettled({ announce: false });
        }
      });
    }
  }

  namespace.initTerritoriesCarousel = initTerritoriesCarousel;
})();

