/* ==========================================================================
   Paparao Educational Academy — interactions
   Intro splash · sticky header · mobile drawer · scroll reveal · counters
   ========================================================================== */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shot = location.search.indexOf('shot') > -1;
  if (shot) document.body.classList.add('shot');

  /* Always start from the top on (re)load — ignore restored scroll / URL hash */
  if (!shot) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }

  if (location.search.indexOf('only') > -1) {
    var m = location.search.match(/only=([a-z]+)/);
    var keep = m ? m[1] : 'gallery';
    document.querySelectorAll('main > section').forEach(function (s) { if (s.id !== keep) s.style.display = 'none'; });
  }

  /* ---- Intro splash (homepage; plays on every load/reload) ---- */
  var intro = document.getElementById('intro');
  if (intro) {
    if (shot) {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      document.body.classList.remove('intro-lock');
    } else {
      document.body.classList.add('intro-lock');
      var dismissed = false;
      var autoTimer;
      var hide = function () {
        if (dismissed) return;
        dismissed = true;
        window.clearTimeout(autoTimer);
        intro.classList.add('is-done');
        document.body.classList.remove('intro-lock');
        window.scrollTo(0, 0);
        window.setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 950);
      };
      autoTimer = window.setTimeout(hide, reduceMotion ? 1400 : 5400);
      ['introSkip', 'introEnter', 'introCrest'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', hide);
      });

      /* Mouse / pointer parallax on the sketch motifs */
      if (!reduceMotion) {
        var stage = document.getElementById('introStage');
        var motifs = intro.querySelectorAll('.motif');
        if (stage && motifs.length) {
          var raf = null, tx = 0, ty = 0;
          var apply = function () {
            motifs.forEach(function (m) {
              var depth = parseFloat(m.getAttribute('data-depth')) || 3;
              m.style.setProperty('--px', (tx * depth * 1.4).toFixed(1) + 'px');
              m.style.setProperty('--py', (ty * depth * 1.4).toFixed(1) + 'px');
            });
            raf = null;
          };
          stage.addEventListener('pointermove', function (e) {
            var r = stage.getBoundingClientRect();
            tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
            if (!raf) raf = requestAnimationFrame(apply);
          });
          stage.addEventListener('pointerleave', function () {
            tx = 0; ty = 0;
            if (!raf) raf = requestAnimationFrame(apply);
          });
        }
      }
    }
  }

  /* ---- Sticky header shadow on scroll ---- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile drawer ---- */
  var drawer = document.getElementById('drawer');
  var openBtn = document.querySelector('.nav-toggle');
  var closeBtn = drawer && drawer.querySelector('.drawer-close');
  var scrim = drawer && drawer.querySelector('.mobile-drawer__scrim');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = drawer.querySelector('a, button');
      if (first) first.focus();
    } else if (openBtn) {
      openBtn.focus();
    }
  }
  if (openBtn) openBtn.addEventListener('click', function () { setDrawer(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) setDrawer(false);
  });
  if (drawer) {
    drawer.querySelectorAll('a.m-link, .mobile-drawer .btn').forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
  }
  if (drawer && location.search.indexOf('openmenu') > -1) setDrawer(true);

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || shot || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- Animated counters ---- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---- Scrollspy: highlight active section in nav ---- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
      });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Smooth scroll for in-page anchors (with reduced-motion respect) ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  /* ---- Hero slider (autoplay + arrows + dots + swipe) ---- */
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.slider__track');
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.slider__slide'));
    var dotsWrap = slider.querySelector('.slider__dots');
    if (!track || slides.length < 2) return;
    var i = 0, timer = null, interval = 5000;

    var dots = slides.map(function (_, n) {
      var d = document.createElement('button');
      d.className = 'slider__dot' + (n === 0 ? ' is-active' : '');
      d.type = 'button';
      d.setAttribute('aria-label', 'Go to slide ' + (n + 1));
      d.addEventListener('click', function () { go(n); maybe(); });
      if (dotsWrap) dotsWrap.appendChild(d);
      return d;
    });

    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    }
    function next() { go(i + 1); }
    function prev() { go(i - 1); }
    var inView = true, hovering = false;
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function maybe() { stop(); if (inView && !hovering && !shot) timer = window.setInterval(next, interval); }

    var nextBtn = slider.querySelector('.slider__btn.next');
    var prevBtn = slider.querySelector('.slider__btn.prev');
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); maybe(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); maybe(); });

    slider.addEventListener('mouseenter', function () { hovering = true; maybe(); });
    slider.addEventListener('mouseleave', function () { hovering = false; maybe(); });

    /* swipe */
    var x0 = null;
    slider.addEventListener('pointerdown', function (e) { x0 = e.clientX; track.classList.add('no-anim'); });
    slider.addEventListener('pointerup', function (e) {
      track.classList.remove('no-anim');
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      if (Math.abs(dx) > 40) { (dx < 0 ? next() : prev()); maybe(); }
    });

    go(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { inView = en.isIntersecting; maybe(); });
      }, { threshold: 0.2 }).observe(slider);
    } else { maybe(); }
  });

  /* ---- Reels mosaic: continuous autoplay, solo-unmute, fullscreen ---- */
  var reels = Array.prototype.slice.call(document.querySelectorAll('.reel[data-reel]'));
  if (reels.length) {
    var videosByReel = reels.map(function (r) { return r.querySelector('video'); });

    // ensure muted (required for autoplay) and robust play with retry
    videosByReel.forEach(function (v) { if (v) { v.muted = true; v.setAttribute('playsinline', ''); } });
    function tryPlay(v) {
      if (!v) return;
      v.muted = true;
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        // decoder/bandwidth busy — retry once the clip is ready (when others free up)
        var retry = function () { if (isVisible(v)) { v.play().catch(function () {}); } };
        v.addEventListener('canplay', retry, { once: true });
        setTimeout(function () { if (isVisible(v) && v.paused) v.play().catch(function () {}); }, 1200);
      });
    }
    function isVisible(v) {
      var r = v.getBoundingClientRect();
      return r.top < (window.innerHeight || 0) && r.bottom > 0;
    }
    // keep them playing while on screen (paused off-screen to free the decoder)
    if ('IntersectionObserver' in window && !reduceMotion && !shot) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) tryPlay(en.target);
          else en.target.pause();
        });
      }, { threshold: 0.15 });
      videosByReel.forEach(function (v) { if (v) vio.observe(v); });
    } else if (!reduceMotion && !shot) {
      videosByReel.forEach(tryPlay);
    }

    reels.forEach(function (r) {
      var v = r.querySelector('video');
      var soundBtn = r.querySelector('.reel__btn.sound');
      var fullBtn = r.querySelector('.reel__btn.full');
      if (v && soundBtn) {
        soundBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (v.muted) {
            videosByReel.forEach(function (ov, k) { if (ov && ov !== v) { ov.muted = true; reels[k].classList.remove('is-unmuted'); } });
            v.muted = false; r.classList.add('is-unmuted');
            var p = v.play(); if (p && p.catch) p.catch(function () {});
          } else {
            v.muted = true; r.classList.remove('is-unmuted');
          }
        });
      }
      if (v && fullBtn) {
        fullBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (v.requestFullscreen) v.requestFullscreen().catch(function () {});
          else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
          else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
        });
      }
    });
  }

  /* ---- Gallery lightbox ---- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lbImg');
    var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item[data-full]'));
    var sources = items.map(function (it) {
      return { src: it.getAttribute('data-full'), alt: (it.querySelector('img') || {}).alt || '' };
    });
    var idx = 0, lastFocus = null;
    var show = function (i) {
      idx = (i + sources.length) % sources.length;
      lbImg.src = sources[idx].src;
      lbImg.alt = sources[idx].alt;
    };
    var open = function (i, trigger) {
      lastFocus = trigger || null;
      show(i);
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      document.getElementById('lbClose').focus();
    };
    var close = function () {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    items.forEach(function (it, i) {
      it.setAttribute('tabindex', '0');
      it.setAttribute('role', 'button');
      it.addEventListener('click', function () { open(i, it); });
      it.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i, it); }
      });
    });
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', function () { show(idx - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---- Footer year ---- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- News / Announcements: render from the admin store ---- */
  (function renderNews() {
    var grid = document.getElementById('newsGrid');
    if (!grid || !window.PPS) return;
    var items = PPS.get('ppsAnnouncements', PPS.DEFAULT_NEWS);
    if (!items || !items.length) {
      grid.innerHTML = '<p style="color:var(--fg-dim)">No announcements yet. Please check back soon.</p>';
      return;
    }
    var delays = ['', 'd1', 'd2', 'd3'];
    grid.innerHTML = items.map(function (it, i) {
      return '<article class="news-card reveal in ' + (delays[i % 4]) + '">' +
        '<span class="news-card__cat">' + PPS.escape(it.cat || 'News') + '</span>' +
        (it.date ? '<span class="meta">' + PPS.escape(it.date) + '</span>' : '') +
        '<h3>' + PPS.escape(it.title || '') + '</h3>' +
        (it.body ? '<p style="color:var(--fg-dim)">' + PPS.escape(it.body) + '</p>' : '') +
        '</article>';
    }).join('');
  })();

  /* ---- Forms: store submissions (for the admin) + confirm ---- */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var store = form.getAttribute('data-store');
      if (store && window.PPS) {
        var rec = { _ts: new Date().toISOString() };
        try {
          new FormData(form).forEach(function (v, k) {
            rec[k] = (typeof v === 'string') ? v : ('[file] ' + (v && v.name ? v.name : ''));
          });
        } catch (err) {}
        PPS.push(store === 'applications' ? 'ppsApplications' : 'ppsEnquiries', rec);
      }
      var note = form.querySelector('.form-note');
      if (note) {
        note.textContent = form.getAttribute('data-success') ||
          'Thank you — your details have been recorded. The school office will respond shortly.';
        note.hidden = false;
      }
      form.reset();
    });
  });
})();
