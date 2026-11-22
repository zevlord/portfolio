(function() {
  const runway = document.querySelector('.hero-runway');
  const adam = document.getElementById('adamLayer');
  const cyborg = document.getElementById('cyborgLayer');
  const spark = document.getElementById('heroSpark');
  const plaque = document.getElementById('heroPlaque');

  if (!runway || !adam || !cyborg) return;

  let ticking = false;

  function updateMotion() {
    const rect = runway.getBoundingClientRect();
    const maxScroll = runway.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.min(1, Math.max(0, scrolled / maxScroll));

    // Slow, stately physical convergence: smoothstep S-curve starts ultra-gentle,
    // glides gracefully in mid-flight, and lands softly at progress = 0.75
    const p = Math.min(1, Math.max(0, progress / 0.75));
    const easeProgress = p * p * (3 - 2 * p);

    // Initial separation: 76px shift each across the expansive 550vh runway
    const shift = (1 - easeProgress) * 76;

    adam.style.transform = 'translate3d(' + (-shift).toFixed(2) + 'px, 0, 0)';
    cyborg.style.transform = 'translate3d(' + shift.toFixed(2) + 'px, 0, 0)';

    // Spark between fingertips (peaks right as fingertips make contact at progress 0.75)
    if (spark) {
      if (progress > 0.58 && progress < 0.92) {
        const sparkP = (progress - 0.58) / 0.34;
        const scale = Math.sin(sparkP * Math.PI) * 1.35;
        spark.style.transform = 'translate(-50%, -50%) scale(' + scale.toFixed(3) + ')';
        spark.style.opacity = Math.min(1, Math.sin(sparkP * Math.PI) * 1.4).toFixed(2);
      } else {
        spark.style.transform = 'translate(-50%, -50%) scale(0)';
        spark.style.opacity = '0';
      }
    }

    // High-Contrast Center Title reveal (gradually surfaces over 0.38 - 0.68, then holds solid)
    if (plaque) {
      if (progress > 0.38) {
        const textP = Math.min(1, (progress - 0.38) / 0.30);
        const translateY = (1 - textP) * 20;
        plaque.style.opacity = textP.toFixed(2);
        plaque.style.transform = 'translate(-50%, calc(-50% + ' + translateY.toFixed(1) + 'px))';
        plaque.style.pointerEvents = textP > 0.8 ? 'auto' : 'none';
      } else {
        plaque.style.opacity = '0';
        plaque.style.transform = 'translate(-50%, calc(-50% + 20px))';
        plaque.style.pointerEvents = 'none';
      }
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateMotion);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateMotion();
})();

// Play/Pause Visage Link Video Demo
function playVisageDemo(e) {
  if (e) e.preventDefault();
  const vid = document.getElementById('visageVideo');
  if (vid) {
    if (vid.paused) {
      vid.play();
    } else {
      vid.pause();
    }
  }
}

// Toggle Visage Architecture Drawer
function toggleVisageDrawer(e) {
  if (e) e.preventDefault();
  const drawer = document.getElementById('visageDrawer');
  if (drawer) {
    drawer.classList.toggle('is-active');
  }
}

function switchVisageTab(tab) {
  const tabs = ['specs', 'stream', 'memory', 'osc'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById('visageTab' + t.charAt(0).toUpperCase() + t.slice(1));
    const pane = document.getElementById('visagePane' + t.charAt(0).toUpperCase() + t.slice(1));
    if (tabBtn) tabBtn.classList.toggle('is-active', t === tab);
    if (pane) pane.classList.toggle('is-active', t === tab);
  });
}

// Toggle SAP Architecture Drawer
function toggleSapDrawer(e) {
  if (e) e.preventDefault();
  const drawer = document.getElementById('sapDrawer');
  if (drawer) {
    drawer.classList.toggle('is-active');
  }
}

