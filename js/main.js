/* ==================================================
   Motion State (Always Enabled) & Menu Overlay
   ================================================== */
const PREFERS_REDUCED_MOTION = false;
const motionEnabled = true;

window.toggleMenuOverlay = function(forceClose) {
  const overlay = document.getElementById('menuOverlay');
  const btns = [
    document.getElementById('floatingMenuBtn'),
    document.getElementById('mobileNavToggle'),
  ];
  if (!overlay) return;
  const shouldOpen = forceClose === true ? false : !overlay.classList.contains('is-open');
  overlay.classList.toggle('is-open', shouldOpen);
  overlay.setAttribute('aria-hidden', String(!shouldOpen));
  btns.forEach(b => b && b.setAttribute('aria-expanded', String(shouldOpen)));
};

window.navigateToAnchor = function(selector) {
  toggleMenuOverlay(true);
  const target = document.querySelector(selector);
  if (!target) return;
  if (window.lenis && motionEnabled) {
    window.lenis.scrollTo(target, { offset: 0, duration: 1.15 });
  } else {
    target.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
  }
};

/* ==================================================
   Lenis Smooth Scrolling Architecture
   ================================================== */
(function initLenis() {
  if (typeof Lenis !== 'undefined' && !PREFERS_REDUCED_MOTION) {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.6,
      infinite: false,
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          toggleMenuOverlay(true);
          if (window.lenis && motionEnabled) {
            window.lenis.scrollTo(target, { offset: 0, duration: 1.15 });
          } else {
            target.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
          }
        }
      });
    });
  });
})();

/* ==================================================
   Header Morph, Reading Progress & Active Section Scroll-Spy
   ================================================== */
