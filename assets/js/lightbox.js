/**
 * Darshan Naik Portfolio & Blog — Image Zoom & Lightbox
 * Fully accessible, mobile-optimized (pinch-to-zoom, swipe-to-dismiss, double-tap, pan).
 * Modern Web Guidance compliant.
 */
(function () {
  'use strict';

  function initLightbox() {
    const dialog = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    const stage = document.getElementById('lightbox-stage');
    const caption = document.getElementById('lightbox-caption');
    const zoomLevelEl = document.getElementById('lightbox-zoom-level');
    const btnZoomIn = document.getElementById('lightbox-zoom-in');
    const btnZoomOut = document.getElementById('lightbox-zoom-out');
    const btnReset = document.getElementById('lightbox-zoom-reset');
    const btnClose = document.getElementById('lightbox-close');

    if (!dialog || !img || !stage) return;

    // Zoom & pan state
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    const minScale = 1;
    const maxScale = 4.5;
    const zoomStep = 0.5;

    // Pointer / mouse drag state
    let isMouseDragging = false;
    let mouseDragged = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    let initialTranslateX = 0;
    let initialTranslateY = 0;

    // Touch gesture state
    let touchMode = 'none'; // 'none' | 'pan' | 'pinch' | 'swipe'
    let touchStartX = 0;
    let touchStartY = 0;
    let touchInitialTranslateX = 0;
    let touchInitialTranslateY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let pinchCenter = { x: 0, y: 0 };
    let lastTapTime = 0;
    let touchMoved = false;

    function updateZoomDisplay() {
      if (zoomLevelEl) {
        zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
      }
      if (scale > 1) {
        img.classList.add('is-zoomed');
      } else {
        img.classList.remove('is-zoomed');
      }
    }

    function clampTranslation() {
      if (scale <= 1) {
        translateX = 0;
        translateY = 0;
        return;
      }
      const stageRect = stage.getBoundingClientRect();
      const imgWidth = img.offsetWidth || 1;
      const imgHeight = img.offsetHeight || 1;

      const visualWidth = imgWidth * scale;
      const visualHeight = imgHeight * scale;

      const maxPanX = Math.max(0, (visualWidth - stageRect.width) / 2 + 30);
      const maxPanY = Math.max(0, (visualHeight - stageRect.height) / 2 + 30);

      translateX = Math.min(Math.max(translateX, -maxPanX), maxPanX);
      translateY = Math.min(Math.max(translateY, -maxPanY), maxPanY);
    }

    function applyTransform(animated = true, opacity = 1) {
      if (animated) {
        img.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease';
      } else {
        img.style.transition = 'none';
      }
      img.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
      img.style.opacity = `${opacity}`;
      updateZoomDisplay();
    }

    function resetZoom(animated = true) {
      scale = 1;
      translateX = 0;
      translateY = 0;
      applyTransform(animated, 1);
    }

    function setZoom(newScale, clientX, clientY, animated = true) {
      const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
      if (clampedScale === scale && clampedScale !== 1) return;

      if (clampedScale === 1) {
        resetZoom(animated);
        return;
      }

      if (clientX !== undefined && clientY !== undefined) {
        const stageRect = stage.getBoundingClientRect();
        const stageCenterX = stageRect.left + stageRect.width / 2;
        const stageCenterY = stageRect.top + stageRect.height / 2;

        const pointerRelX = clientX - stageCenterX - translateX;
        const pointerRelY = clientY - stageCenterY - translateY;

        const ratio = clampedScale / scale;
        translateX -= pointerRelX * (ratio - 1);
        translateY -= pointerRelY * (ratio - 1);
      }

      scale = clampedScale;
      clampTranslation();
      applyTransform(animated, 1);
    }

    function zoomIn() {
      setZoom(scale + zoomStep);
    }

    function zoomOut() {
      setZoom(scale - zoomStep);
    }

    function openLightbox(sourceImg) {
      const src = sourceImg.currentSrc || sourceImg.src;
      const alt = sourceImg.alt || '';

      img.src = src;
      img.alt = alt;
      if (caption) {
        caption.textContent = alt;
      }

      resetZoom(false);

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }

      // Lock background scroll on mobile browsers
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      resetZoom(false);
      img.src = '';

      // Unlock background scroll
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    // Modern Web Guidance fallback for light dismiss where closedby is unsupported
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) {
          closeLightbox();
        }
      });
    }

    // Dismiss when tapping/clicking directly on stage outside image (at 1x)
    stage.addEventListener('click', function (e) {
      if (e.target === stage && scale === 1 && !mouseDragged && !touchMoved) {
        closeLightbox();
      }
    });

    // Desktop Click-to-zoom on image
    img.addEventListener('click', function (e) {
      if (mouseDragged || touchMoved) return;
      if (scale === 1) {
        setZoom(2.2, e.clientX, e.clientY, true);
      } else {
        resetZoom(true);
      }
    });

    // ─────────────────────────────────────────────────────────
    // MOUSE DRAG / PAN (DESKTOP)
    // ─────────────────────────────────────────────────────────
    stage.addEventListener('mousedown', function (e) {
      if (scale <= 1) return;
      if (e.button !== 0) return; // Left click only

      isMouseDragging = true;
      mouseDragged = false;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      initialTranslateX = translateX;
      initialTranslateY = translateY;

      img.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isMouseDragging) return;

      const deltaX = e.clientX - mouseStartX;
      const deltaY = e.clientY - mouseStartY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        mouseDragged = true;
      }

      translateX = initialTranslateX + deltaX;
      translateY = initialTranslateY + deltaY;
      clampTranslation();
      applyTransform(false, 1);
    });

    window.addEventListener('mouseup', function () {
      if (!isMouseDragging) return;
      isMouseDragging = false;
      img.classList.remove('is-dragging');
    });

    // Mouse wheel / trackpad scroll zoom
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.83;
      setZoom(scale * zoomFactor, e.clientX, e.clientY, true);
    }, { passive: false });

    // ─────────────────────────────────────────────────────────
    // TOUCH EVENTS (MOBILE & TABLET)
    // Supports: 1-finger pan, 2-finger pinch-to-zoom, swipe-to-dismiss, double-tap
    // ─────────────────────────────────────────────────────────
    stage.addEventListener('touchstart', function (e) {
      touchMoved = false;

      if (e.touches.length === 2) {
        // Pinch-to-zoom start
        touchMode = 'pinch';
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        pinchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartScale = scale;
        pinchCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2
        };
        img.classList.remove('is-dragging');
        e.preventDefault();
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchInitialTranslateX = translateX;
        touchInitialTranslateY = translateY;

        // Check for double-tap
        const now = Date.now();
        if (now - lastTapTime < 320) {
          e.preventDefault();
          lastTapTime = 0;
          if (scale === 1) {
            setZoom(2.2, touch.clientX, touch.clientY, true);
          } else {
            resetZoom(true);
          }
          return;
        }
        lastTapTime = now;

        if (scale > 1) {
          touchMode = 'pan';
          img.classList.add('is-dragging');
        } else {
          touchMode = 'swipe';
        }
      }
    }, { passive: false });

    stage.addEventListener('touchmove', function (e) {
      if (touchMode === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        touchMoved = true;
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        if (pinchStartDistance > 0) {
          const factor = currentDistance / pinchStartDistance;
          const targetScale = Math.min(Math.max(pinchStartScale * factor, minScale), maxScale);
          setZoom(targetScale, pinchCenter.x, pinchCenter.y, false);
        }
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          touchMoved = true;
        }

        if (touchMode === 'pan' && scale > 1) {
          e.preventDefault();
          translateX = touchInitialTranslateX + deltaX;
          translateY = touchInitialTranslateY + deltaY;
          clampTranslation();
          applyTransform(false, 1);
        } else if (touchMode === 'swipe' && scale === 1) {
          // Swipe down to dismiss on mobile
          if (deltaY > 0) {
            e.preventDefault();
            const pullDown = Math.pow(deltaY, 0.88); // Smooth resistance
            const opacity = Math.max(0.4, 1 - deltaY / 320);
            img.style.transition = 'none';
            img.style.transform = `translate3d(0px, ${pullDown}px, 0) scale(1)`;
            img.style.opacity = `${opacity}`;
          }
        }
      }
    }, { passive: false });

    stage.addEventListener('touchend', function (e) {
      if (touchMode === 'swipe' && scale === 1 && e.changedTouches.length === 1) {
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        if (deltaY > 80) {
          // Downward swipe threshold reached -> dismiss smoothly
          closeLightbox();
        } else {
          // Snap back to position
          resetZoom(true);
        }
      } else if (touchMode === 'pan') {
        img.classList.remove('is-dragging');
        clampTranslation();
        applyTransform(true, 1);
      } else if (touchMode === 'pinch') {
        if (scale < 1.05) {
          resetZoom(true);
        } else {
          clampTranslation();
          applyTransform(true, 1);
        }
      }

      if (e.touches.length === 0) {
        touchMode = 'none';
        pinchStartDistance = 0;
      }
    });

    stage.addEventListener('touchcancel', function () {
      touchMode = 'none';
      img.classList.remove('is-dragging');
      if (scale === 1) {
        resetZoom(true);
      }
    });

    // ─────────────────────────────────────────────────────────
    // BUTTON CONTROLS
    // ─────────────────────────────────────────────────────────
    if (btnZoomIn) btnZoomIn.addEventListener('click', zoomIn);
    if (btnZoomOut) btnZoomOut.addEventListener('click', zoomOut);
    if (btnReset) btnReset.addEventListener('click', () => resetZoom(true));
    if (btnClose) btnClose.addEventListener('click', closeLightbox);

    // Keyboard shortcuts
    dialog.addEventListener('keydown', function (e) {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom(true);
      } else if (scale > 1) {
        const step = 40;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          translateX += step;
          clampTranslation();
          applyTransform(true, 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          translateX -= step;
          clampTranslation();
          applyTransform(true, 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          translateY += step;
          clampTranslation();
          applyTransform(true, 1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          translateY -= step;
          clampTranslation();
          applyTransform(true, 1);
        }
      }
    });

    dialog.addEventListener('close', function () {
      resetZoom(false);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    });

    // Bind all content images in blog posts and pages
    function bindContentImages() {
      const images = document.querySelectorAll('.prose img, article.post img, main img:not(.hero-avatar img)');
      images.forEach(function (image) {
        if (image.closest('.hero-avatar') || image.classList.contains('no-zoom')) return;

        image.classList.add('zoomable-image');
        image.setAttribute('tabindex', '0');
        image.setAttribute('role', 'button');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', (image.alt ? `${image.alt} - ` : '') + 'Click to enlarge and zoom');

        function triggerOpen(e) {
          const link = image.closest('a');
          if (link) {
            const href = link.getAttribute('href') || '';
            const isImgLink = /\.(jpe?g|png|webp|gif|svg|avif)($|\?)/i.test(href);
            if (!isImgLink && !href.startsWith('#')) return;
            e.preventDefault();
          }
          openLightbox(image);
        }

        image.addEventListener('click', triggerOpen);
        image.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerOpen(e);
          }
        });
      });
    }

    bindContentImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();