// Filter Experience / Timeline Nodes
function filterTimeline(category) {
  const buttons = document.querySelectorAll('.exp-filter-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.filter === category);
  });

  const nodes = document.querySelectorAll('.timeline-node');
  nodes.forEach(node => {
    if (category === 'all' || node.dataset.category === category) {
      node.classList.remove('is-hidden');
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        node.classList.add('is-revealed');
      } else if (rect.top >= window.innerHeight * 0.85) {
        node.classList.remove('is-revealed');
      }
    } else {
      node.classList.add('is-hidden');
      node.classList.remove('is-revealed');
    }
  });

  // Update sidebar nav items visibility if present
  const navItems = document.querySelectorAll('.timeline-nav-item');
  if (navItems.length) {
    navItems.forEach(item => {
      const targetId = item.dataset.target;
      const targetNode = document.getElementById(targetId);
      if (targetNode) {
        if (category === 'all' || targetNode.dataset.category === category) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      }
    });
  }
}

// Backward compatibility alias
function filterExp(category) {
  filterTimeline(category);
}

// Smooth scroll to milestone with pulse feedback
function scrollToMilestone(id) {
  const target = document.getElementById('milestone-' + id);
  if (!target) return;

  const card = target.querySelector('.timeline-card');
  if (card) {
    card.classList.remove('is-pulse');
    void card.offsetWidth; // Force reflow
    card.classList.add('is-pulse');
  }

  // Update active state in sidebar
  document.querySelectorAll('.timeline-nav-item').forEach(item => {
    item.classList.toggle('is-active', item.dataset.target === 'milestone-' + id);
  });

  const isMobile = window.innerWidth <= 768;
  target.scrollIntoView({ behavior: 'smooth', block: isMobile ? 'start' : 'center' });
}

// Scroll-Spy for Timeline Nodes
(function() {
  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.timeline-nav-item').forEach(item => {
          item.classList.toggle('is-active', item.dataset.target === id);
        });
        entry.target.classList.add('is-active');
      } else {
        entry.target.classList.remove('is-active');
      }
    });
  }, {
    rootMargin: '-20% 0px -40% 0px',
    threshold: 0.1
  });

  document.querySelectorAll('.timeline-node').forEach(node => {
    observer.observe(node);
  });
})();

// Media Lightbox Modal Controller
function openVideoModal(videoSrc, title, desc) {
  const modal = document.getElementById('mediaModal');
  const body = document.getElementById('modalMediaBody');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDesc = document.getElementById('modalDesc');

  modalTitle.textContent = title;
  modalMeta.textContent = 'Preview';
  modalDesc.textContent = desc;

  body.innerHTML = `
    <video controls autoplay playsinline style="width: 100%; max-height: 72vh; background: #000;">
      <source src="${videoSrc}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  `;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openImageModal(imgSrc, title, desc) {
  const modal = document.getElementById('mediaModal');
  const body = document.getElementById('modalMediaBody');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDesc = document.getElementById('modalDesc');

  modalTitle.textContent = title;
  modalMeta.textContent = 'Preview';
  modalDesc.textContent = desc;

  body.innerHTML = `
    <img src="${imgSrc}" alt="${title}" style="max-width: 100%; max-height: 72vh; object-fit: contain; margin: auto; display: block;">
  `;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openPdfModal(pdfSrc, title, desc) {
  const modal = document.getElementById('mediaModal');
  const body = document.getElementById('modalMediaBody');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDesc = document.getElementById('modalDesc');

  modalTitle.textContent = title;
  modalMeta.textContent = 'Preview';
  modalDesc.textContent = desc;

  body.innerHTML = `
    <div style="width: 100%; height: 75vh; display: flex; flex-direction: column;">
      <iframe src="${pdfSrc}#toolbar=0" style="width: 100%; flex: 1; border: none; border-radius: 4px; background: #fff;"></iframe>
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 12px; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 6px;">
        <span style="font-family: var(--font-mono); font-size: 11px; color: #a49987; margin-right: auto;">Nikki_Tirta_Iwan_Resume.pdf &middot; 308 KB</span>
        <a href="${pdfSrc}" target="_blank" rel="noopener" download style="display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 12px; color: #f7efe1; text-decoration: none; border-bottom: 1px solid var(--terracotta); padding-bottom: 2px;">
          Download PDF <span>&darr;</span>
        </a>
        <a href="${pdfSrc}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 12px; color: var(--terracotta-bright); text-decoration: none; border-bottom: 1px solid var(--terracotta-bright); padding-bottom: 2px;">
          Open Fullscreen <span>&rarr;</span>
        </a>
      </div>
    </div>
  `;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMediaModal() {
  const modal = document.getElementById('mediaModal');
  const body = document.getElementById('modalMediaBody');
  if (!modal) return;

  const video = body.querySelector('video');
  if (video) {
    video.pause();
    video.src = '';
  }
  body.innerHTML = '';

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Global Keyboard Listener (ESC to close)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeMediaModal();
  }
});

// --------------------------------------------------
// Feature: Atmospheric Fresco Particles Canvas
// --------------------------------------------------
(function() {
  const canvas = document.getElementById('heroAtmosphere');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 32;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.45 + 0.15,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1,
      });
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(235, 219, 186, ' + p.alpha + ')';
      ctx.fill();
    }
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', () => { resize(); initParticles(); });
  resize();
  initParticles();
  render();
})();

