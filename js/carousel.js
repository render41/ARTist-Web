/**
 * Módulo do carrossel acessível de Cartografias.
 * Baseado em scroll nativo horizontal + CSS scroll-snap, com transição previsível
 * pelos botões anterior/próximo, marcadores diretos e teclado.
 */
(() => {
  'use strict';

  const namespace = (window.ArtistWebModules = window.ArtistWebModules || {});
  const DEBOUNCE_SCROLL_SETTLE_MS = 140;
  const PROGRAMMATIC_SCROLL_FALLBACK_MS = 550;

  /**
   * Calcula o deslocamento horizontal entre o centro do slide e o centro visível da trilha.
   */
  function getCenterScrollDelta(trackElement, slideElement) {
    const trackRect = trackElement.getBoundingClientRect();
    const slideRect = slideElement.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    const slideCenter = slideRect.left + slideRect.width / 2;
    return slideCenter - trackCenter;
  }

  /**
   * Localiza o índice do slide mais próximo do centro visível da trilha.
   */
  function findNearestSlideIndex(trackElement, slides) {
    let nearestIndex = 0;
    let shortestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(getCenterScrollDelta(trackElement, slide));
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  /**
   * Gera os botões marcadores com nomes acessíveis a partir dos slides.
   */
  function createMarkerButtons(slides, markersContainer, onSelectSlide) {
    markersContainer.innerHTML = '';

    return slides.map((slide, index) => {
      const markerButton = document.createElement('button');
      markerButton.type = 'button';
      markerButton.className = 'carousel-marker';
      markerButton.setAttribute(
        'aria-label',
        slide.dataset.markerName || `Ir para território ${index + 1}`
      );
      markerButton.addEventListener('click', () => onSelectSlide(index));
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

    const slides = Array.from(trackElement.querySelectorAll('.territory-card'));
    if (slides.length === 0) {
      return;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const totalSlides = slides.length;

    let currentIndex = 0;
    let pendingTargetIndex = null;
    let navigationToken = 0;
    let lastMarkerIndex = -1;
    let lastSettledIndex = -1;
    let isScrollFrameScheduled = false;
    let scrollSettleTimerId = null;
    let programmaticFallbackTimerId = null;

    const markerButtons = createMarkerButtons(slides, markersContainer, (index) => {
      navigateToIndex(index);
    });

    function updateMarkerIndicators(activeIndex) {
      if (activeIndex === lastMarkerIndex) {
        return;
      }

      lastMarkerIndex = activeIndex;
      markerButtons.forEach((button, index) => {
        if (index === activeIndex) {
          button.setAttribute('aria-current', 'true');
        } else {
          button.removeAttribute('aria-current');
        }
      });
    }

    function clearProgrammaticScrollState() {
      clearTimeout(programmaticFallbackTimerId);
      programmaticFallbackTimerId = null;
      trackElement.classList.remove('is-programmatic-scroll');
    }

    function announceSettledSlide(index) {
      const activeSlide = slides[index];
      const territoryTitle =
        activeSlide?.querySelector('.territory-name')?.textContent?.replace(':', '') ||
        `Território ${index + 1}`;
      statusRegion.textContent = `Território ${index + 1} de ${totalSlides}: ${territoryTitle}`;
    }

    function scrollToSlide(targetIndex, { smooth, token = null }) {
      const targetSlide = slides[targetIndex];
      if (!targetSlide) {
        return;
      }

      const maxScrollLeft = Math.max(0, trackElement.scrollWidth - trackElement.clientWidth);
      const rawTargetLeft = trackElement.scrollLeft + getCenterScrollDelta(trackElement, targetSlide);
      const clampedTargetLeft = Math.min(maxScrollLeft, Math.max(0, rawTargetLeft));

      if (Math.abs(clampedTargetLeft - trackElement.scrollLeft) < 1) {
        clearProgrammaticScrollState();
        pendingTargetIndex = null;
        return;
      }

      const useSmooth = smooth && !reducedMotionQuery.matches;
      if (useSmooth) {
        // Desativa temporariamente o scroll-snap para evitar que o navegador aborte a animação no meio.
        trackElement.classList.add('is-programmatic-scroll');
        clearTimeout(programmaticFallbackTimerId);
        programmaticFallbackTimerId = window.setTimeout(() => {
          finalizeNavigation({ announce: true, token });
        }, PROGRAMMATIC_SCROLL_FALLBACK_MS);
      } else {
        clearProgrammaticScrollState();
      }

      trackElement.scrollTo({
        left: clampedTargetLeft,
        behavior: useSmooth ? 'smooth' : 'auto',
      });
    }

    function finalizeNavigation({ announce, token = null }) {
      if (token !== null && token !== navigationToken) {
        return;
      }

      clearProgrammaticScrollState();

      const settledIndex =
        pendingTargetIndex !== null
          ? pendingTargetIndex
          : findNearestSlideIndex(trackElement, slides);

      pendingTargetIndex = null;
      currentIndex = settledIndex;
      updateMarkerIndicators(settledIndex);

      if (announce && settledIndex !== lastSettledIndex) {
        announceSettledSlide(settledIndex);
      }

      lastSettledIndex = settledIndex;
    }

    function navigateToIndex(targetIndex) {
      if (targetIndex < 0 || targetIndex >= totalSlides) {
        return;
      }

      navigationToken += 1;
      const currentToken = navigationToken;
      currentIndex = targetIndex;
      pendingTargetIndex = targetIndex;
      updateMarkerIndicators(targetIndex);
      scrollToSlide(targetIndex, { smooth: true, token: currentToken });
    }

    function navigateByStep(step) {
      const baseIndex = pendingTargetIndex !== null ? pendingTargetIndex : currentIndex;
      const nextIndex = (baseIndex + step + totalSlides) % totalSlides;
      navigateToIndex(nextIndex);
    }

    function handleLiveScroll() {
      if (pendingTargetIndex !== null || isScrollFrameScheduled) {
        return;
      }

      isScrollFrameScheduled = true;
      requestAnimationFrame(() => {
        isScrollFrameScheduled = false;
        if (pendingTargetIndex !== null) {
          return;
        }

        const nearestIndex = findNearestSlideIndex(trackElement, slides);
        currentIndex = nearestIndex;
        updateMarkerIndicators(nearestIndex);
      });
    }

    previousButton.addEventListener('click', () => navigateByStep(-1));
    nextButton.addEventListener('click', () => navigateByStep(1));

    trackElement.addEventListener('keydown', (event) => {
      if (event.target !== trackElement) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateByStep(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateByStep(-1);
      }
    });

    trackElement.addEventListener('scroll', handleLiveScroll, { passive: true });

    if ('onscrollend' in window) {
      trackElement.addEventListener('scrollend', () => {
        finalizeNavigation({ announce: true, token: navigationToken });
      });
    } else {
      trackElement.addEventListener(
        'scroll',
        () => {
          clearTimeout(scrollSettleTimerId);
          const scheduledToken = navigationToken;
          scrollSettleTimerId = window.setTimeout(() => {
            finalizeNavigation({ announce: true, token: scheduledToken });
          }, DEBOUNCE_SCROLL_SETTLE_MS);
        },
        { passive: true }
      );
    }

    // Inicia explicitamente no primeiro elemento (Messejana) sem animação.
    currentIndex = 0;
    lastSettledIndex = 0;
    updateMarkerIndicators(0);
    scrollToSlide(0, { smooth: false });
  }

  namespace.initTerritoriesCarousel = initTerritoriesCarousel;
})();
