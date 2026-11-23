(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");
  // Fail open: if anything below throws, drop the hidden-until-revealed state.
  window.addEventListener("error", () => root.classList.remove("js"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Theme toggle (Tokyo Night / Tokyo Night Day) ---------- */
  const themeBtn = document.querySelector(".theme-toggle");
  const favicon = document.getElementById("favicon");
  const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
  const systemLight = window.matchMedia("(prefers-color-scheme: light)");
  const storedTheme = () => { try { return localStorage.getItem("theme"); } catch (e) { return null; } };
  const applyTheme = (t) => {
    root.setAttribute("data-theme", t);
    const next = t === "light" ? "dark" : "light";
    if (themeBtn) themeBtn.setAttribute("aria-label", `Switch to ${next} theme`);
    if (favicon) favicon.setAttribute("href", `assets/favicon-${t}.svg?v=3`);
    themeMetas.forEach((m) => m.setAttribute("content", t === "light" ? "#e1e2e7" : "#1a1b26"));
    window.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  };
  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const t = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      try { localStorage.setItem("theme", t); } catch (e) { /* private mode: theme still switches */ }
      if (reduceMotion) { applyTheme(t); return; }
      if (document.startViewTransition) { document.startViewTransition(() => applyTheme(t)); return; }
      root.classList.add("theme-anim");
      applyTheme(t);
      setTimeout(() => root.classList.remove("theme-anim"), 500);
    });
  }
  // Follow the OS setting until the visitor makes an explicit choice.
  systemLight.addEventListener?.("change", (e) => {
    const saved = storedTheme();
    if (saved !== "light" && saved !== "dark") applyTheme(e.matches ? "light" : "dark");
  });

  /* ---------- Nav: scrolled state, progress bar, current section ---------- */
  const nav = document.querySelector(".nav");
  const bar = document.querySelector(".progress span");
  let ticking = false, scrolled = null;
  // Scrollable height is cached (resize/load) so this rAF callback only writes.
  let maxScroll = 1;
  const measureMax = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
  measureMax();
  window.addEventListener("resize", measureMax, { passive: true });
  window.addEventListener("load", measureMax);
  if ("ResizeObserver" in window) new ResizeObserver(measureMax).observe(document.body);
  const onScroll = () => {
    const y = window.scrollY;
    const isScrolled = y > 24;
    if (isScrolled !== scrolled) { scrolled = isScrolled; nav.classList.toggle("is-scrolled", isScrolled); }
    if (bar) bar.style.transform = `scaleX(${Math.min(y / maxScroll, 1).toFixed(4)})`;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-links");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Scroll-built page (blueprint -> finished, tied to scroll position) ---------- */
  const build = !reduceMotion && "requestAnimationFrame" in window;
  const tracked = []; // { el, kind }
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  // Deterministic pseudo-random so chips scatter the same way on every visit.
  const rand = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

  if (build) {
    root.classList.add("build");
    const unreveal = (el) => el.classList.remove("reveal");

    document.querySelectorAll(".pillar, .tl-card, .project, .stack-group, .stats li").forEach((card) => {
      unreveal(card);
      card.classList.add("bld");
      [...card.children].forEach((child, i) => child.style.setProperty("--i", String(i)));
      const bp = document.createElement("span"); bp.className = "bld-bp"; bp.setAttribute("aria-hidden", "true");
      const fill = document.createElement("span"); fill.className = "bld-fill"; fill.setAttribute("aria-hidden", "true");
      card.prepend(bp, fill);
      tracked.push({ el: card, kind: "card" });
    });
    document.querySelectorAll(".stats").forEach(unreveal);
    document.querySelectorAll(".pillar li").forEach((li, i, all) => {
      li.classList.add("pillar-list-item");
      li.style.setProperty("--i", String([...li.parentElement.children].indexOf(li)));
    });
    document.querySelectorAll(".tl-card li").forEach((li) => {
      li.classList.add("tl-li");
      li.style.setProperty("--i", String([...li.parentElement.children].indexOf(li)));
    });
    document.querySelectorAll(".chips li").forEach((li, n) => {
      const i = [...li.parentElement.children].indexOf(li);
      li.style.setProperty("--i", String(i));
      li.style.setProperty("--dx", `${Math.round((rand(n + 1) - 0.5) * 80)}px`);
      li.style.setProperty("--dy", `${Math.round(18 + rand(n + 7) * 40)}px`);
      li.style.setProperty("--rot", `${Math.round((rand(n + 13) - 0.5) * 50)}deg`);
    });
    document.querySelectorAll("main .section h2, main .section .kicker").forEach((h) => {
      unreveal(h);
      h.classList.add("bld-h");
      tracked.push({ el: h, kind: "heading" });
    });
    document.querySelectorAll("main .section > .container").forEach((c) => {
      const rule = document.createElement("span");
      rule.className = "bld-rule"; rule.setAttribute("aria-hidden", "true");
      c.before(rule); // sibling, so grid containers (About) keep their columns
      tracked.push({ el: rule, kind: "rule" });
    });
    document.querySelectorAll(".tl-item").forEach((el) => tracked.push({ el, kind: "dot" }));
    document.querySelectorAll(".timeline").forEach((el) => tracked.push({ el, kind: "timeline" }));
  }

  // Page spine: dashed track + gradient ink drawn by overall scroll progress, one node per section.
  const main = document.getElementById("main");
  let spine = null, spineInk = null;
  if (build) {
    const NS = "http://www.w3.org/2000/svg";
    spine = document.createElementNS(NS, "svg");
    spine.setAttribute("class", "spine");
    spine.setAttribute("aria-hidden", "true");
    spine.innerHTML = '<path class="spine-track"/>';
    // The ink is a plain element scaled with transform: cheap to update every frame,
    // unlike stroke-dashoffset on a page-tall SVG, which repaints it.
    spineInk = document.createElement("div");
    spineInk.className = "spine-ink-bar";
    spineInk.setAttribute("aria-hidden", "true");
    main.prepend(spine, spineInk);
  }
  let spineNodes = [];
  // Geometry that only changes on resize/load/filter, cached so the scroll path never forces layout.
  const geo = { maxScroll: 1, mainTop: 0 };
  const layoutSpine = () => {
    geo.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    geo.mainTop = main.offsetTop;
    if (!spine) return;
    const h = main.offsetHeight;
    const top = Math.round(window.innerHeight * 0.9), bottom = h - 40;
    spine.setAttribute("viewBox", `0 0 24 ${h}`);
    spine.querySelector(".spine-track").setAttribute("d", `M12 ${top} V${bottom}`);
    spineInk.style.top = `${top}px`;
    spineInk.style.height = `${Math.max(0, bottom - top)}px`;
    spineNodes.forEach((n) => n.c.remove());
    spineNodes = [...main.querySelectorAll(".section")].map((sec) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const y = sec.offsetTop + 90;
      c.setAttribute("cx", "12"); c.setAttribute("cy", String(y)); c.setAttribute("r", "5");
      spine.appendChild(c);
      return { c, y, on: false };
    });
  };

  const values = new WeakMap();
  const set = (el, prop, v) => {
    const prev = values.get(el) || {};
    if (prev[prop] !== undefined && Math.abs(prev[prop] - v) < 0.002) return;
    prev[prop] = v; values.set(el, prev);
    el.style.setProperty(prop, v.toFixed(3));
  };
  const progress = (kind, r, vh) => {
    if (kind === "timeline") return clamp01((vh * 0.75 - r.top) / Math.max(r.height, 1));
    if (kind === "heading") return clamp01((vh * 0.92 - r.top) / (vh * 0.3));
    return clamp01((vh * 0.98 - r.top) / (vh * 0.5));
  };
  const apply = (t, r, vh) => set(t.el, t.kind === "timeline" ? "--tp" : "--p", progress(t.kind, r, vh));

  // Only elements near the viewport are measured each frame; IntersectionObserver keeps that set.
  const active = new Set();
  const byEl = new Map(tracked.map((t) => [t.el, t]));
  let vhCache = window.innerHeight;

  let buildQueued = false;
  const updateBuild = () => {
    buildQueued = false;
    const vh = vhCache;
    const list = [...active];
    // Read every rect first, then write, so the frame does a single layout pass.
    const rects = list.map((t) => t.el.getBoundingClientRect());
    list.forEach((t, k) => apply(t, rects[k], vh));
    const y = window.scrollY;
    if (spineInk) {
      spineInk.style.setProperty("--sp", clamp01(y / geo.maxScroll).toFixed(4));
      const mark = y - geo.mainTop + vh * 0.6;
      spineNodes.forEach((n) => {
        const on = mark > n.y;
        if (on !== n.on) { n.on = on; n.c.classList.toggle("is-on", on); }
      });
    }
  };
  const queueBuild = () => { if (!buildQueued) { buildQueued = true; requestAnimationFrame(updateBuild); } };
  const fullUpdate = () => {
    vhCache = window.innerHeight;
    const rects = tracked.map((t) => t.el.getBoundingClientRect());
    tracked.forEach((t, k) => apply(t, rects[k], vhCache));
    queueBuild();
  };
  if (build) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const t = byEl.get(e.target);
        if (e.isIntersecting) active.add(t);
        else { active.delete(t); apply(t, e.boundingClientRect, vhCache); } // settle on exit
      });
      queueBuild();
    }, { rootMargin: "25% 0px 25% 0px" });
    tracked.forEach((t) => io.observe(t.el));
    layoutSpine();
    fullUpdate();
    // After scrolling stops, settle everything once (covers cards skipped by Home/End jumps).
    let settleTimer = 0;
    window.addEventListener("scroll", () => {
      queueBuild();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(fullUpdate, 180);
    }, { passive: true });
    window.addEventListener("resize", () => { layoutSpine(); fullUpdate(); }, { passive: true });
    window.addEventListener("load", () => { layoutSpine(); fullUpdate(); });
    // Late fonts/images change the page height; refresh the cached geometry once per frame at most.
    if ("ResizeObserver" in window) {
      let relayoutQueued = false;
      new ResizeObserver(() => {
        if (relayoutQueued) return;
        relayoutQueued = true;
        requestAnimationFrame(() => { relayoutQueued = false; layoutSpine(); fullUpdate(); });
      }).observe(main);
    }
  }

  // Infinite decorative animations (hero glow, marquee) pause while off-screen.
  if ("IntersectionObserver" in window) {
    const idle = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting));
    });
    document.querySelectorAll(".hero, .marquee").forEach((el) => idle.observe(el));
  }

  // Remaining reveal elements (paragraphs, filters, links) keep the one-shot fade/slide.
  document.querySelectorAll(".socials li").forEach((el) => {
    const i = [...el.parentElement.children].indexOf(el);
    el.classList.add("reveal", "reveal-child");
    el.style.setProperty("--d", `${(0.1 + i * 0.1).toFixed(2)}s`);
  });
  if (!build) {
    [[".pillar li", 0.25, 0.06], [".tl-card li", 0.2, 0.06], [".chips li", 0.15, 0.035], [".stats li", 0.1, 0.1]]
      .forEach(([selector, base, step]) => {
        document.querySelectorAll(selector).forEach((el) => {
          const i = [...el.parentElement.children].indexOf(el);
          el.classList.add("reveal", "reveal-child");
          el.style.setProperty("--d", `${(base + Math.min(i, 12) * step).toFixed(3)}s`);
        });
      });
  }

  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el) => {
    if (el.classList.contains("reveal-child")) return;
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", `${Math.min(i, 6) * 0.08}s`);
  });
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (!reduceMotion) {
    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const target = Number(el.dataset.count);
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / 1200, 1);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(step);
        };
        el.textContent = "0";
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => countObserver.observe(c));
  }

  /* ---------- Pillar spotlight follows the pointer ---------- */
  document.querySelectorAll(".pillar").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Project filters ---------- */
  const filters = document.querySelectorAll(".filter");
  const projects = document.querySelectorAll(".project");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      requestAnimationFrame(() => { layoutSpine(); if (build) fullUpdate(); });
      projects.forEach((p, i) => {
        const show = f === "all" || p.dataset.tags.split(" ").includes(f);
        p.classList.toggle("is-hidden", !show);
        if (show && !reduceMotion) {
          p.animate(
            [{ opacity: 0, transform: "translateY(16px) scale(.98)" }, { opacity: 1, transform: "none" }],
            { duration: 500, delay: (i % 6) * 40, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }
          );
        }
      });
    });
  });

  /* ---------- Rotating headline word ---------- */
  const word = document.querySelector(".rotator-word");
  if (word && !reduceMotion) {
    const words = JSON.parse(word.dataset.words);
    let w = 0;
    setInterval(() => {
      word.classList.add("is-out");
      setTimeout(() => {
        w = (w + 1) % words.length;
        word.textContent = words[w];
        word.classList.remove("is-out");
      }, 350);
    }, 2600);
  }

  /* ---------- Terminal typing animation ---------- */
  const term = document.getElementById("term");
  const script = [
    ["cmd", "git push origin main"],
    ["out", "<span class='m'>→ CI pipeline triggered (GitHub Actions)</span>"],
    ["out", "  <span class='ok'>✓</span> lint        <span class='ok'>✓</span> unit tests   <span class='ok'>✓</span> build"],
    ["cmd", "docker build -t app:latest ."],
    ["out", "<span class='m'>  [+] Building</span> <span class='y'>18.4s</span> <span class='m'>(12/12)</span> <span class='ok'>FINISHED</span>"],
    ["cmd", "docker stack deploy -c stack.yml app"],
    ["out", "  Updating service <span class='v'>app_api</span>   replicas <span class='c'>3/3</span>"],
    ["out", "  Updating service <span class='v'>app_web</span>   replicas <span class='c'>2/2</span>"],
    ["out", "  <span class='o'>⚠</span> <span class='m'>rolling update, 1 task at a time</span>"],
    ["cmd", "curl -sI https://app.example.dev | head -1"],
    ["out", "  HTTP/2 <span class='ok'>200</span>  <span class='m'># via Caddy, TLS ✓</span>"],
    ["cmd", "ollama run llama3 \"summarize deploy\""],
    ["out", "  <span class='v'>Deployed 5 replicas, zero downtime.</span> 🚀"],
  ];
  const render = (lines) => lines.map(([kind, text]) =>
    kind === "cmd" ? `<span class='p'>❯</span> <span class='c'>${text}</span>` : text
  ).join("\n");

  if (term) {
    if (reduceMotion) {
      term.innerHTML = render(script);
    } else {
      let shown = [];
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const run = async () => {
        for (;;) {
          shown = [];
          term.innerHTML = "";
          for (const [kind, text] of script) {
            if (kind === "cmd") {
              const prev = render(shown);
              for (let i = 1; i <= text.length; i++) {
                term.innerHTML = (prev ? prev + "\n" : "") + `<span class='p'>❯</span> <span class='c'>${text.slice(0, i)}</span>`;
                await sleep(28 + Math.random() * 45);
              }
              shown.push([kind, text]);
              await sleep(350);
            } else {
              shown.push([kind, text]);
              term.innerHTML = render(shown);
              await sleep(260);
            }
          }
          await sleep(4200);
        }
      };
      run();
    }
  }

  /* ---------- Hero network canvas ---------- */
  const canvas = document.getElementById("net");
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  const lowPower = root.classList.contains("gecko") || (navigator.hardwareConcurrency || 8) <= 4;
  // Particle colors come from the active theme (--particles: "r,g,b|r,g,b|...").
  let colors = [];
  const readColors = () => {
    colors = getComputedStyle(root).getPropertyValue("--particles").replace(/"/g, "").trim().split("|").filter(Boolean);
    if (!colors.length) colors = ["122,162,247", "125,207,255", "187,154,247", "158,206,106"];
  };
  readColors();
  window.addEventListener("themechange", readColors);
  let w, h, dpr, nodes = [], packets = [], running = true, raf;
  const pointer = { x: -9999, y: -9999 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cap = lowPower ? 50 : 90;
    const count = Math.round(Math.min(cap, Math.max(24, (w * h) / (lowPower ? 26000 : 16000))));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8, k: (Math.random() * 4) | 0,
    }));
    packets = [];
  };

  const LINK = lowPower ? 120 : 140;
  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      const dx = n.x - pointer.x, dy = n.y - pointer.y, d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120) { const f = 0.6 / Math.sqrt(d2 + 1); n.x += dx * f; n.y += dy * f; }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${colors[a.k % colors.length]},${(1 - d / LINK) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (packets.length < 14 && Math.random() < 0.0006) packets.push({ a, b, t: 0, k: a.k });
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${colors[n.k % colors.length]},0.85)`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    packets = packets.filter((p) => {
      p.t += 0.02;
      if (p.t >= 1 || Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y) > LINK) return false;
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      const pc = colors[p.k % colors.length];
      // soft halo drawn as a faint disc: shadowBlur is very expensive per frame
      ctx.fillStyle = `rgba(${pc},0.18)`;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${pc},1)`;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      return true;
    });
    if (running) raf = requestAnimationFrame(frame);
  };

  resize();
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
  canvas.parentElement.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });

  // Pause when the hero is off-screen or the tab is hidden.
  let inView = true;
  const sync = () => {
    const should = inView && !document.hidden;
    if (should && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(canvas);
  // Skip canvas drawing while the page is actively scrolling, so scroll frames stay cheap.
  let scrollIdle = 0;
  window.addEventListener("scroll", () => {
    if (running) { running = false; cancelAnimationFrame(raf); }
    clearTimeout(scrollIdle);
    scrollIdle = setTimeout(sync, 140);
  }, { passive: true });
  document.addEventListener("visibilitychange", sync);
  raf = requestAnimationFrame(frame);
})();