// Fade out Jump Pill on deep scroll
window.addEventListener('scroll', function() {
  const jumpPill = document.getElementById('heroJumpPill');
  if (!jumpPill) return;
  const scrollY = window.scrollY || window.pageYOffset;
  if (scrollY > 600) {
    jumpPill.style.opacity = '0';
    jumpPill.style.pointerEvents = 'none';
  } else {
    jumpPill.style.opacity = '1';
    jumpPill.style.pointerEvents = 'auto';
  }
}, { passive: true });

// --------------------------------------------------
// Feature: Project 02 Model Benchmark Switcher (Grounded in IS388 Coursework)
// --------------------------------------------------
const benchmarkData = {
  prophet: {
    metrics: "R²: 0.8349 · MAE: 90,516.00",
    mse: "29,565,117,580 (2.96e10)",
    season: "Additive Seasonality with Weekly & Holiday Decompositions",
    verdict: "<strong>Coursework Finding:</strong> Prophet captured daily and weekly retail cycles with high fidelity, achieving R² = 0.835 and MAE 90,516 by tracking calendar patterns across 12.6M+ transactions."
  },
  sarimax: {
    metrics: "R²: 0.4846 · MAE: 189,881.71",
    mse: "127,034,510,823 (1.27e11)",
    season: "Order (1,0,1) with 7-Day Seasonal Order (0,1,1,7)",
    verdict: "<strong>Coursework Finding:</strong> SARIMAX modeled the 7-day cyclical baseline but struggled with volatility spikes (R² = 0.485, MAE 189,882), showing linear autoregression requires external promotional regressors."
  },
  stationary: {
    metrics: "ADF Test: p < 0.05 · Baseline R²: 0.2521",
    mse: "Baseline MAE: 204,695.00 (Untuned)",
    season: "Augmented Dickey-Fuller & First-Order Differencing",
    verdict: "<strong>Coursework Finding:</strong> The raw retail sales series was non-stationary. Differencing achieved mean-reversion, but pure un-tuned autoregression lagged behind Prophet's non-linear seasonal flexibility."
  }
};

function switchBenchmark(model) {
  ['tabProphet', 'tabSarimax', 'tabStationary'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('is-active');
  });

  if (model === 'prophet') document.getElementById('tabProphet').classList.add('is-active');
  if (model === 'sarimax') document.getElementById('tabSarimax').classList.add('is-active');
  if (model === 'stationary') document.getElementById('tabStationary').classList.add('is-active');

  const data = benchmarkData[model];
  if (!data) return;

  const metricsEl = document.getElementById('benchMetrics');
  const mseEl = document.getElementById('benchMse');
  const seasonEl = document.getElementById('benchSeason');
  const verdictEl = document.getElementById('benchVerdict');

  metricsEl.textContent = data.metrics;
  mseEl.textContent = data.mse;
  seasonEl.textContent = data.season;
  verdictEl.innerHTML = data.verdict;

  metricsEl.style.color = model === 'prophet' ? 'var(--terracotta)' : 'var(--text-primary)';
}

// --------------------------------------------------
// Feature: Project 03 SAP Drawer Tab Switcher (Specs, Schema, Anno, Mock)
// --------------------------------------------------
function switchSapTab(tab) {
  const tabs = ['specs', 'screens', 'schema', 'anno', 'mock'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById('sapTab' + t.charAt(0).toUpperCase() + t.slice(1));
    const pane = document.getElementById('sapPane' + t.charAt(0).toUpperCase() + t.slice(1));
    if (tabBtn) tabBtn.classList.toggle('is-active', t === tab);
    if (pane) pane.classList.toggle('is-active', t === tab);
  });
}