(function initHeaderScrollSpy() {
  const headerBar = document.getElementById('headerBar');
  const floatingChrome = document.getElementById('floatingChrome');
  const progressBar = document.getElementById('headerProgress');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const sections = ['intro', 'work', 'background', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  let ticking = false;
  function updateHeaderScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

    if (progressBar) {
      progressBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    }

    const morphed = scrollY > 140;
    if (headerBar) {
      headerBar.classList.toggle('is-morphed', morphed);
    }
    if (floatingChrome) {
      floatingChrome.classList.toggle('is-visible', morphed);
    }

    const probeY = window.innerHeight * 0.4;
    let activeId = null;
    for (let i = 0; i < sections.length; i++) {
      const rect = sections[i].getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom >= 80) {
        activeId = sections[i].id;
      }
    }
    if (docHeight > 0 && scrollY >= docHeight - 40 && sections.length) {
      activeId = sections[sections.length - 1].id;
    }

    navLinks.forEach(link => {
      link.classList.toggle('is-active', activeId !== null && link.dataset.section === activeId);
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderScroll);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateHeaderScroll();
})();

/* ==================================================
   Hero Runway Convergence, WebGL Fluid Ink & Synapse Arcs
   ================================================== */
(function initHeroSystem() {
  const runway = document.querySelector('.hero-runway');
  const stage = document.getElementById('heroStage');
  const bgPlate = document.getElementById('heroBgPlate');
  const adam = document.getElementById('adamLayer');
  const cyborg = document.getElementById('cyborgLayer');
  const spark = document.getElementById('heroSpark');
  const sparkRing = document.getElementById('heroSparkRing');
  const spotlight = document.getElementById('heroSpotlight');
  const plaque = document.getElementById('heroPlaque');
  const introLockup = document.getElementById('heroIntroLockup');
  const scrollCue = document.getElementById('heroScrollCue');
  const fluidCanvas = document.getElementById('heroFluidCanvas');
  const synapseCanvas = document.getElementById('heroSynapseCanvas');

  if (!runway || !adam || !cyborg) return;

  let heroFluid = null;
  if (fluidCanvas && window.PortfolioFluid) {
    heroFluid = window.PortfolioFluid.initFluidInkCanvas(fluidCanvas, {
      triggerTarget: stage,
      alphaScale: 0.46,
      dyeDissipation: 0.968,
      velDissipation: 0.978,
      curl: 58,
      splatRadius: 0.00026,
      seedAmbient: false,
      primaryColor: [0.08, 0.068, 0.056],
      secondaryColor: [0.58, 0.28, 0.17],
    });
    window.PortfolioFluid.setMotionEnabled(motionEnabled);
  }

  const synCtx = synapseCanvas ? synapseCanvas.getContext('2d') : null;
  function resizeSynapse() {
    if (!synapseCanvas) return;
    synapseCanvas.width = synapseCanvas.offsetWidth || window.innerWidth;
    synapseCanvas.height = synapseCanvas.offsetHeight || window.innerHeight;
  }
  resizeSynapse();
  window.addEventListener('resize', resizeSynapse, { passive: true });

  let scrollTicking = false;
  let pointerActive = false;
  let targetNx = 0;
  let targetNy = 0;
  let curNx = 0;
  let curNy = 0;
  let depthRafId = null;
  let hasContactBurst = false;

  const holdState = { active: false, px: 0, py: 0, nx: 0.5, ny: 0.5, start: 0, rafId: null };

  function drawSynapseArcs(progress) {
    if (!synCtx || !synapseCanvas) return;
    synCtx.clearRect(0, 0, synapseCanvas.width, synapseCanvas.height);
    if (!motionEnabled) return;

    if (progress >= 0.65 && progress <= 0.92) {
      const strength = Math.sin(((progress - 0.65) / 0.27) * Math.PI);
      const cx = synapseCanvas.width * 0.5;
      const cy = synapseCanvas.height * 0.45;
      const spread = 18 + (1 - Math.min(1, Math.abs(progress - 0.75) * 8)) * 34;

      synCtx.save();
      for (let a = 0; a < 5; a++) {
        const angleOffset = (a - 2) * 0.42 + Math.sin(performance.now() * 0.005 + a) * 0.25;
        const sx = cx - spread * Math.cos(angleOffset * 0.5);
        const ex = cx + spread * Math.cos(angleOffset * 0.5);
        const sy = cy + Math.sin(angleOffset) * 14;
        const ey = cy - Math.sin(angleOffset) * 14;

        synCtx.beginPath();
        synCtx.moveTo(sx, sy);
        const steps = 6;
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const px = sx + (ex - sx) * t;
          const py = sy + (ey - sy) * t + (Math.random() - 0.5) * 11 * strength;
          synCtx.lineTo(px, py);
        }
        synCtx.lineTo(ex, ey);
        synCtx.strokeStyle = a % 2 === 0
          ? `rgba(247, 239, 225, ${(0.55 * strength).toFixed(2)})`
          : `rgba(140, 72, 48, ${(0.72 * strength).toFixed(2)})`;
        synCtx.lineWidth = a === 2 ? 1.5 : 0.9;
        synCtx.stroke();
      }
      synCtx.restore();
    }

    // Draw interactive "Hold to Discharge" buildup under cursor
    if (holdState.active) {
      const charge = Math.min(1, (performance.now() - holdState.start) / 850);
      if (charge > 0.04) {
        synCtx.save();
        const r = 10 + charge * 42;
        const grad = synCtx.createRadialGradient(holdState.px, holdState.py, 1, holdState.px, holdState.py, r * 1.4);
        grad.addColorStop(0, `rgba(247, 239, 225, ${(0.55 * charge).toFixed(2)})`);
        grad.addColorStop(0.5, `rgba(140, 72, 48, ${(0.38 * charge).toFixed(2)})`);
        grad.addColorStop(1, 'rgba(140, 72, 48, 0)');
        synCtx.fillStyle = grad;
        synCtx.beginPath();
        synCtx.arc(holdState.px, holdState.py, r * 1.4, 0, Math.PI * 2);
        synCtx.fill();

        synCtx.strokeStyle = `rgba(140, 72, 48, ${(0.3 + charge * 0.6).toFixed(2)})`;
        synCtx.lineWidth = 1.25;
        synCtx.beginPath();
        synCtx.arc(holdState.px, holdState.py, r * 0.65, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
        synCtx.stroke();

        for (let k = 0; k < 4; k++) {
          const ang = (performance.now() * 0.006) + (k * Math.PI * 0.5);
          const dist = r * (0.85 + Math.random() * 0.35);
          synCtx.beginPath();
          synCtx.moveTo(holdState.px + Math.cos(ang) * dist, holdState.py + Math.sin(ang) * dist);
          synCtx.lineTo(holdState.px + Math.cos(ang + 0.25) * 4, holdState.py + Math.sin(ang + 0.25) * 4);
          synCtx.strokeStyle = `rgba(247, 239, 225, ${(0.65 * charge).toFixed(2)})`;
          synCtx.lineWidth = 0.9;
          synCtx.stroke();
        }
        synCtx.restore();
      }
    }
  }

  function tickHoldCharge() {
    if (!holdState.active) {
      holdState.rafId = null;
      return;
    }
    drawSynapseArcs(getProgress());
    holdState.rafId = window.requestAnimationFrame(tickHoldCharge);
  }

  function applyTransforms(progress) {
    const p = !motionEnabled ? 1 : Math.min(1, Math.max(0, progress / 0.75));
    const easeProgress = p * p * (3 - 2 * p);
    const shift = (1 - easeProgress) * 76;

    const bgParallaxX = motionEnabled ? -curNx * 6 : 0;
    const bgParallaxY = motionEnabled ? -curNy * 4 : 0;
    const figParallaxX = motionEnabled ? curNx * 3 : 0;
    const figParallaxY = motionEnabled ? curNy * 2 : 0;

    if (bgPlate) {
      bgPlate.style.transform =
        'scale(1.03) translate3d(' + bgParallaxX.toFixed(2) + 'px, ' + bgParallaxY.toFixed(2) + 'px, 0)';
    }

    adam.style.transform =
      'translate3d(' + (-shift + figParallaxX).toFixed(2) + 'px, ' + figParallaxY.toFixed(2) + 'px, 0) scale(1.015)';
    cyborg.style.transform =
      'translate3d(' + (shift + figParallaxX).toFixed(2) + 'px, ' + figParallaxY.toFixed(2) + 'px, 0) scale(1.015)';

    if (spark) {
      if (motionEnabled && progress > 0.58 && progress < 0.92) {
        const sparkP = (progress - 0.58) / 0.34;
        const scale = Math.sin(sparkP * Math.PI) * 1.35;
        spark.style.transform = 'translate(-50%, -50%) scale(' + scale.toFixed(3) + ')';
        spark.style.opacity = Math.min(1, Math.sin(sparkP * Math.PI) * 1.4).toFixed(2);
      } else {
        spark.style.transform = 'translate(-50%, -50%) scale(0)';
        spark.style.opacity = '0';
      }
    }

    if (sparkRing) {
      if (motionEnabled && progress > 0.70 && progress < 0.94) {
        const ringP = (progress - 0.70) / 0.24;
        const ringScale = 0.35 + ringP * 2.1;
        const ringAlpha = Math.sin(ringP * Math.PI) * 0.85;
        sparkRing.style.transform = 'translate(-50%, -50%) scale(' + ringScale.toFixed(3) + ')';
        sparkRing.style.opacity = ringAlpha.toFixed(2);
      } else {
        sparkRing.style.transform = 'translate(-50%, -50%) scale(0.35)';
        sparkRing.style.opacity = '0';
      }
    }

    // Trigger organic fluid spark burst once when fingertips touch at 0.75
    if (motionEnabled && heroFluid) {
      if (progress >= 0.72 && progress <= 0.82 && !hasContactBurst) {
        hasContactBurst = true;
        heroFluid.burstAt(0.5, 0.55, 0.95);
      } else if (progress < 0.60) {
        hasContactBurst = false;
      }
    }

    drawSynapseArcs(progress);

    if (plaque) {
      if (!motionEnabled || progress > 0.38) {
        const textP = !motionEnabled ? 1 : Math.min(1, (progress - 0.38) / 0.30);
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

    const introFade = Math.max(0, 1 - progress / 0.24);
    if (introLockup) {
      introLockup.style.opacity = introFade.toFixed(2);
      introLockup.style.transform = 'translate3d(0, ' + (-progress * 26).toFixed(1) + 'px, 0)';
    }
    if (scrollCue) {
      scrollCue.style.opacity = introFade.toFixed(2);
      scrollCue.style.transform = 'translate(-50%, ' + (progress * 18).toFixed(1) + 'px)';
    }
  }

  function getProgress() {
    const rect = runway.getBoundingClientRect();
    const maxScroll = Math.max(1, runway.offsetHeight - window.innerHeight);
    return Math.min(1, Math.max(0, -rect.top / maxScroll));
  }

  function updateMotion() {
    applyTransforms(getProgress());
    scrollTicking = false;
  }
  window.__refreshHeroMotion = updateMotion;

  function onScroll() {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateMotion);
      scrollTicking = true;
    }
  }

  function stepDepthLerp() {
    const dx = targetNx - curNx;
    const dy = targetNy - curNy;
    curNx += dx * 0.1;
    curNy += dy * 0.1;

    applyTransforms(getProgress());

    if (pointerActive || Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
      depthRafId = window.requestAnimationFrame(stepDepthLerp);
    } else {
      curNx = targetNx;
      curNy = targetNy;
      depthRafId = null;
    }
  }

  if (stage) {
    stage.addEventListener('mousemove', function(e) {
      if (!motionEnabled) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const rx = (e.clientX - rect.left) / rect.width;
      const ry = (e.clientY - rect.top) / rect.height;
      targetNx = (rx - 0.5) * 2;
      targetNy = (ry - 0.5) * 2;
      pointerActive = true;

      if (spotlight) {
        spotlight.style.setProperty('--mx', (rx * 100).toFixed(2) + '%');
        spotlight.style.setProperty('--my', (ry * 100).toFixed(2) + '%');
        spotlight.classList.add('is-active');
      }

      if (!depthRafId) {
        depthRafId = window.requestAnimationFrame(stepDepthLerp);
      }
    }, { passive: true });

    stage.addEventListener('mouseleave', function() {
      pointerActive = false;
      targetNx = 0;
      targetNy = 0;
      if (holdState.active) {
        holdState.active = false;
        drawSynapseArcs(getProgress());
      }
      if (spotlight) spotlight.classList.remove('is-active');
      if (!depthRafId) {
        depthRafId = window.requestAnimationFrame(stepDepthLerp);
      }
    }, { passive: true });

    function beginHold(clientX, clientY, targetEl) {
      if (!motionEnabled) return;
      if (targetEl && targetEl.closest && targetEl.closest('a, button, input')) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      holdState.active = true;
      holdState.px = clientX - rect.left;
      holdState.py = clientY - rect.top;
      holdState.nx = holdState.px / rect.width;
      holdState.ny = holdState.py / rect.height;
      holdState.start = performance.now();
      if (!holdState.rafId) tickHoldCharge();
    }

    function updateHoldPos(clientX, clientY) {
      if (!holdState.active) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      holdState.px = clientX - rect.left;
      holdState.py = clientY - rect.top;
      holdState.nx = holdState.px / rect.width;
      holdState.ny = holdState.py / rect.height;
    }

    function releaseHold() {
      if (!holdState.active) return;
      const heldMs = performance.now() - holdState.start;
      const charge = Math.min(1, heldMs / 850);
      holdState.active = false;
      drawSynapseArcs(getProgress());
      if (heldMs >= 160 && heroFluid) {
        stage.dataset.heldAt = String(Date.now());
        heroFluid.burstAt(holdState.nx, 1.0 - holdState.ny, 1.15 + charge * 1.35);
      }
    }

    stage.addEventListener('mousedown', (e) => { if (e.button === 0) beginHold(e.clientX, e.clientY, e.target); }, { passive: true });
    stage.addEventListener('mousemove', (e) => updateHoldPos(e.clientX, e.clientY), { passive: true });
    window.addEventListener('mouseup', releaseHold, { passive: true });
    stage.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) beginHold(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, { passive: true });
    window.addEventListener('touchend', releaseHold, { passive: true });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateMotion();
})();

/* ==================================================
   Pinned Full-Viewport Exhibition Stage (#work) + Choreography
   ================================================== */
(function initWorkExhibition() {
  const runway = document.getElementById('work');
  const counterEl = document.getElementById('workCounter');

  const panels = [
    document.getElementById('workPanel0'),
    document.getElementById('workPanel1'),
    document.getElementById('workPanel2'),
  ];
  const slides = [
    document.getElementById('exhibitSlide0'),
    document.getElementById('exhibitSlide1'),
    document.getElementById('exhibitSlide2'),
  ];
  const rails = [
    document.getElementById('workRail0'),
    document.getElementById('workRail1'),
    document.getElementById('workRail2'),
  ];
  const railFills = [
    document.getElementById('workRailFill0'),
    document.getElementById('workRailFill1'),
    document.getElementById('workRailFill2'),
  ];

  if (!runway) return;

  let activeIndex = 0;
  let lastIndex = 0;

  const choreo = {
    curEnter: 1, targetEnter: 1,
    curActP: 0, targetActP: 0,
    curVel: 0, targetVel: 0,
    rafId: null,
  };

  function stepChoreography() {
    choreo.rafId = null;
    if (window.innerWidth <= 900) {
      runway.style.setProperty('--work-enter', '1');
      runway.style.setProperty('--work-act-p', '0');
      runway.style.setProperty('--work-act-abs-p', '0');
      runway.style.setProperty('--work-vel', '0');
      return;
    }

    const dEnter = choreo.targetEnter - choreo.curEnter;
    const dActP = choreo.targetActP - choreo.curActP;
    const rawVel = window.lenis ? Math.max(-1, Math.min(1, (window.lenis.velocity || 0) / 22)) : 0;
    choreo.targetVel = rawVel;
    const dVel = choreo.targetVel - choreo.curVel;

    choreo.curEnter += dEnter * 0.16;
    choreo.curActP += dActP * 0.15;
    choreo.curVel += dVel * 0.16;

    runway.style.setProperty('--work-enter', choreo.curEnter.toFixed(4));
    runway.style.setProperty('--work-act-p', choreo.curActP.toFixed(4));
    runway.style.setProperty('--work-act-abs-p', Math.abs(choreo.curActP).toFixed(4));
    runway.style.setProperty('--work-vel', choreo.curVel.toFixed(4));

    if (
      Math.abs(dEnter) > 0.001 ||
      Math.abs(dActP) > 0.001 ||
      Math.abs(dVel) > 0.001 ||
      Math.abs(choreo.curVel) > 0.002
    ) {
      choreo.rafId = window.requestAnimationFrame(stepChoreography);
    }
  }

  function wakeChoreography() {
    if (!choreo.rafId) {
      choreo.rafId = window.requestAnimationFrame(stepChoreography);
    }
  }

  function applySlide(index) {
    const next = Math.max(0, Math.min(2, index));
    if (next !== lastIndex) {
      runway.dataset.dir = next < lastIndex ? 'up' : 'down';
      lastIndex = next;
    }
    activeIndex = next;
    if (counterEl) {
      counterEl.textContent = '0' + (activeIndex + 1) + ' / 03';
    }

    panels.forEach((p, i) => p && p.classList.toggle('is-active', i === activeIndex));
    slides.forEach((s, i) => s && s.classList.toggle('is-active', i === activeIndex));
    rails.forEach((r, i) => {
      if (!r) return;
      r.classList.toggle('is-active', i === activeIndex);
      r.setAttribute('aria-selected', String(i === activeIndex));
    });

    // Pause Visage video when navigating away from Slide 0
    const vid = document.getElementById('visageVideo');
    if (vid && activeIndex !== 0 && !vid.paused) {
      vid.pause();
    }
  }

  let ticking = false;
  function updateWorkStage() {
    const rect = runway.getBoundingClientRect();
    const vh = window.innerHeight || 1;

    if (window.innerWidth <= 900) {
      railFills.forEach((fill, i) => {
        if (fill) fill.style.transform = 'scaleX(' + (i === activeIndex ? '1' : '0') + ')';
      });
      wakeChoreography();
      ticking = false;
      return;
    }

    // Smooth entry zoom & perspective settle across full viewport approach
    const enterP = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.86)));
    choreo.targetEnter = enterP;

    const maxScroll = Math.max(1, runway.offsetHeight - vh);
    const progress = Math.min(1, Math.max(0, -rect.top / maxScroll));

    const idx = progress < 0.333 ? 0 : progress < 0.667 ? 1 : 2;
    if (idx !== activeIndex) {
      applySlide(idx);
    }

    const sliceStart = idx / 3;
    const localNorm = Math.min(1, Math.max(0, (progress - sliceStart) * 3));
    choreo.targetActP = (localNorm - 0.5) * 2;
    wakeChoreography();

    // Update 3-segment fill progress proportionally across [0..0.333], [0.333..0.667], [0.667..1.0]
    for (let i = 0; i < 3; i++) {
      const start = i / 3;
      const local = Math.min(1, Math.max(0, (progress - start) * 3));
      if (railFills[i]) {
        railFills[i].style.transform = 'scaleX(' + local.toFixed(3) + ')';
      }
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateWorkStage);
      ticking = true;
    }
  }

  window.jumpToWorkSlide = function(index) {
    toggleMenuOverlay(true);
    const targetIdx = Math.max(0, Math.min(2, index));
    applySlide(targetIdx);

    if (window.innerWidth <= 900) {
      railFills.forEach((fill, i) => {
        if (fill) fill.style.transform = 'scaleX(' + (i === targetIdx ? '1' : '0') + ')';
      });
      if (window.lenis && motionEnabled) {
        window.lenis.scrollTo(runway, { offset: 0, duration: 1.0 });
      } else {
        runway.scrollIntoView({ behavior: motionEnabled ? 'smooth' : 'auto' });
      }
      return;
    }

    choreo.targetEnter = 1;
    choreo.curEnter = 1;
    wakeChoreography();

    const maxScroll = Math.max(1, runway.offsetHeight - window.innerHeight);
    const targetProgress = targetIdx === 0 ? 0.08 : targetIdx === 1 ? 0.45 : 0.85;
    const runwayTop = runway.getBoundingClientRect().top + (window.scrollY || window.pageYOffset);
    const destY = runwayTop + maxScroll * targetProgress;

    if (window.lenis && motionEnabled) {
      window.lenis.scrollTo(destY, { duration: 1.1 });
    } else {
      window.scrollTo({ top: destY, behavior: motionEnabled ? 'smooth' : 'auto' });
    }
  };

  applySlide(0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateWorkStage();
})();

