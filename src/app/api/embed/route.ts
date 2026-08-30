import { NextResponse } from "next/server";

// The loader a merchant pastes onto their own site. Served from /embed.js
// via a rewrite in next.config.ts.
//
// It is deliberately dependency-free, plain ES5-ish JS and renders into a
// shadow root so that no stylesheet on the host page can reach in and break
// the popup (and nothing we inject can leak out and break their site).
//
// Public API once loaded:
//   window.MagicOffer.open()   — force the popup open
//   window.MagicOffer.close()
//   window.MagicOffer.reset()  — clear frequency capping, for testing
const SCRIPT = String.raw`(function () {
  "use strict";

  if (window.MagicOffer && window.MagicOffer.__loaded) return;

  var currentScript =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && all[i].src.indexOf("/embed.js") !== -1) return all[i];
      }
      return null;
    })();

  if (!currentScript) return;

  var slug = currentScript.getAttribute("data-magic-offer");
  var offerId = currentScript.getAttribute("data-offer-id") || "";
  if (!slug) {
    console.warn("[MagicOffer] Missing data-magic-offer attribute on the embed script.");
    return;
  }

  var origin = (function () {
    try {
      return new URL(currentScript.src).origin;
    } catch (e) {
      return "";
    }
  })();

  // data-preview=1 makes every trigger fire regardless of the frequency cap.
  // The admin preview page sets it; real installs never should.
  var previewMode = currentScript.getAttribute("data-preview") === "1";

  var STORAGE_KEY = "magic-offer:" + slug + ":" + (offerId || "default");
  var state = {
    config: null,
    offer: null,
    opened: false,
    armed: false,
    host: null,
    root: null,
    modal: null,
    fomoWrap: null,
    timers: [],
  };

  /* ---------------------------------------------------------------- utils */

  function later(fn, ms) {
    var t = setTimeout(fn, ms);
    state.timers.push(t);
    return t;
  }

  function on(target, type, handler, opts) {
    target.addEventListener(type, handler, opts || false);
  }

  function readSeen() {
    try {
      var session = sessionStorage.getItem(STORAGE_KEY);
      var local = localStorage.getItem(STORAGE_KEY);
      return { session: session, local: local };
    } catch (e) {
      return { session: null, local: null };
    }
  }

  function writeSeen() {
    var stamp = String(Date.now());
    try {
      sessionStorage.setItem(STORAGE_KEY, stamp);
      localStorage.setItem(STORAGE_KEY, stamp);
    } catch (e) {
      /* private mode — the popup just falls back to once-per-pageload */
    }
  }

  function sameDay(a, b) {
    var d1 = new Date(a);
    var d2 = new Date(b);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Whether the frequency cap still allows a popup right now.
  function mayShow() {
    if (previewMode) return true;
    var freq = state.config.frequency;
    if (freq === "always") return true;
    var seen = readSeen();
    if (freq === "once") return !seen.local;
    if (freq === "session") return !seen.session;
    if (freq === "daily") {
      if (!seen.local) return true;
      var when = parseInt(seen.local, 10);
      return !isFinite(when) || !sameDay(when, Date.now());
    }
    return true;
  }

  function isMobile() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------- shadow UI */

  var STYLES = [
    ":host { all: initial; }",
    ".mgo-overlay {",
    "  position: fixed; inset: 0; z-index: 2147483000;",
    "  display: flex; align-items: center; justify-content: center;",
    "  padding: 16px; box-sizing: border-box;",
    "  background: rgba(6, 8, 12, var(--mgo-overlay, 0.7));",
    "  opacity: 0; transition: opacity 220ms ease;",
    "  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
    "}",
    ".mgo-overlay.mgo-open { opacity: 1; }",
    ".mgo-modal {",
    "  position: relative; width: 100%; max-width: var(--mgo-w, 460px);",
    "  height: var(--mgo-h, 640px); max-height: calc(100vh - 32px);",
    "  border-radius: var(--mgo-r, 20px); overflow: hidden; background: #0b0d12;",
    "  box-shadow: 0 30px 80px rgba(0,0,0,0.55); transform: translateY(18px) scale(0.97);",
    "  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);",
    "}",
    ".mgo-overlay.mgo-open .mgo-modal { transform: translateY(0) scale(1); }",
    ".mgo-frame { width: 100%; height: 100%; border: 0; display: block; background: #0b0d12; }",
    ".mgo-close {",
    "  position: absolute; top: 10px; right: 10px; width: 34px; height: 34px;",
    "  border-radius: 999px; border: 0; cursor: pointer; z-index: 2;",
    "  background: rgba(0,0,0,0.45); color: #fff; font-size: 19px; line-height: 34px;",
    "  backdrop-filter: blur(6px); transition: background 150ms ease;",
    "}",
    ".mgo-close:hover { background: rgba(0,0,0,0.75); }",
    ".mgo-launcher {",
    "  position: fixed; bottom: 20px; z-index: 2147482000; border: 0; cursor: pointer;",
    "  padding: 12px 20px; border-radius: 999px; color: #fff; font-weight: 700;",
    "  font-size: 14px; font-family: inherit; box-shadow: 0 10px 30px rgba(0,0,0,0.28);",
    "  transition: transform 150ms ease;",
    "}",
    ".mgo-launcher:hover { transform: translateY(-2px); }",
    ".mgo-launcher.mgo-right { right: 20px; }",
    ".mgo-launcher.mgo-left { left: 20px; }",
    ".mgo-fomo {",
    "  position: fixed; z-index: 2147481000; display: flex; flex-direction: column;",
    "  gap: 10px; pointer-events: none; max-width: min(340px, calc(100vw - 32px));",
    "  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;",
    "}",
    ".mgo-fomo.mgo-bottom-left { bottom: 20px; left: 20px; align-items: flex-start; }",
    ".mgo-fomo.mgo-bottom-right { bottom: 20px; right: 20px; align-items: flex-end; }",
    ".mgo-fomo.mgo-top-left { top: 20px; left: 20px; align-items: flex-start; }",
    ".mgo-fomo.mgo-top-right { top: 20px; right: 20px; align-items: flex-end; }",
    ".mgo-toast {",
    "  pointer-events: auto; display: flex; align-items: center; gap: 12px;",
    "  padding: 11px 15px 11px 12px; border-radius: 14px; font-size: 13.5px;",
    "  line-height: 1.35; box-shadow: 0 12px 34px rgba(0,0,0,0.18);",
    "  background: #fff; color: #10141c; border: 1px solid rgba(0,0,0,0.07);",
    "  opacity: 0; transform: translateY(12px); transition: opacity 300ms ease, transform 300ms ease;",
    "}",
    ".mgo-toast.mgo-dark { background: #161a22; color: #f1f4f9; border-color: rgba(255,255,255,0.1); }",
    ".mgo-toast.mgo-in { opacity: 1; transform: translateY(0); }",
    ".mgo-toast-icon { font-size: 20px; flex: none; }",
    ".mgo-toast-text { flex: 1; }",
    ".mgo-toast-x {",
    "  flex: none; border: 0; background: transparent; cursor: pointer; font-size: 15px;",
    "  opacity: 0.4; color: inherit; padding: 0 2px;",
    "}",
    ".mgo-toast-x:hover { opacity: 0.9; }",
    "@media (max-width: 640px) {",
    "  .mgo-modal { height: calc(100vh - 32px); }",
    "  .mgo-fomo { left: 16px; right: 16px; max-width: none; align-items: stretch; }",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  .mgo-overlay, .mgo-modal, .mgo-toast { transition: none; }",
    "}",
  ].join("\n");

  function ensureRoot() {
    if (state.root) return state.root;
    var host = document.createElement("div");
    host.setAttribute("data-magic-offer-root", "");
    host.style.cssText = "all:initial;position:static;";
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var style = document.createElement("style");
    style.textContent = STYLES;
    root.appendChild(style);
    state.host = host;
    state.root = root;
    return root;
  }

  /* ---------------------------------------------------------------- modal */

  function openPopup(source) {
    if (state.opened || !state.offer) return;
    state.opened = true;
    writeSeen();

    var root = ensureRoot();
    var m = state.config.modal;

    var overlay = document.createElement("div");
    overlay.className = "mgo-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", state.offer.title || "Special offer");
    overlay.style.setProperty("--mgo-overlay", String(m.overlayOpacity / 100));
    overlay.style.setProperty("--mgo-w", m.width + "px");
    overlay.style.setProperty("--mgo-h", m.height + "px");
    overlay.style.setProperty("--mgo-r", m.radius + "px");

    var modal = document.createElement("div");
    modal.className = "mgo-modal";

    var close = document.createElement("button");
    close.className = "mgo-close";
    close.type = "button";
    close.setAttribute("aria-label", "Close offer");
    close.innerHTML = "&times;";
    on(close, "click", function () {
      closePopup();
    });

    var frame = document.createElement("iframe");
    frame.className = "mgo-frame";
    frame.setAttribute("title", state.offer.title || "Special offer");
    frame.setAttribute("allow", "clipboard-write");
    frame.src = state.offer.url + "&src=" + encodeURIComponent(source || "embed");

    modal.appendChild(close);
    modal.appendChild(frame);
    overlay.appendChild(modal);
    root.appendChild(overlay);

    if (m.closeOnOverlayClick) {
      on(overlay, "click", function (e) {
        if (e.target === overlay) closePopup();
      });
    }

    // Force a reflow so the opening transition actually runs.
    void overlay.offsetHeight;
    overlay.classList.add("mgo-open");

    state.modal = overlay;
    state.scrollLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    later(function () {
      close.focus();
    }, 260);

    emit("open", { source: source || "embed" });
  }

  function closePopup() {
    if (!state.modal) return;
    var overlay = state.modal;
    state.modal = null;
    state.opened = false;
    overlay.classList.remove("mgo-open");
    document.body.style.overflow = state.scrollLock || "";
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 240);
    emit("close", {});
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("magicoffer:" + name, { detail: detail || {} })
      );
    } catch (e) {
      /* older browsers — the popup still works, the event just does not fire */
    }
  }

  /* ------------------------------------------------------------- launcher */

  function mountLauncher() {
    var cfg = state.config.launcher;
    if (!cfg.enabled) return;
    var root = ensureRoot();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "mgo-launcher " + (cfg.position === "bottom-left" ? "mgo-left" : "mgo-right");
    btn.style.background = cfg.color;
    btn.textContent = cfg.text;
    on(btn, "click", function () {
      openPopup("launcher");
    });
    root.appendChild(btn);
  }

  /* ----------------------------------------------------------- fomo toasts */

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatDuration(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var days = Math.floor(total / 86400);
    var hours = Math.floor((total % 86400) / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    var clock = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
    return days > 0 ? days + "d " + clock : clock;
  }

  function renderItemText(item) {
    if (item.type === "countdown" && item.countdownEndsAt) {
      var remaining = item.countdownEndsAt - Date.now();
      return (item.template || "{time}").replace(
        /\{time\}/g,
        formatDuration(remaining)
      );
    }
    return item.text;
  }

  function startFomo(feed) {
    if (!feed || !feed.enabled || !feed.items.length) return;
    if (!feed.showOnMobile && isMobile()) return;

    var root = ensureRoot();
    var wrap = document.createElement("div");
    wrap.className = "mgo-fomo mgo-" + feed.position;
    wrap.setAttribute("aria-live", "polite");
    root.appendChild(wrap);
    state.fomoWrap = wrap;

    var dark =
      feed.theme === "dark" ||
      (feed.theme === "auto" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    var index = 0;
    var stopped = false;

    on(document, "magicoffer:fomo-stop", function () {
      stopped = true;
    });

    function showNext() {
      if (stopped) return;
      if (index >= feed.items.length) {
        if (!feed.loop) return;
        index = 0;
      }
      var item = feed.items[index++];

      var toast = document.createElement("div");
      toast.className = "mgo-toast" + (dark ? " mgo-dark" : "");

      var icon = document.createElement("span");
      icon.className = "mgo-toast-icon";
      icon.textContent = item.icon;

      var text = document.createElement("span");
      text.className = "mgo-toast-text";
      text.innerHTML = escapeHtml(renderItemText(item));

      var dismiss = document.createElement("button");
      dismiss.className = "mgo-toast-x";
      dismiss.type = "button";
      dismiss.setAttribute("aria-label", "Dismiss");
      dismiss.innerHTML = "&times;";

      toast.appendChild(icon);
      toast.appendChild(text);
      toast.appendChild(dismiss);
      wrap.appendChild(toast);

      void toast.offsetHeight;
      toast.classList.add("mgo-in");

      // The countdown is the one type that has to keep ticking while it is
      // on screen; everything else is rendered once.
      var tick = null;
      if (item.type === "countdown" && item.countdownEndsAt) {
        tick = setInterval(function () {
          text.innerHTML = escapeHtml(renderItemText(item));
        }, 1000);
      }

      function remove(permanent) {
        if (tick) clearInterval(tick);
        toast.classList.remove("mgo-in");
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 320);
        if (permanent) stopped = true;
      }

      on(dismiss, "click", function () {
        remove(true);
      });

      later(function () {
        remove(false);
        later(showNext, feed.gapMs);
      }, feed.displayMs);
    }

    later(showNext, feed.initialDelayMs);
  }

  /* -------------------------------------------------------------- triggers */

  function armTriggers() {
    var t = state.config.triggers;

    function fire(source) {
      if (state.opened || !state.armed) return;
      if (!mayShow()) return;
      openPopup(source);
    }

    // Desktop exit intent: the pointer leaves through the top edge of the
    // viewport, which is where the address bar, tabs and close button are.
    if (t.exitIntent) {
      on(document, "mouseout", function (e) {
        if (e.relatedTarget || e.toElement) return;
        if (e.clientY > t.exitSensitivity) return;
        fire("exit-intent");
      });
      // Leaving toward another window/app entirely.
      on(document, "mouseleave", function (e) {
        if (e.clientY <= t.exitSensitivity) fire("exit-intent");
      });
    }

    // Mobile has no pointer to lose, so a decisive upward flick near the top
    // of the page stands in for "about to leave".
    if (t.mobileScrollUp) {
      var lastY = window.pageYOffset;
      var lastT = Date.now();
      on(
        window,
        "scroll",
        function () {
          if (!isMobile()) return;
          var y = window.pageYOffset;
          var now = Date.now();
          var dy = lastY - y;
          var dt = now - lastT || 1;
          var velocity = dy / dt;
          lastY = y;
          lastT = now;
          if (velocity > 1.1 && y < 260) fire("mobile-scroll-up");
        },
        { passive: true }
      );
    }

    // Back-button intent: push one history entry, and catch the pop.
    if (t.mobileBackButton) {
      try {
        history.pushState({ magicOffer: true }, "", location.href);
        on(window, "popstate", function () {
          fire("back-button");
        });
      } catch (e) {
        /* sandboxed iframes can block history writes */
      }
    }

    if (t.inactivitySeconds > 0) {
      var idle = null;
      var resetIdle = function () {
        if (idle) clearTimeout(idle);
        idle = setTimeout(function () {
          fire("inactivity");
        }, t.inactivitySeconds * 1000);
      };
      ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach(function (evt) {
        on(document, evt, resetIdle, { passive: true });
      });
      resetIdle();
    }

    if (t.timeOnPageSeconds > 0) {
      later(function () {
        fire("time-on-page");
      }, t.timeOnPageSeconds * 1000);
    }

    if (t.scrollPercent > 0) {
      on(
        window,
        "scroll",
        function () {
          var doc = document.documentElement;
          var scrollable = doc.scrollHeight - window.innerHeight;
          if (scrollable <= 0) return;
          var pct = (window.pageYOffset / scrollable) * 100;
          if (pct >= t.scrollPercent) fire("scroll-depth");
        },
        { passive: true }
      );
    }

    if (t.clickSelector) {
      on(document, "click", function (e) {
        var node = e.target;
        while (node && node !== document) {
          if (node.matches && node.matches(t.clickSelector)) {
            e.preventDefault();
            fire("click");
            return;
          }
          node = node.parentNode;
        }
      });
    }

    // The grace period stops the popup firing at a pointer that happens to
    // already be resting near the top of the window when the page loads.
    later(function () {
      state.armed = true;
    }, state.config.armAfterSeconds * 1000);
  }

  /* ------------------------------------------------------------------ boot */

  function boot() {
    var url =
      origin + "/api/w/" + encodeURIComponent(slug) + "/embed-config" +
      (offerId ? "?o=" + encodeURIComponent(offerId) : "");

    fetch(url, { credentials: "omit" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.enabled) return;

        // A domain allow-list, when set, keeps the snippet from working if
        // it is copied onto a site the merchant did not authorize.
        var allowed = data.config.allowedDomains || [];
        if (allowed.length) {
          var host = location.hostname.toLowerCase();
          var ok = allowed.some(function (d) {
            return host === d || host.indexOf("." + d) === host.length - d.length - 1;
          });
          if (!ok) {
            console.warn("[MagicOffer] " + host + " is not in this offer's allowed domains.");
            return;
          }
        }

        state.config = data.config;
        state.offer = data.offer;

        if (document.body) ready();
        else on(document, "DOMContentLoaded", ready);
      })
      .catch(function (err) {
        console.warn("[MagicOffer] Could not load embed config:", err);
      });
  }

  function ready() {
    mountLauncher();
    armTriggers();

    if (state.config.showFomo && state.offer.fomoUrl) {
      fetch(state.offer.fomoUrl, { credentials: "omit" })
        .then(function (res) {
          return res.json();
        })
        .then(startFomo)
        .catch(function () {
          /* social proof is decorative — never block the popup on it */
        });
    }
  }

  // The landing page posts back when the visitor closes it or completes a
  // registration, so the popup can get out of the way at the right moment.
  on(window, "message", function (e) {
    if (origin && e.origin !== origin) return;
    var data = e.data;
    if (!data || data.source !== "magic-offer") return;
    if (data.type === "close") closePopup();
    if (data.type === "registered") {
      writeSeen();
      emit("registered", data.payload || {});
    }
  });

  window.MagicOffer = {
    __loaded: true,
    open: function () {
      state.armed = true;
      openPopup("api");
    },
    close: closePopup,
    reset: function () {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* nothing to clear */
      }
    },
    config: function () {
      return state.config;
    },
  };

  boot();
})();
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