// --------------------------------------------------
// Feature: One-Click Email Copy to Clipboard with Toast
// --------------------------------------------------
function copyEmailToClipboard(e) {
  if (e) e.preventDefault();
  const email = "nikiiwan61@gmail.com";
  const showToast = () => {
    const toast = document.getElementById('copyToast');
    if (!toast) return;
    toast.classList.add('is-active');
    setTimeout(() => {
      toast.classList.remove('is-active');
    }, 2400);
  };

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(showToast).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(err){}
        document.body.removeChild(ta);
        showToast();
      });
    } else {
      showToast();
    }
  } catch(err) {
    showToast();
  }
}

/* --------------------------------------------------
   Dynamic Archival Atmosphere & Parallax Engine
   (Living Background: Non-Static & Non-Obstructive)
   -------------------------------------------------- */
(function() {
  const canvas = document.getElementById('dynamicAtmosphereCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', function() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }, { passive: true });

  // Archival motes & geometric constellation nodes
  const particles = [];
  const COUNT = 45;
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.35 - 0.1,
      radius: Math.random() * 2.2 + 0.8,
      baseAlpha: Math.random() * 0.28 + 0.12,
      phase: Math.random() * Math.PI * 2
    });
  }

  let mouse = { x: -1000, y: -1000, active: false };
  window.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', function() {
    mouse.active = false;
  }, { passive: true });

  // Dynamic scroll parallax for Renaissance architectural watermarks
  const watermarks = document.querySelectorAll('.bg-watermark');
  window.addEventListener('scroll', function() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    watermarks.forEach(function(wm, idx) {
      const parentTop = (wm.parentElement && wm.parentElement.offsetTop) || 0;
      const relY = scrollY - parentTop;
      const speed = idx % 2 === 0 ? 0.07 : -0.05;
      wm.style.transform = 'translate3d(0, ' + (relY * speed) + 'px, 0)';
    });
  }, { passive: true });

  let time = 0;
  function animate() {
    time += 0.016;
    ctx.clearRect(0, 0, w, h);

    // Warm ambient lantern glow following mouse cursor
    if (mouse.active) {
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 350);
      grad.addColorStop(0, 'rgba(247, 241, 230, 0.22)');
      grad.addColorStop(0.5, 'rgba(224, 212, 190, 0.08)');
      grad.addColorStop(1, 'rgba(216, 205, 183, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Render floating archival motes & geometric threads
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      const alphaPulse = Math.sin(time * 1.5 + p.phase) * 0.08 + p.baseAlpha;
      ctx.fillStyle = 'rgba(140, 72, 48, ' + Math.max(0.04, alphaPulse * 0.7) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inter-particle constellation lines
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          const lineAlpha = (1 - dist / 110) * 0.06;
          ctx.strokeStyle = 'rgba(140, 72, 48, ' + lineAlpha + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Dynamic mouse connection lines
      if (mouse.active) {
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 160) {
          const mAlpha = (1 - mdist / 160) * 0.15;
          ctx.strokeStyle = 'rgba(162, 85, 59, ' + mAlpha + ')';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }
  animate();
})();


/* --------------------------------------------------
   Estheet Kinetic Entrance Controller (Trial)
   - Preloads key hero imagery
   - Executes FLIP glide animation from center stage to navbar brand
   - Safe 900ms ceiling ensures zero wait friction
   -------------------------------------------------- */
