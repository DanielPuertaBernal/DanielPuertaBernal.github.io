(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Nav: scrolled state, progress bar, current section ---------- */
  const nav = document.querySelector(".nav");
  const bar = document.querySelector(".progress span");
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("is-scrolled", y > 24);
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
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

  /* ---------- Scroll reveal (staggered per group) ---------- */
  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el) => {
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
    ["out", "<span class='m'>  [+] Building 18.4s (12/12) FINISHED</span>"],
    ["cmd", "docker stack deploy -c stack.yml app"],
    ["out", "  Updating service <span class='v'>app_api</span>   replicas <span class='c'>3/3</span>"],
    ["out", "  Updating service <span class='v'>app_web</span>   replicas <span class='c'>2/2</span>"],
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
  const ctx = canvas.getContext("2d");
  const colors = ["167,139,250", "34,211,238", "74,222,128"];
  let w, h, dpr, nodes = [], packets = [], running = true, raf;
  const pointer = { x: -9999, y: -9999 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, Math.max(30, (w * h) / 16000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8, c: colors[(Math.random() * 3) | 0],
    }));
    packets = [];
  };

  const LINK = 140;
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
          ctx.strokeStyle = `rgba(${a.c},${(1 - d / LINK) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (packets.length < 14 && Math.random() < 0.0006) packets.push({ a, b, t: 0, c: a.c });
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${n.c},0.85)`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    packets = packets.filter((p) => {
      p.t += 0.02;
      if (p.t >= 1 || Math.hypot(p.a.x - p.b.x, p.a.y - p.b.y) > LINK) return false;
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.fillStyle = `rgba(${p.c},1)`;
      ctx.shadowColor = `rgba(${p.c},1)`; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
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
  document.addEventListener("visibilitychange", sync);
  raf = requestAnimationFrame(frame);
})();