/* ==================================================
   Technical Case Study Modal Controller
   ================================================== */
window.openCaseStudyModal = function(section) {
  const modal = document.getElementById('caseStudyModal');
  if (!modal) return;
  switchCaseSection(section || 'visage');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (window.lenis) window.lenis.stop();
};

window.switchCaseSection = function(section) {
  const map = {
    visage: { btn: 'caseBtnVisage', pane: 'casePaneVisage' },
    forecasting: { btn: 'caseBtnForecasting', pane: 'casePaneForecasting' },
    sap: { btn: 'caseBtnSap', pane: 'casePaneSap' },
  };
  Object.keys(map).forEach(key => {
    const b = document.getElementById(map[key].btn);
    const p = document.getElementById(map[key].pane);
    if (b) b.classList.toggle('is-active', key === section);
    if (p) p.classList.toggle('is-active', key === section);
  });
};

window.closeCaseStudyModal = function() {
  const modal = document.getElementById('caseStudyModal');
  if (!modal || !modal.classList.contains('is-open')) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (window.lenis && motionEnabled) window.lenis.start();
};

/* ==================================================
   Footer Interactive WebGL Fluid Canvas & Spotlight
   ================================================== */
(function initFooterSystem() {
  const footer = document.getElementById('contact');
  const spotlight = document.getElementById('footerSpotlight');
  const fluidCanvas = document.getElementById('footerFluidCanvas');
  if (!footer) return;

  if (fluidCanvas && window.PortfolioFluid) {
    window.PortfolioFluid.initFluidInkCanvas(fluidCanvas, {
      triggerTarget: footer,
      alphaScale: 0.52,
      dyeDissipation: 0.97,
      velDissipation: 0.978,
      curl: 52,
      splatRadius: 0.00034,
      seedAmbient: false,
      primaryColor: [0.95, 0.89, 0.77],
      secondaryColor: [0.90, 0.48, 0.34],
    });
  }

  if (spotlight) {
    footer.addEventListener('mousemove', function(e) {
      if (!motionEnabled) return;
      const rect = footer.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const rx = ((e.clientX - rect.left) / rect.width) * 100;
      const ry = ((e.clientY - rect.top) / rect.height) * 100;
      spotlight.style.setProperty('--fx', rx.toFixed(2) + '%');
      spotlight.style.setProperty('--fy', ry.toFixed(2) + '%');
      spotlight.classList.add('is-active');
    }, { passive: true });

    footer.addEventListener('mouseleave', function() {
      spotlight.classList.remove('is-active');
    }, { passive: true });
  }
})();