(function() {
  const curtain = document.getElementById('estheetCurtain');
  const bar = document.getElementById('estheetProgress');
  const sourceTitle = document.getElementById('kineticTitle');
  const targetBrand = document.querySelector('.brand-name span');
  if (!curtain || !bar || !sourceTitle || !targetBrand) return;

  // Temporarily lock scroll during entrance
  document.body.style.overflow = 'hidden';

  // Initial progress nudge
  requestAnimationFrame(function() {
    bar.style.width = '25%';
  });

  const criticalImages = [
    'assets/profile-picture.jpg',
    'assets/layers/clean_fresco_bg.jpg'
  ];

  let loadedCount = 0;
  let hasTransitioned = false;

  function runGlideTransition() {
    if (hasTransitioned) return;
    hasTransitioned = true;

    bar.style.width = '100%';

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function() {
      // Give 350ms for progress bar completion before takeoff
      setTimeout(function() {
        const sRect = sourceTitle.getBoundingClientRect();
        const tRect = targetBrand.getBoundingClientRect();
        const tComp = window.getComputedStyle(targetBrand);

        // Kinetic typography glider
        const glider = document.createElement('div');
        glider.className = 'kinetic-glider';
        glider.textContent = 'Nikki Tirta Iwan';
        glider.style.fontFamily = window.getComputedStyle(sourceTitle).fontFamily;
        glider.style.fontSize = window.getComputedStyle(sourceTitle).fontSize;
        glider.style.fontWeight = window.getComputedStyle(sourceTitle).fontWeight;
        glider.style.letterSpacing = window.getComputedStyle(sourceTitle).letterSpacing;
        glider.style.lineHeight = window.getComputedStyle(sourceTitle).lineHeight;
        glider.style.whiteSpace = 'nowrap';
        glider.style.display = 'inline-flex';
        glider.style.alignItems = 'center';
        glider.style.height = sRect.height + 'px';
        glider.style.left = sRect.left + 'px';
        glider.style.top = sRect.top + 'px';
        glider.style.width = sRect.width + 'px';
        glider.style.textAlign = 'center';
        document.body.appendChild(glider);

        // Fade out center stage elements smoothly
        sourceTitle.style.opacity = '0';
        const sub = document.querySelector('.estheet-subline');
        const kicker = document.querySelector('.estheet-kicker');
        const barWrap = document.querySelector('.estheet-bar-wrap');
        if (sub) sub.style.opacity = '0';
        if (kicker) kicker.style.opacity = '0';
        if (barWrap) barWrap.style.opacity = '0';
        targetBrand.style.opacity = '0';

        // Glide precisely into navigation bar target
        requestAnimationFrame(function() {
          glider.style.fontFamily = tComp.fontFamily;
          glider.style.fontSize = tComp.fontSize;
          glider.style.fontWeight = tComp.fontWeight;
          glider.style.letterSpacing = tComp.letterSpacing;
          glider.style.lineHeight = tComp.lineHeight;
          glider.style.height = tRect.height + 'px';
          glider.style.left = tRect.left + 'px';
          glider.style.top = tRect.top + 'px';
          glider.style.width = 'auto';
          glider.style.textAlign = 'left';

          curtain.classList.add('is-hidden');

          setTimeout(function() {
            targetBrand.style.opacity = '1';
            if (glider.parentElement) glider.remove();
            if (curtain.parentElement) curtain.remove();
            document.body.style.overflow = '';
          }, 800);
        });
      }, 350);
    });
  }

  criticalImages.forEach(function(src) {
    const img = new Image();
    img.onload = img.onerror = function() {
      loadedCount++;
      bar.style.width = Math.min(90, Math.floor((loadedCount / criticalImages.length) * 85) + 15) + '%';
      if (loadedCount >= criticalImages.length) {
        setTimeout(runGlideTransition, 420);
      }
    };
    img.src = src;
  });

  // Strict safety escape timeout (max 1200ms)
  setTimeout(runGlideTransition, 1200);
})();


/* --------------------------------------------------
   Experience & Background: Reversible Scroll Reveal Controller
   - Scrolling DOWN: card glides from right to left, transparency 0 -> 100
   - Scrolling UP: card glides back to the right, transparency 100 -> 0
   -------------------------------------------------- */
(function() {
  const nodes = document.querySelectorAll('.timeline-node');
  if (!nodes.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else {
          // If the element exits towards the bottom (user scrolled back up), reverse the animation
          if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove('is-revealed');
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.06
    });

    nodes.forEach(function(node) {
      observer.observe(node);
    });
  } else {
    nodes.forEach(function(node) {
      node.classList.add('is-revealed');
    });
  }
})();

/* --------------------------------------------------
   Typography Kinetic Motion Controller
   (Inspired by Swash Motion & One Page Love Editorial Design)
   - Scroll-scrub word illumination on .intro-lead (Reversible on scroll up)
   - Masked kinetic slide-up for section headings (.intro-heading, .section-heading, .footer-heading)
   - Kinetic tracking expansion for section eyebrows & labels (.intro-eyebrow, .section-label)
   - Staggered entrance for descriptions (.section-desc, .footer-desc) & spec cards
   -------------------------------------------------- */
