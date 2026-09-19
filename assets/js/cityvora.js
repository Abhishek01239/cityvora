(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