// Custom Editorial Visage Video HUD Controller
function formatVideoTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function syncVisagePlayUI(isPlaying) {
  const slide0 = document.getElementById('exhibitSlide0');
  const btn = document.getElementById('visagePlayBtn');
  const hudPlay = document.getElementById('visageHudPlay');
  if (slide0) {
    slide0.classList.toggle('is-playing', isPlaying);
    slide0.setAttribute('data-cursor', isPlaying ? 'Pause' : 'Play');
  }
  if (btn) {
    btn.innerHTML = isPlaying
      ? '<span>Pause Voice Demo</span><span>&#10074;&#10074;</span>'
      : '<span>Play Japanese Demo</span><span>&#9658;</span>';
  }
  if (hudPlay) {
    hudPlay.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9658;';
  }
}

function playVisageDemo(e) {
  if (e) e.preventDefault();
  const vid = document.getElementById('visageVideo');
  if (!vid) return;
  if (vid.paused) {
    vid.play().catch(function() {});
  } else {
    vid.pause();
  }
}

function toggleVisageMute(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const vid = document.getElementById('visageVideo');
  const muteBtn = document.getElementById('visageHudMute');
  if (!vid) return;
  vid.muted = !vid.muted;
  if (muteBtn) muteBtn.textContent = vid.muted ? 'MUTE' : 'VOL';
}

document.addEventListener('DOMContentLoaded', function() {
  const vid = document.getElementById('visageVideo');
  const track = document.getElementById('visageHudTrack');
  const fill = document.getElementById('visageHudFill');
  const timeEl = document.getElementById('visageHudTime');
  if (vid) {
    const updateHudTime = function() {
      const dur = vid.duration || 8;
      const cur = vid.currentTime || 0;
      if (fill) fill.style.width = Math.min(100, (cur / dur) * 100).toFixed(2) + '%';
      if (timeEl) timeEl.textContent = formatVideoTime(cur) + ' / ' + formatVideoTime(dur);
    };
    vid.addEventListener('loadedmetadata', updateHudTime);
    vid.addEventListener('timeupdate', updateHudTime);
    vid.addEventListener('ended', function() { syncVisagePlayUI(false); });
    vid.addEventListener('pause', function() { syncVisagePlayUI(false); });
    vid.addEventListener('play', function() { syncVisagePlayUI(true); });

    if (track) {
      let dragging = false;
      const seekFromEvent = function(clientX) {
        const rect = track.getBoundingClientRect();
        if (!rect.width || !vid.duration) return;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        vid.currentTime = ratio * vid.duration;
        updateHudTime();
      };
      track.addEventListener('mousedown', function(ev) {
        ev.stopPropagation();
        dragging = true;
        seekFromEvent(ev.clientX);
      });
      window.addEventListener('mousemove', function(ev) {
        if (dragging) seekFromEvent(ev.clientX);
      }, { passive: true });
      window.addEventListener('mouseup', function() { dragging = false; }, { passive: true });
    }
  }

  initForecastChart();
  initArchCursor();
});