(function() {
  // 1. Scroll-Scrub Text Illumination (.intro-lead)
  const introLead = document.querySelector('.intro-lead');
  if (introLead) {
    const rawText = introLead.textContent.trim();
    const words = rawText.split(/\s+/);
    introLead.innerHTML = words.map(function(w) {
      return '<span class="scrub-word">' + w + '</span>';
    }).join(' ');

    const wordSpans = introLead.querySelectorAll('.scrub-word');
    const totalWords = wordSpans.length;

    let scrubTicking = false;
    function updateScrub() {
      const rect = introLead.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.88;
      const end = vh * 0.36;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      const litCutoff = Math.floor(progress * totalWords);
      for (let i = 0; i < totalWords; i++) {
        if (i < litCutoff) {
          wordSpans[i].classList.add('is-lit');
        } else {
          wordSpans[i].classList.remove('is-lit');
        }
      }
      scrubTicking = false;
    }

    function onScrollScrub() {
      if (!scrubTicking) {
        window.requestAnimationFrame(updateScrub);
        scrubTicking = true;
      }
    }

    window.addEventListener('scroll', onScrollScrub, { passive: true });
    window.addEventListener('resize', onScrollScrub, { passive: true });
    updateScrub();
  }

  // 2. Kinetic Masked Headings
  const headings = document.querySelectorAll('.intro-heading, .section-heading, .footer-heading');
  headings.forEach(function(heading) {
    const innerHtml = heading.innerHTML.trim();
    heading.innerHTML = '<span class="kinetic-heading-mask"><span class="kinetic-heading-inner">' + innerHtml + '</span></span>';
  });

  // 3. Kinetic Eyebrows & Section Labels
  const labels = document.querySelectorAll('.intro-eyebrow, .section-label');
  labels.forEach(function(l) {
    l.classList.add('kinetic-label-init');
  });

  // 4. Section Descriptions
  const descs = document.querySelectorAll('.section-desc, .footer-desc');
  descs.forEach(function(d) {
    d.classList.add('kinetic-desc-init');
  });

  // 5. Spec & Metric Columns
  const specCards = document.querySelectorAll('.visage-spec-col, .crisp-card');
  specCards.forEach(function(c) {
    c.classList.add('kinetic-card-init');
  });

  // 6. Reversible IntersectionObserver
  if ('IntersectionObserver' in window) {
    const typographyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        const hInner = entry.target.querySelector('.kinetic-heading-inner');
        const isLabel = entry.target.classList.contains('kinetic-label-init');
        const isDesc = entry.target.classList.contains('kinetic-desc-init');
        const isCard = entry.target.classList.contains('kinetic-card-init');

        if (entry.isIntersecting) {
          if (hInner) hInner.classList.add('is-revealed');
          if (isLabel) entry.target.classList.add('is-revealed');
          if (isDesc) entry.target.classList.add('is-revealed');
          if (isCard) entry.target.classList.add('is-revealed');
        } else {
          // Reversible on scroll up: only if exiting below the viewport
          if (entry.boundingClientRect.top > 0) {
            if (hInner) hInner.classList.remove('is-revealed');
            if (isLabel) entry.target.classList.remove('is-revealed');
            if (isDesc) entry.target.classList.remove('is-revealed');
            if (isCard) entry.target.classList.remove('is-revealed');
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.08
    });

    headings.forEach(function(h) { typographyObserver.observe(h); });
    labels.forEach(function(l) { typographyObserver.observe(l); });
    descs.forEach(function(d) { typographyObserver.observe(d); });
    specCards.forEach(function(c) { typographyObserver.observe(c); });
  } else {
    document.querySelectorAll('.kinetic-heading-inner, .kinetic-label-init, .kinetic-desc-init, .kinetic-card-init').forEach(function(el) {
      el.classList.add('is-revealed');
    });
  }
})();


/* ==================================================
   Floating AI Assistant Controller (Gemini-Powered)
   ================================================== */
