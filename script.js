/* ============================================================
   Motion system — respects prefers-reduced-motion
   ============================================================ */
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   Scroll-reveal animations
   Adds .is-visible when a .reveal* element enters the viewport.
   One-shot — once revealed, the observer detaches.
   ============================================================ */
(function initReveals() {
  const els = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale'
  );
  if (!els.length) return;

  if (REDUCE_MOTION || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -60px 0px',
  });

  els.forEach(el => io.observe(el));
})();

/* ============================================================
   Count-up stat animations
   Any element with [data-count] eases from 0 → target when
   it enters the viewport. Supports prefix/suffix/delay.
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const delay  = parseInt(el.dataset.delay || '0', 10);
    // Shorter duration for small targets so they don't dwell on intermediate values
    const duration = target <= 10 ? 1000 : 1800;

    const start = () => {
      el.textContent = prefix + '0' + suffix;
      const startTime = performance.now();
      function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(target * easeOutCubic(t));
        el.textContent = prefix + value + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target + suffix;
      }
      requestAnimationFrame(tick);
    };

    if (delay > 0) setTimeout(start, delay);
    else start();
  };

  if (REDUCE_MOTION) return; // leave the final value in place

  if (!('IntersectionObserver' in window)) {
    counters.forEach(run);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
})();

/* ============================================================
   Countdown
   ============================================================ */
const LAUNCH_DATE = new Date('2026-06-07T09:00:00');

const daysEl    = document.getElementById('days');
const hoursEl   = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const yearEl    = document.getElementById('year');

if (yearEl) yearEl.textContent = new Date().getFullYear();

function updateCountdown() {
  const diff = LAUNCH_DATE - new Date();
  if (diff <= 0) {
    [daysEl, hoursEl, minutesEl, secondsEl].forEach(el => el && (el.textContent = '00'));
    return;
  }
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (daysEl)    daysEl.textContent    = String(days).padStart(2, '0');
  if (hoursEl)   hoursEl.textContent   = String(hours).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ============================================================
   Uganda Map (Leaflet)
   ============================================================ */
(function initUgandaMap() {
  const el = document.getElementById('ugandaMap');
  if (!el || typeof L === 'undefined') return;

  const districts = [
    {
      name:   'Kampala',
      role:   'HQ & Slums Outreach',
      blurb:  'Studio HQ where kits are designed and assembled, plus active outreach in Kampala\'s informal settlements.',
      latlng: [0.3476, 32.5825],
      color:  getCssVar('--orange', '#F58220'),
    },
    {
      name:   'Bugiri',
      role:   'Eastern Uganda',
      blurb:  'Distribution and partner-school programs serving Bugiri district and surrounding communities in eastern Uganda.',
      latlng: [0.5708, 33.7414],
      color:  getCssVar('--green', '#3DA52E'),
    },
    {
      name:   'Mayuge',
      role:   'Eastern Uganda',
      blurb:  'Outreach and dignity-kit distribution across schools and community centres in Mayuge district.',
      latlng: [0.4569, 33.4742],
      color:  getCssVar('--yellow', '#FFCE3A'),
    },
  ];

  const map = L.map(el, {
    center:          [1.55, 32.3],
    zoom:            7,
    minZoom:         6,
    maxZoom:         12,
    scrollWheelZoom: false,          // don't hijack page scroll
    zoomControl:     true,
    attributionControl: true,
    maxBounds:       [[-2.5, 28], [5.5, 36.5]],
    maxBoundsViscosity: 0.8,
  });

  // Clean, minimal light tiles — lets the brand markers stand out
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> ' +
      '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom:    19,
  }).addTo(map);

  // Highlight Uganda outline with a soft halo (drawn as a wide polyline ring)
  // We use a simplified Uganda border. Coords approximate; for the visual halo only.
  const ugandaBorder = [
    [4.21, 30.85], [4.20, 33.83], [3.42, 34.18], [3.04, 34.62], [2.20, 34.95],
    [1.50, 35.00], [1.06, 34.86], [0.65, 34.74], [-0.04, 34.07], [-0.95, 33.90],
    [-1.05, 32.00], [-0.95, 31.86], [-0.99, 30.83], [-0.50, 30.21], [-0.10, 29.87],
    [0.99, 29.91], [1.39, 30.83], [2.20, 31.18], [2.95, 30.96], [3.51, 30.83],
    [4.21, 30.85]
  ];

  L.polygon(ugandaBorder, {
    color:       getCssVar('--green-deep', '#1F6B16'),
    weight:      2.5,
    opacity:     0.9,
    fillColor:   getCssVar('--orange', '#F58220'),
    fillOpacity: 0.04,
    interactive: false,
  }).addTo(map);

  // Brand-styled markers
  districts.forEach(d => {
    const html = `
      <div class="brand-pin" style="--c:${d.color}">
        <span class="brand-pin__pulse"></span>
        <span class="brand-pin__core"></span>
      </div>`;

    const icon = L.divIcon({
      className: 'brand-pin-wrap',
      html,
      iconSize:   [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker(d.latlng, { icon, riseOnHover: true }).addTo(map);

    marker.bindPopup(`
      <div class="map-popup" style="--c:${d.color}">
        <span class="map-popup__tag">${d.role}</span>
        <strong>${d.name}</strong>
        <p>${d.blurb}</p>
      </div>
    `, {
      closeButton: false,
      offset:      [0, -8],
      maxWidth:    260,
    });

    marker.on('mouseover', () => marker.openPopup());
  });

  // Open the Kampala popup by default once the map renders
  setTimeout(() => map.invalidateSize(), 100);
})();

function getCssVar(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch (_) {
    return fallback;
  }
}