/* ==================================================
   Interactive Forecasting Benchmark SVG Chart (Slide 1)
   ================================================== */
const forecastSeriesData = [
  { w: 'W01', actual: 412, prophet: 418, sarimax: 435 },
  { w: 'W02', actual: 438, prophet: 432, sarimax: 448 },
  { w: 'W03', actual: 465, prophet: 460, sarimax: 452 },
  { w: 'W04', actual: 446, prophet: 451, sarimax: 464 },
  { w: 'W05', actual: 492, prophet: 486, sarimax: 468 },
  { w: 'W06', actual: 528, prophet: 519, sarimax: 475 },
  { w: 'W07', actual: 545, prophet: 538, sarimax: 484 },
  { w: 'W08', actual: 504, prophet: 512, sarimax: 492 },
  { w: 'W09', actual: 562, prophet: 554, sarimax: 505 },
  { w: 'W10', actual: 590, prophet: 583, sarimax: 512 },
  { w: 'W11', actual: 572, prophet: 578, sarimax: 518 },
  { w: 'W12', actual: 618, prophet: 608, sarimax: 526 },
];
let forecastChartMode = 'both';

function setForecastChartMode(mode, btn) {
  forecastChartMode = mode;
  document.querySelectorAll('.fc-filter-btn').forEach(b => b.classList.toggle('is-active', b === btn));
  initForecastChart();
}

function initForecastChart() {
  const svg = document.getElementById('forecastChartSvg');
  const wrap = document.getElementById('forecastSvgWrap');
  const tooltip = document.getElementById('forecastTooltip');
  if (!svg) return;

  const W = 600, H = 220, padL = 34, padR = 14, padT = 16, padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const minY = 390, maxY = 640;

  const px = (i) => padL + (i / (forecastSeriesData.length - 1)) * plotW;
  const py = (v) => padT + (1 - (v - minY) / (maxY - minY)) * plotH;
  const linePts = (key) => forecastSeriesData.map((d, i) => `${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(' ');

  let markup = '';
  // Subtle grid lines
  [420, 490, 560, 620].forEach(val => {
    const y = py(val).toFixed(1);
    markup += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(247,239,225,0.08)" stroke-width="1"/>`;
    markup += `<text x="${padL - 6}" y="${Number(y) + 3}" fill="#8a8276" font-family="IBM Plex Mono, monospace" font-size="9" text-anchor="end">${val}k</text>`;
  });

  // Week labels
  forecastSeriesData.forEach((d, i) => {
    if (i % 2 === 0 || i === forecastSeriesData.length - 1) {
      markup += `<text x="${px(i).toFixed(1)}" y="${H - 6}" fill="#8a8276" font-family="IBM Plex Mono, monospace" font-size="9" text-anchor="middle">${d.w}</text>`;
    }
  });

  // Observed actual subtle dashed line
  markup += `<polyline fill="none" stroke="rgba(247,239,225,0.42)" stroke-width="1.5" stroke-dasharray="3 3" points="${linePts('actual')}"/>`;

  if (forecastChartMode === 'both' || forecastChartMode === 'sarimax') {
    markup += `<polyline fill="none" stroke="#8da2b0" stroke-width="2.2" points="${linePts('sarimax')}"/>`;
  }
  if (forecastChartMode === 'both' || forecastChartMode === 'prophet') {
    const firstX = px(0).toFixed(1);
    const lastX = px(forecastSeriesData.length - 1).toFixed(1);
    const base = (H - padB).toFixed(1);
    markup += `<polygon fill="rgba(224,122,95,0.14)" points="${firstX},${base} ${linePts('prophet')} ${lastX},${base}"/>`;
    markup += `<polyline fill="none" stroke="#e07a5f" stroke-width="2.6" points="${linePts('prophet')}"/>`;
  }

  markup += `<line id="fcCrosshair" x1="0" y1="${padT}" x2="0" y2="${H - padB}" stroke="rgba(247,239,225,0.45)" stroke-width="1" opacity="0"/>`;
  markup += `<circle id="fcDotActual" cx="0" cy="0" r="3.5" fill="#f7efe1" opacity="0"/>`;
  markup += `<circle id="fcDotProphet" cx="0" cy="0" r="4.5" fill="#e07a5f" stroke="#f7efe1" stroke-width="1.2" opacity="0"/>`;
  markup += `<circle id="fcDotSarimax" cx="0" cy="0" r="4" fill="#8da2b0" stroke="#f7efe1" stroke-width="1.2" opacity="0"/>`;
  svg.innerHTML = markup;

  if (!wrap || wrap.dataset.bound === '1') return;
  wrap.dataset.bound = '1';

  const onMove = function(clientX) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const svgX = relX * W;
    const norm = Math.max(0, Math.min(1, (svgX - padL) / plotW));
    const idx = Math.round(norm * (forecastSeriesData.length - 1));
    const d = forecastSeriesData[idx];
    const cx = px(idx);

    const cross = document.getElementById('fcCrosshair');
    const da = document.getElementById('fcDotActual');
    const dp = document.getElementById('fcDotProphet');
    const ds = document.getElementById('fcDotSarimax');
    if (cross) { cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('opacity', '1'); }
    if (da) { da.setAttribute('cx', cx); da.setAttribute('cy', py(d.actual)); da.setAttribute('opacity', '1'); }
    if (dp) {
      const showP = forecastChartMode !== 'sarimax';
      dp.setAttribute('cx', cx); dp.setAttribute('cy', py(d.prophet)); dp.setAttribute('opacity', showP ? '1' : '0');
    }
    if (ds) {
      const showS = forecastChartMode !== 'prophet';
      ds.setAttribute('cx', cx); ds.setAttribute('cy', py(d.sarimax)); ds.setAttribute('opacity', showS ? '1' : '0');
    }
    if (tooltip) {
      let html = `<strong>${d.w}</strong> · Actual: ${d.actual}k`;
      if (forecastChartMode !== 'sarimax') html += `<br><span style="color:#8c4830">Prophet: ${d.prophet}k</span>`;
      if (forecastChartMode !== 'prophet') html += `<br><span style="color:#4a5d6a">SARIMAX: ${d.sarimax}k</span>`;
      tooltip.innerHTML = html;
      const tipX = Math.min(rect.width - 138, Math.max(10, (cx / W) * rect.width + 12));
      tooltip.style.left = tipX.toFixed(0) + 'px';
      tooltip.classList.add('is-visible');
    }
  };

  wrap.addEventListener('mousemove', (e) => onMove(e.clientX), { passive: true });
  wrap.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) onMove(e.touches[0].clientX);
  }, { passive: true });
  wrap.addEventListener('mouseleave', () => {
    ['fcCrosshair', 'fcDotActual', 'fcDotProphet', 'fcDotSarimax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('opacity', '0');
    });
    if (tooltip) tooltip.classList.remove('is-visible');
  }, { passive: true });
}