(function() {
  // Configured Cloudflare Worker endpoint:
  window.NIKKI_AI_WORKER_URL = 'https://cold-cell-15a6.syltreets.workers.dev/';

  const MAX_QUERIES = 2;
  const STORAGE_KEY = 'nikki_ai_queries_used';

  function getQueriesUsed() {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  }

  function getQueriesRemaining() {
    return Math.max(0, MAX_QUERIES - getQueriesUsed());
  }

  function incrementQueriesUsed() {
    const used = getQueriesUsed() + 1;
    localStorage.setItem(STORAGE_KEY, used.toString());
    updateCounterUI();
    return used;
  }

  function updateCounterUI() {
    const rem = getQueriesRemaining();
    const counterEl = document.getElementById('aiQueryCounter');
    const inputEl = document.getElementById('aiChatInput');
    const submitBtn = document.getElementById('aiChatSubmitBtn');

    if (counterEl) {
      counterEl.textContent = rem === 1 ? '1 query remaining' : `${rem} queries remaining`;
    }

    if (rem <= 0) {
      if (inputEl) {
        inputEl.disabled = true;
        inputEl.placeholder = 'Query limit reached (2/2)';
      }
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    } else {
      if (inputEl) {
        inputEl.disabled = false;
        inputEl.placeholder = 'Ask a question about Nikki...';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  }

  // Secret developer reset: Triple-click avatar in chat header to reset counter
  let avatarClicks = 0;
  let avatarTimer = null;
  window.resetAiCounterDev = function() {
    avatarClicks++;
    clearTimeout(avatarTimer);
    avatarTimer = setTimeout(function() { avatarClicks = 0; }, 800);
    if (avatarClicks >= 3) {
      localStorage.removeItem(STORAGE_KEY);
      updateCounterUI();
      avatarClicks = 0;
      const counterEl = document.getElementById('aiQueryCounter');
      if (counterEl) {
        counterEl.textContent = 'Counter reset! (2 remaining)';
        setTimeout(function() { updateCounterUI(); }, 2000);
      }
    }
  };

  window.toggleAiChat = function() {
    const win = document.getElementById('aiChatWindow');
    if (!win) return;
    const isOpen = win.classList.toggle('is-open');
    win.setAttribute('aria-hidden', !isOpen);
    updateCounterUI();

    if (isOpen) {
      const inputEl = document.getElementById('aiChatInput');
      if (inputEl && !inputEl.disabled) {
        setTimeout(function() { inputEl.focus(); }, 150);
      }
    }
  };

  window.askAiChip = function(question) {
    const inputEl = document.getElementById('aiChatInput');
    if (!inputEl || inputEl.disabled) return;
    inputEl.value = question;
    const form = document.getElementById('aiChatForm');
    if (form) {
      handleAiChatSubmit(new Event('submit', { cancelable: true }));
    }
  };

  // Built-in intelligent grounded knowledge responses (Zero-latency fallback)
  function getGroundedResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('sap') || q.includes('abap') || q.includes('fiori') || q.includes('odata') || q.includes('enterprise')) {
      return "Nikki engineered an enterprise expense analytics solution on <strong>SAP S/4HANA</strong>. He developed custom ABAP Data Provider Classes (<code>DPC_EXT</code>) with dynamic OpenSQL queries to serve transactional data via OData Gateway to an <strong>SAPUI5/Fiori Analytical List Page</strong> with interactive dimension filters.";
    }

    if (q.includes('visage') || q.includes('avatar') || q.includes('voice') || q.includes('llm') || q.includes('sovits') || q.includes('qwen')) {
      return "<strong>Visage Link</strong> is Nikki's voice AI companion system. It integrates a 3D VTuber avatar via VSeeFace (VMC/OSC protocol), local quantized <strong>Qwen 2.5 7B</strong> inference via Ollama, word-level streaming with custom <strong>GPT-SoVITS</strong> for Japanese speech synthesis, and SQLite memory—all tuned within an 8GB VRAM constraint.";
    }

    if (q.includes('forecast') || q.includes('retail') || q.includes('prophet') || q.includes('sarimax') || q.includes('transaction')) {
      return "In his retail forecasting project, Nikki analyzed <strong>12.6 million transactions</strong>. His <strong>Facebook Prophet</strong> pipeline achieved an <strong>R² of 0.835</strong>, substantially outperforming a classical SARIMAX baseline and optimizing grocery inventory allocations.";
    }

    if (q.includes('gpa') || q.includes('education') || q.includes('umn') || q.includes('college') || q.includes('role') || q.includes('graduat') || q.includes('hire') || q.includes('work')) {
      return "Nikki is an Information Systems undergraduate at <strong>Universitas Multimedia Nusantara (UMN)</strong>, graduating in 2027 with a <strong>3.73 / 4.00 GPA</strong>. He is actively <strong>Open to Work</strong> for 2026/2027 Software Engineering, AI/ML, and Enterprise Systems roles.";
    }

    if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('whatsapp') || q.includes('reach')) {
      return "You can connect with Nikki directly on <a href='https://wa.me/6282239608228' target='_blank' style='color:var(--terracotta);text-decoration:underline;'>WhatsApp (+62 822-3960-8228)</a> or email him at <a href='mailto:nikiiwan61@gmail.com' style='color:var(--terracotta);text-decoration:underline;'>nikiiwan61@gmail.com</a>.";
    }

    return "Nikki Tirta Iwan is an Information Systems engineer (GPA 3.73) specializing in Voice AI companions (Visage Link), enterprise architecture (SAP S/4HANA & ABAP), and large-scale time-series forecasting. Feel free to ask about any of his projects or reach him directly!";
  }

  function appendMessage(text, sender) {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ai-message--${sender}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'ai-bubble';
    bubbleDiv.innerHTML = text;

    msgDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return null;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-typing';
    typingDiv.id = 'aiTypingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.remove();
  }

  function showLimitReachedCard() {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) return;

    const limitDiv = document.createElement('div');
    limitDiv.className = 'ai-limit-reached-box';
    limitDiv.innerHTML = `
      <strong>Device Query Limit Reached (2/2)</strong>
      <p style="margin: 6px 0 0 0; color: var(--text-secondary);">
        Thank you for testing the AI Assistant! To discuss roles, projects, or schedule an interview, reach Nikki directly:
      </p>
      <div class="ai-limit-contact-btns">
        <a class="ai-limit-btn ai-limit-btn--wa" href="https://wa.me/6282239608228" target="_blank" rel="noopener">
          WhatsApp &rarr;
        </a>
        <a class="ai-limit-btn ai-limit-btn--email" href="mailto:nikiiwan61@gmail.com">
          Email &rarr;
        </a>
      </div>
    `;
    messagesContainer.appendChild(limitDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  window.handleAiChatSubmit = async function(event) {
    if (event && event.preventDefault) event.preventDefault();

    const inputEl = document.getElementById('aiChatInput');
    if (!inputEl) return;
    const query = inputEl.value.trim();
    if (!query) return;

    const remaining = getQueriesRemaining();
    if (remaining <= 0) {
      updateCounterUI();
      return;
    }

    // 1. Append user message
    appendMessage(query, 'user');
    inputEl.value = '';

    // 2. Hide prompt chips after first interaction
    const chipsEl = document.getElementById('aiPromptChips');
    if (chipsEl) chipsEl.style.display = 'none';

    // 3. Decrement query usage
    const used = incrementQueriesUsed();

    // 4. Show typing animation
    showTypingIndicator();

    // 5. Query either Cloudflare Worker (Gemini) or grounded engine (with 3.5s strict timeout)
    let botReply = '';
    const workerUrl = window.NIKKI_AI_WORKER_URL;

    if (workerUrl && workerUrl.startsWith('http')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          botReply = data.reply || getGroundedResponse(query);
        } else {
          botReply = getGroundedResponse(query);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // Fast fallback to grounded engine if worker is slow or timed out
        botReply = getGroundedResponse(query);
      }
    } else {
      // Simulate natural thinking delay for grounded response
      await new Promise(r => setTimeout(r, 650));
      botReply = getGroundedResponse(query);
    }

    // 6. Display response
    removeTypingIndicator();
    appendMessage(botReply, 'bot');

    // 7. If reached limit, display contact card
    if (getQueriesRemaining() <= 0) {
      showLimitReachedCard();
    }
  };

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const win = document.getElementById('aiChatWindow');
      if (win && win.classList.contains('is-open')) {
        toggleAiChat();
      }
    }
  });

  // Initialize UI on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCounterUI);
  } else {
    updateCounterUI();
  }
})();
