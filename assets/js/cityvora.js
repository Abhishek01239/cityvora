(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // First-visit homepage intro: complete the motion study, then release the page.
  const intro = document.querySelector('[data-site-intro]');
  if (intro && root.classList.contains('cv-intro-pending')) {
    const introVideo = intro.querySelector('[data-intro-video]');
    const skipButton = intro.querySelector('[data-skip-intro]');
    const retryButton = intro.querySelector('[data-intro-retry]');
    const introSound = intro.querySelector('[data-intro-sound]');
    const pageParts = [...document.querySelectorAll('body > header, body > main, body > footer')];
    let finished = false;
    let removed = false;

    intro.removeAttribute('aria-hidden');
    pageParts.forEach(part => { part.inert = true; });

    const cleanupIntro = () => {
      if (removed) return;
      removed = true;
      root.classList.remove('cv-intro-leaving');
      intro.remove();
      pageParts.forEach(part => { part.inert = false; });
      window.dispatchEvent(new CustomEvent('cityvora:intro-finished', {
        detail: { soundEnabled: introVideo ? !introVideo.muted : false }
      }));
    };

    const onIntroKeydown = event => {
      if (event.key === 'Escape') finishIntro();
    };

    const finishIntro = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener('keydown', onIntroKeydown);
      try { window.sessionStorage.setItem('cityvora-intro-seen', '1'); } catch (_) {}
      if (introVideo) introVideo.pause();
      root.classList.add('cv-intro-leaving');
      root.classList.remove('cv-intro-pending');
      intro.addEventListener('transitionend', event => {
        if (event.target === intro && event.propertyName === 'opacity') cleanupIntro();
      }, { once: true });
      window.setTimeout(cleanupIntro, 750);
    };

    window.addEventListener('keydown', onIntroKeydown);
    if (skipButton) skipButton.addEventListener('click', finishIntro);
    if (introSound && introVideo) {
      introSound.addEventListener('click', () => {
        introVideo.muted = !introVideo.muted;
        const enabled = !introVideo.muted;
        introSound.textContent = enabled ? 'Sound on' : 'Sound off';
        introSound.setAttribute('aria-pressed', String(enabled));
        introSound.setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
      });
    }
    if (retryButton && introVideo) {
      retryButton.addEventListener('click', async () => {
        try {
          await introVideo.play();
          retryButton.hidden = true;
        } catch (_) {}
      });
    }
    if (introVideo) {
      introVideo.addEventListener('ended', finishIntro, { once: true });
      introVideo.addEventListener('error', finishIntro, { once: true });
      if (introVideo.error) finishIntro();
      else {
        try {
          const playback = introVideo.play();
          if (playback && typeof playback.catch === 'function') playback.catch(() => {
            if (!finished && retryButton) retryButton.hidden = false;
          });
        } catch (_) {
          if (retryButton) retryButton.hidden = false;
        }
      }
      if (skipButton) requestAnimationFrame(() => skipButton.focus({ preventScroll: true }));
    } else finishIntro();
  }

  // The homepage loop starts silently only when motion is allowed; sound is opt-in.
  const motionVideo = document.querySelector('[data-motion-video]');
  const motionSound = document.querySelector('[data-motion-sound]');
  if (motionVideo && motionSound) {
    const updateMotionSound = () => {
      const enabled = !motionVideo.muted;
      motionSound.textContent = enabled ? 'Sound on' : 'Sound off';
      motionSound.setAttribute('aria-pressed', String(enabled));
      motionSound.setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
    };
    const startMotion = event => {
      if (event && event.detail && event.detail.soundEnabled) {
        motionVideo.muted = false;
        updateMotionSound();
      }
      const playback = motionVideo.play();
      if (playback && typeof playback.catch === 'function') playback.catch(() => {
        if (!motionVideo.muted) {
          motionVideo.muted = true;
          updateMotionSound();
          const retry = motionVideo.play();
          if (retry && typeof retry.catch === 'function') retry.catch(() => {});
        }
      });
    };
    if (!reduced) {
      if (root.classList.contains('cv-intro-pending')) {
        window.addEventListener('cityvora:intro-finished', startMotion, { once: true });
      } else startMotion();
    }
    motionSound.addEventListener('click', async () => {
      motionVideo.muted = !motionVideo.muted;
      const enabled = !motionVideo.muted;
      updateMotionSound();
      if (enabled && motionVideo.paused) {
        try { await motionVideo.play(); } catch (_) {
          motionVideo.muted = true;
          updateMotionSound();
        }
      }
    });
  }

  // Page-load reveal
  requestAnimationFrame(() => root.classList.add('cv-ready'));

  // Scroll progress
  const progress = document.querySelector('[data-scroll-progress]');
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Scroll reveal
  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // Magnetic / tilt cards
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        card.style.setProperty('--rx', (y * -4) + 'deg');
        card.style.setProperty('--ry', (x * 4) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Subtle pointer spotlight
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    const spotlight = document.querySelector('.pointer-spotlight');
    if (spotlight) {
      window.addEventListener('pointermove', e => {
        spotlight.style.setProperty('--x', e.clientX + 'px');
        spotlight.style.setProperty('--y', e.clientY + 'px');
      }, { passive: true });
    }
  }

  // City search/filter
  const search = document.querySelector('[data-city-search]');
  const cards = [...document.querySelectorAll('[data-city-card]')];
  const empty = document.querySelector('[data-city-empty]');
  if (search && cards.length) {
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const haystack = (card.dataset.city + ' ' + card.dataset.state + ' ' + card.dataset.region).toLowerCase();
        const show = !q || haystack.includes(q);
        card.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    };
    search.addEventListener('input', filter);
  }

  // Article reading progress + active heading
  const article = document.querySelector('.article-page');
  const articleProgress = document.querySelector('[data-article-progress]');
  if (article && articleProgress) {
    const updateArticle = () => {
      const top = article.getBoundingClientRect().top + window.scrollY;
      const height = Math.max(1, article.offsetHeight - window.innerHeight);
      const value = Math.min(1, Math.max(0, (window.scrollY - top + 90) / height));
      articleProgress.style.transform = 'scaleX(' + value + ')';
    };
    window.addEventListener('scroll', updateArticle, { passive: true });
    updateArticle();
  }

  // Newsletter signup: subscribe through the Cityvora Brevo endpoint.
  const form = document.querySelector('[data-newsletter]');
  if (form) {
    const status = form.querySelector('[data-newsletter-status]');
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!input || !button) return;

      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }

      button.disabled = true;
      button.textContent = 'Joining…';
      if (status) status.textContent = '';

      try {
        const response = await fetch(form.getAttribute('action') || '/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ email: input.value.trim() })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Signup failed');

        form.reset();
        button.disabled = false;
        button.textContent = 'You’re on the list ✓';
        if (status) status.textContent = 'Thanks — check your inbox for a welcome email.';
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Join the list ↗';
        if (status) status.textContent = error.message || 'Something went wrong. Please try again.';
      }
    });
  }
})();