/* ==================================================
   Custom Architectural Cursor (Desktop Fine Pointers)
   ================================================== */
function initArchCursor() {
  const cursor = document.getElementById('archCursor');
  const dot = document.getElementById('archCursorDot');
  const labelEl = document.getElementById('archCursorLabel');
  if (!cursor || !window.matchMedia || !window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;

  let tx = -100, ty = -100, cx = -100, cy = -100, active = false, pressed = false, rafId = null;

  function step() {
    rafId = null;
    const dx = tx - cx;
    const dy = ty - cy;
    cx += dx * 0.2;
    cy += dy * 0.2;
    const ringScale = pressed ? 0.82 : 1;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${ringScale})`;
    if (active && (Math.abs(dx) > 0.25 || Math.abs(dy) > 0.25)) {
      rafId = window.requestAnimationFrame(step);
    }
  }

  document.addEventListener('mousemove', function(e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!active) {
      cx = tx;
      cy = ty;
      active = true;
      document.documentElement.classList.add('has-custom-cursor');
      cursor.classList.add('is-visible');
      if (dot) dot.classList.add('is-visible');
    }
    if (dot) {
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
    }

    const nativeZone = e.target && e.target.closest ? e.target.closest('input, textarea, iframe') : null;
    if (nativeZone) {
      cursor.classList.add('is-hidden');
      if (dot) dot.classList.add('is-hidden');
    } else {
      cursor.classList.remove('is-hidden');
      if (dot) dot.classList.remove('is-hidden');
    }

    const labelTarget = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null;
    const hoverTarget = e.target && e.target.closest ? e.target.closest('[data-cursor], a, button, .work-rail-item, .cert-pill-item, .exp-card__media-preview') : null;
    const labelText = labelTarget ? labelTarget.getAttribute('data-cursor') : '';

    if (labelText && !nativeZone) {
      cursor.classList.add('is-labeled');
      cursor.classList.remove('is-hover');
      if (dot) { dot.classList.add('is-labeled'); dot.classList.remove('is-hover'); }
      if (labelEl) labelEl.textContent = labelText;
    } else if (hoverTarget && !nativeZone) {
      cursor.classList.add('is-hover');
      cursor.classList.remove('is-labeled');
      if (dot) { dot.classList.add('is-hover'); dot.classList.remove('is-labeled'); }
    } else {
      cursor.classList.remove('is-hover', 'is-labeled');
      if (dot) dot.classList.remove('is-hover', 'is-labeled');
    }

    if (!rafId) rafId = window.requestAnimationFrame(step);
  }, { passive: true });

  document.addEventListener('mousedown', function() {
    pressed = true;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%) scale(0.82)`;
  }, { passive: true });

  window.addEventListener('mouseup', function() {
    pressed = false;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%) scale(1)`;
  }, { passive: true });

  document.addEventListener('mouseleave', function() {
    active = false;
    cursor.classList.remove('is-visible', 'is-hover', 'is-labeled');
    if (dot) dot.classList.remove('is-visible', 'is-hover', 'is-labeled');
  }, { passive: true });

  document.addEventListener('touchstart', function() {
    document.documentElement.classList.remove('has-custom-cursor');
    cursor.classList.remove('is-visible');
    if (dot) dot.classList.remove('is-visible');
  }, { passive: true });
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

// Scroll-Drawn Chronologia Spine Controller
(function initTimelineSpine() {
  const stream = document.getElementById('timelineStream');
  const spineProgress = document.getElementById('timelineSpineProgress');
  if (!stream || !spineProgress) return;

  let spineTicking = false;

  function updateTimelineSpine() {
    const streamRect = stream.getBoundingClientRect();
    const totalHeight = Math.max(0, stream.offsetHeight - 52);
    const probeY = window.innerHeight * 0.65;
    const rawFill = probeY - (streamRect.top + 24);
    const fillHeight = Math.min(totalHeight, Math.max(0, rawFill));

    spineProgress.style.height = fillHeight.toFixed(1) + 'px';

    const visibleNodes = stream.querySelectorAll('.timeline-node:not(.is-hidden)');
    visibleNodes.forEach(node => {
      const markerTop = node.offsetTop + 28;
      node.classList.toggle('is-spine-lit', fillHeight >= markerTop - 24);
    });

    spineTicking = false;
  }

  window.updateTimelineSpine = updateTimelineSpine;

  function onScroll() {
    if (!spineTicking) {
      window.requestAnimationFrame(updateTimelineSpine);
      spineTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateTimelineSpine();
})();

// Filter Experience / Timeline Nodes (with staggered cascade reveal)
function filterTimeline(category) {
  const buttons = document.querySelectorAll('.exp-filter-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.filter === category);
  });

  const nodes = document.querySelectorAll('.timeline-node');
  let visibleIndex = 0;
  nodes.forEach(node => {
    const card = node.querySelector('.timeline-card');
    if (category === 'all' || node.dataset.category === category) {
      node.classList.remove('is-hidden');
      if (card) {
        card.style.transitionDelay = Math.min(visibleIndex * 45, 220) + 'ms';
      }
      visibleIndex++;
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        node.classList.remove('is-revealed');
        void node.offsetWidth;
        node.classList.add('is-revealed');
      } else if (rect.top >= window.innerHeight * 0.85) {
        node.classList.remove('is-revealed');
      }
      if (card) {
        setTimeout(() => { card.style.transitionDelay = ''; }, 500);
      }
    } else {
      node.classList.add('is-hidden');
      node.classList.remove('is-revealed');
      if (card) card.style.transitionDelay = '';
    }
  });

  if (typeof window.updateTimelineSpine === 'function') {
    window.requestAnimationFrame(window.updateTimelineSpine);
  }
}

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
  if (!modal || !modal.classList.contains('is-open')) return;

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

// Global Keyboard Listener (ESC closes top-most overlay/modal)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeMediaModal();
    closeCaseStudyModal();
    toggleMenuOverlay(true);
  }
});

// --------------------------------------------------
// Feature: Atmospheric Fresco Particles Canvas
// --------------------------------------------------
(function() {
  const canvas = document.getElementById('heroAtmosphere');
  if (!canvas || PREFERS_REDUCED_MOTION) return;
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
    requestAnimationFrame(render);
    ctx.clearRect(0, 0, width, height);
    if (!motionEnabled) return;
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
// Feature: Project 03 SAP Drawer Tab Switcher
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
  const email = "nikkiiwan61@gmail.com";
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
   -------------------------------------------------- */
(function() {
  const canvas = document.getElementById('dynamicAtmosphereCanvas');
  if (!canvas || PREFERS_REDUCED_MOTION) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', function() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }, { passive: true });

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
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, w, h);
    if (!motionEnabled) return;

    time += 0.016;
    if (mouse.active) {
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 350);
      grad.addColorStop(0, 'rgba(247, 241, 230, 0.22)');
      grad.addColorStop(0.5, 'rgba(224, 212, 190, 0.08)');
      grad.addColorStop(1, 'rgba(216, 205, 183, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

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
  }
  animate();
})();

/* --------------------------------------------------
   Estheet Kinetic Entrance Controller
   -------------------------------------------------- */
(function() {
  const curtain = document.getElementById('estheetCurtain');
  const bar = document.getElementById('estheetProgress');
  const sourceTitle = document.getElementById('kineticTitle');
  const targetBrand = document.querySelector('.brand-name span');
  if (!curtain || !bar || !sourceTitle || !targetBrand) return;

  if (PREFERS_REDUCED_MOTION) {
    curtain.remove();
    document.body.style.overflow = '';
    return;
  }

  document.body.style.overflow = 'hidden';
  if (window.lenis) window.lenis.stop();

  requestAnimationFrame(function() {
    bar.style.width = '25%';
  });

  const criticalImages = [
    'assets/profile-picture.jpg',
    'assets/layers/clean_fresco_bg.jpg',
    'assets/layers/adam_layer.webp',
    'assets/layers/cyborg_layer.webp'
  ];

  let loadedCount = 0;
  let hasTransitioned = false;

  function runGlideTransition() {
    if (hasTransitioned) return;
    hasTransitioned = true;

    bar.style.width = '100%';

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function() {
      setTimeout(function() {
        const sRect = sourceTitle.getBoundingClientRect();
        const tRect = targetBrand.getBoundingClientRect();
        const tComp = window.getComputedStyle(targetBrand);

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

        sourceTitle.style.opacity = '0';
        const sub = document.querySelector('.estheet-subline');
        const kicker = document.querySelector('.estheet-kicker');
        const barWrap = document.querySelector('.estheet-bar-wrap');
        if (sub) sub.style.opacity = '0';
        if (kicker) kicker.style.opacity = '0';
        if (barWrap) barWrap.style.opacity = '0';
        targetBrand.style.opacity = '0';

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
            if (window.lenis) window.lenis.start();
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

  setTimeout(runGlideTransition, 1200);
})();

/* --------------------------------------------------
   Experience & Background: Reversible Scroll Reveal Controller
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
   -------------------------------------------------- */
(function() {
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

  const headings = document.querySelectorAll('.intro-heading, .section-heading, .footer-heading');
  headings.forEach(function(heading) {
    const words = heading.textContent.trim().split(/\s+/);
    heading.innerHTML = words.map(function(w, idx) {
      return '<span class="kinetic-word-mask"><span class="kinetic-word" style="--word-i:' + idx + '">' + w + '</span></span>';
    }).join(' ');
  });

  const labels = document.querySelectorAll('.intro-eyebrow, .section-label');
  labels.forEach(function(l) { l.classList.add('kinetic-label-init'); });

  const descs = document.querySelectorAll('.section-desc, .footer-desc');
  descs.forEach(function(d) { d.classList.add('kinetic-desc-init'); });

  const staggerGroups = document.querySelectorAll('.intro-meta-tags, .intro-actions, .footer-contacts');
  staggerGroups.forEach(function(g) { g.classList.add('kinetic-stagger-init'); });

  if ('IntersectionObserver' in window) {
    const typographyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        } else if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove('is-revealed');
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.06
    });

    headings.forEach(function(h) { typographyObserver.observe(h); });
    labels.forEach(function(l) { typographyObserver.observe(l); });
    descs.forEach(function(d) { typographyObserver.observe(d); });
    staggerGroups.forEach(function(g) { typographyObserver.observe(g); });
  } else {
    headings.forEach(function(h) { h.classList.add('is-revealed'); });
    document.querySelectorAll('.kinetic-label-init, .kinetic-desc-init, .kinetic-stagger-init').forEach(function(el) {
      el.classList.add('is-revealed');
    });
  }

  /* Continuous Scroll-Linked Section Depth & Portrait Choreography */
  const introEl = document.getElementById('intro');
  const footerEl = document.getElementById('contact');
  const timelineNodes = document.querySelectorAll('.timeline-node');
  let choreoTicking = false;

  function updateSectionChoreography() {
    const vh = window.innerHeight || 1;
    const isDesktop = window.innerWidth > 900;

    if (introEl) {
      if (!isDesktop) {
        introEl.style.setProperty('--intro-p', '0');
        introEl.style.setProperty('--intro-abs-p', '0');
      } else {
        const r = introEl.getBoundingClientRect();
        const centerOffset = (r.top + r.height * 0.5 - vh * 0.5) / vh;
        const p = Math.max(-1, Math.min(1, centerOffset));
        introEl.style.setProperty('--intro-p', p.toFixed(4));
        introEl.style.setProperty('--intro-abs-p', Math.abs(p).toFixed(4));
      }
    }

    if (timelineNodes.length) {
      timelineNodes.forEach(function(node) {
        if (!isDesktop || node.classList.contains('is-hidden')) {
          node.style.setProperty('--node-p', '0');
          node.style.setProperty('--node-abs-p', '0');
          return;
        }
        const nr = node.getBoundingClientRect();
        if (nr.bottom < -120 || nr.top > vh + 120) return;
        const nCenter = (nr.top + nr.height * 0.5 - vh * 0.5) / vh;
        const np = Math.max(-1, Math.min(1, nCenter));
        node.style.setProperty('--node-p', np.toFixed(4));
        node.style.setProperty('--node-abs-p', Math.abs(np).toFixed(4));
      });
    }

    if (footerEl) {
      const fr = footerEl.getBoundingClientRect();
      const fp = !isDesktop ? 1 : Math.min(1, Math.max(0, (vh - fr.top) / (vh * 0.55)));
      footerEl.style.setProperty('--footer-p', fp.toFixed(4));
    }

    choreoTicking = false;
  }

  function onChoreoScroll() {
    if (!choreoTicking) {
      window.requestAnimationFrame(updateSectionChoreography);
      choreoTicking = true;
    }
  }

  window.addEventListener('scroll', onChoreoScroll, { passive: true });
  window.addEventListener('resize', onChoreoScroll, { passive: true });
  updateSectionChoreography();
})();

/* ==================================================
   Floating AI Assistant Controller (Gemini-Powered)
   ================================================== */
(function() {
  window.NIKKI_AI_WORKER_URL = 'https://cold-cell-15a6.syltreets.workers.dev/';

  const MAX_QUERIES = 8;
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
        inputEl.placeholder = `Query limit reached (${MAX_QUERIES}/${MAX_QUERIES})`;
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
        counterEl.textContent = `Counter reset! (${MAX_QUERIES} remaining)`;
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

  function getGroundedResponse(query) {
    const q = query.toLowerCase().trim();

    if (/^(hi|hello|hey|halo|pagi|siang|sore|malam|yo|sup)\b/.test(q)) {
      return "Hi! You can ask me specific questions about <strong>Visage Link</strong> (8GB VRAM local voice AI), the <strong>12.6M retail forecasting</strong> benchmark, <strong>SAP S/4HANA &amp; ABAP</strong>, <strong>BorrowIn</strong> (C# .NET / SQL Server), <strong>Argos Club</strong>, or Nikki's background at UMN.";
    }

    if (q.includes('sap') || q.includes('abap') || q.includes('fiori') || q.includes('odata') || q.includes('enterprise')) {
      return "Nikki engineered an enterprise expense analytics solution on <strong>SAP S/4HANA</strong>. He developed custom ABAP Data Provider Classes (<code>DPC_EXT</code>) with dynamic OpenSQL queries to serve transactional data via OData Gateway to an <strong>SAPUI5/Fiori Analytical List Page</strong> with interactive dimension filters.";
    }

    if (q.includes('visage') || q.includes('avatar') || q.includes('voice') || q.includes('llm') || q.includes('sovits') || q.includes('qwen')) {
      return "<strong>Visage Link</strong> is Nikki's voice AI companion system. It integrates a 3D VTuber avatar via VSeeFace (VMC/OSC protocol), local quantized <strong>Qwen 2.5 7B</strong> inference via Ollama, word-level streaming with custom <strong>GPT-SoVITS</strong> for Japanese speech synthesis, and SQLite memory—all tuned within an 8GB VRAM constraint.";
    }

    if (q.includes('forecast') || q.includes('retail') || q.includes('prophet') || q.includes('sarimax') || q.includes('transaction')) {
      return "In his retail forecasting project, Nikki analyzed <strong>12.6 million transactions</strong>. His <strong>Facebook Prophet</strong> pipeline achieved an <strong>R² of 0.835</strong>, substantially outperforming a classical SARIMAX baseline and optimizing grocery inventory allocations.";
    }

    if (q.includes('borrowin') || q.includes('library') || q.includes('c#') || q.includes('.net') || q.includes('sql server') || q.includes('rbac')) {
      return "<strong>BorrowIn</strong> is a layered C# (.NET Framework) &amp; SQL Server library management desktop application with Role-Based Access Control (Admin / Borrower) and automated RDLC inventory reporting.";
    }

    if (q.includes('argos') || q.includes('proxmox') || q.includes('netbird') || q.includes('workshop')) {
      return "At <strong>Argos Club UMN</strong> (Comms Member), Nikki supports hands-on workshops guiding 10+ participants through Proxmox VE virtualization, container setup, and NetBird mesh networking.";
    }

    if (q.includes('bca') || q.includes('autologger') || q.includes('telegram') || q.includes('apps script')) {
      return "<strong>BCA Autologger</strong> parses bank confirmation emails automatically via Google Apps Script into Google Sheets and sends instant verification alerts through Telegram Bot webhooks.";
    }

    if (q.includes('skill') || q.includes('stack') || q.includes('tech') || q.includes('language') || q.includes('python') || q.includes('tool')) {
      return "Nikki works primarily with <strong>Python</strong> (PyTorch, Pandas, Prophet, SARIMAX), <strong>C# (.NET)</strong>, <strong>SQL Server / SQLite</strong>, <strong>ABAP &amp; SAPUI5/Fiori</strong>, <strong>JavaScript</strong>, and local LLM / speech pipelines.";
    }

    if (q.includes('cert') || q.includes('ibm') || q.includes('badge') || q.includes('credential')) {
      return "Nikki holds verified <strong>IBM SkillsBuild</strong> credentials including <em>AI Agent for Legal</em> (IBM &amp; Google AI Studio) and <em>AI Literacy</em>, alongside Adobe Learning Manager coursework.";
    }

    if (q.includes('gpa') || q.includes('education') || q.includes('umn') || q.includes('college') || q.includes('role') || q.includes('graduat') || q.includes('hire') || q.includes('work')) {
      return "Nikki is an Information Systems undergraduate at <strong>Universitas Multimedia Nusantara (UMN)</strong>, enrolled August 2024 &ndash; expected August 2028, with an official cumulative GPA of <strong>3.77 / 4.00</strong>. He is actively <strong>Open to Work</strong> for Software Engineering, AI/ML, and Enterprise Systems roles.";
    }

    if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('whatsapp') || q.includes('reach')) {
      return "You can connect with Nikki directly on <a href='https://wa.me/6282239608228' target='_blank' style='color:var(--terracotta);text-decoration:underline;'>WhatsApp (+62 822-3960-8228)</a> or email him at <a href='mailto:nikkiiwan61@gmail.com' style='color:var(--terracotta);text-decoration:underline;'>nikkiiwan61@gmail.com</a>.";
    }

    return "Nikki Tirta Iwan is an Information Systems engineer (GPA 3.77 / 4.00) specializing in Voice AI companions (Visage Link), enterprise architecture (SAP S/4HANA &amp; ABAP), and large-scale time-series forecasting. Feel free to ask about a specific project, tech stack, or his experience at UMN!";
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
      <strong>Device Query Limit Reached (${MAX_QUERIES}/${MAX_QUERIES})</strong>
      <p style="margin: 6px 0 0 0; color: var(--text-secondary);">
        Thank you for testing the AI Assistant! To discuss roles, projects, or schedule an interview, reach Nikki directly:
      </p>
      <div class="ai-limit-contact-btns">
        <a class="ai-limit-btn ai-limit-btn--wa" href="https://wa.me/6282239608228" target="_blank" rel="noopener">
          WhatsApp &rarr;
        </a>
        <a class="ai-limit-btn ai-limit-btn--email" href="mailto:nikkiiwan61@gmail.com">
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

    appendMessage(query, 'user');
    inputEl.value = '';

    const chipsEl = document.getElementById('aiPromptChips');
    if (chipsEl) chipsEl.style.display = 'none';

    incrementQueriesUsed();
    showTypingIndicator();

    let botReply = '';
    const workerUrl = window.NIKKI_AI_WORKER_URL;

    if (workerUrl && workerUrl.startsWith('http')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
          botReply = (data && data.reply) ? data.reply : getGroundedResponse(query);
        } else {
          botReply = getGroundedResponse(query);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        botReply = getGroundedResponse(query);
      }
    } else {
      await new Promise(r => setTimeout(r, 650));
      botReply = getGroundedResponse(query);
    }

    removeTypingIndicator();
    appendMessage(botReply, 'bot');

    if (getQueriesRemaining() <= 0) {
      showLimitReachedCard();
    }
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const win = document.getElementById('aiChatWindow');
      if (win && win.classList.contains('is-open')) {
        toggleAiChat();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCounterUI);
  } else {
    updateCounterUI();
  }
})();
