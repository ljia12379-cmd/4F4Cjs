/* ============================================================================
   LJC 云服务器 · 站点脚本
   零依赖。功能：复制服务器地址、实时状态、移动端导航、FAQ 手风琴、滚动淡入
   ========================================================================== */
(function () {
  "use strict";

  /* ── 站点配置：改这里即可全局生效 ─────────────────────────────────────── */
  var SITE = {
    ip: "mc.ljcyun.xyz",
    port: "20058",
    qqGroup: "1064599211",
    // 服务器状态查询（第三方公开接口，失败时静默降级）
    statusApi: "https://api.mcsrvstat.us/3/mc.ljcyun.xyz:20058",
    statusInterval: 60000,
  };
  window.LJC_SITE = SITE;

  var ADDRESS = SITE.ip + ":" + SITE.port;

  /* ── 工具 ─────────────────────────────────────────────────────────────── */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ── Toast ────────────────────────────────────────────────────────────── */
  var toastHost = null;
  function toast(message, ok) {
    if (!toastHost) {
      toastHost = document.createElement("div");
      toastHost.className = "toast-host";
      toastHost.setAttribute("role", "status");
      toastHost.setAttribute("aria-live", "polite");
      document.body.appendChild(toastHost);
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      (ok === false
        ? '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 5v4M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.5"/></svg>'
        : '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>') +
      "<span></span>";
    // 文本节点写入，避免 HTML 注入
    el.lastChild.textContent = message;
    toastHost.appendChild(el);
    setTimeout(function () {
      el.setAttribute("data-leaving", "true");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }, 2200);
  }

  /* ── 复制文本（带降级） ───────────────────────────────────────────────── */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function bindCopy() {
    $$("[data-copy]").forEach(function (btn) {
      if (btn.dataset.copyBound === "1") return;
      btn.dataset.copyBound = "1";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var value = btn.getAttribute("data-copy") || ADDRESS;
        copyText(value).then(
          function () {
            toast("已复制 " + value);
            var label = btn.getAttribute("data-copy-label");
            if (label) {
              var span = btn.querySelector("span");
              var original = span ? span.textContent : null;
              if (span && original !== null) {
                span.textContent = label;
                setTimeout(function () {
                  span.textContent = original;
                }, 1800);
              }
            }
          },
          function () {
            toast("复制失败，请手动选中地址", false);
          }
        );
      });
    });
  }

  /* ── 实时服务器状态 ───────────────────────────────────────────────────── */
  function renderStatus(data) {
    var stateEl = $("[data-status-state]");
    var playersEl = $("[data-status-players]");
    var versionEl = $("[data-status-version]");
    var motdEl = $("[data-status-motd]");

    var online = !!(data && data.online);
    if (stateEl) {
      stateEl.innerHTML = "";
      var dot = document.createElement("i");
      dot.className = "dot " + (online ? "dot--online" : "dot--offline");
      var txt = document.createElement("span");
      txt.textContent = online ? "在线" : "离线";
      stateEl.appendChild(dot);
      stateEl.appendChild(txt);
    }
    if (playersEl && data && data.players) {
      playersEl.innerHTML = "";
      playersEl.appendChild(document.createTextNode(String(data.players.online || 0)));
      var small = document.createElement("small");
      small.textContent = "/ " + (data.players.max || "?") + " 人";
      playersEl.appendChild(small);
    } else if (playersEl) {
      playersEl.textContent = "—";
    }
    if (versionEl) {
      versionEl.textContent = online && data.version ? data.version : "1.20.1 · Forge";
    }
    if (motdEl && online && data.motd && data.motd.clean && data.motd.clean.length) {
      motdEl.textContent = data.motd.clean.join(" ").trim();
    }
  }

  function pollStatus() {
    if (!document.querySelector("[data-status-state]")) return;
    if (!window.fetch) return;
    var controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, 7000);

    fetch(SITE.statusApi, { signal: controller ? controller.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error("bad status " + r.status);
        return r.json();
      })
      .then(function (json) {
        clearTimeout(timer);
        renderStatus(json);
      })
      .catch(function () {
        clearTimeout(timer);
        var stateEl = $("[data-status-state]");
        if (stateEl && !stateEl.dataset.resolved) {
          stateEl.innerHTML =
            '<i class="dot dot--offline"></i><span>未知</span>';
        }
      })
      .then(function () {
        var stateEl = $("[data-status-state]");
        if (stateEl) stateEl.dataset.resolved = "1";
      });
  }

  /* ── 导航 ─────────────────────────────────────────────────────────────── */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var panel = $("[data-nav-panel]");

    // 当前页高亮
    var here = location.pathname.split("/").pop() || "index.html";
    $$("[data-nav-link]").forEach(function (a) {
      var target = a.getAttribute("href");
      if (target === here || (here === "" && target === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
    });

    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = panel.getAttribute("data-open") === "true";
        panel.setAttribute("data-open", open ? "false" : "true");
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && panel.getAttribute("data-open") === "true") {
          panel.setAttribute("data-open", "false");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }
  }

  /* ── FAQ：同时只展开一项 ──────────────────────────────────────────────── */
  function initFaq() {
    var items = $$(".faq__item");
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item && other.open) other.open = false;
        });
      });
    });
  }

  /* ── 滚动淡入 ─────────────────────────────────────────────────────────── */
  function initReveal() {
    var nodes = $$("[data-reveal]");
    if (!nodes.length) return;
    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) {
        n.classList.add("is-in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          setTimeout(function () {
            el.classList.add("is-in");
          }, delay);
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  /* ── 页脚年份 ─────────────────────────────────────────────────────────── */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ── 主题：默认深色，可切换并记忆 ─────────────────────────────────────── */
  var THEME_KEY = "ljc-theme";
  var ICON_SUN =
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.6M12 18.8v2.6M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2.6 12h2.6M18.8 12h2.6M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9"/></svg>';
  var ICON_MOON =
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"/></svg>';

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        /* 隐私模式下忽略 */
      }
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
    $$("[data-theme-toggle]").forEach(function (btn) {
      var label = theme === "dark" ? "切换到浅色主题" : "切换到深色主题";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function initTheme() {
    var hosts = [
      $(".nav__inner > .nav__actions"),
      $(".nav__mobile .nav__actions"),
    ];
    var buttons = [];
    hosts.forEach(function (host) {
      if (!host) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-toggle";
      btn.setAttribute("data-theme-toggle", "");
      btn.innerHTML = ICON_SUN + ICON_MOON;
      host.appendChild(btn);
      btn.addEventListener("click", function () {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
      buttons.push(btn);
    });
    applyTheme(currentTheme(), false);
  }

  /* ── 启动 ─────────────────────────────────────────────────────────────── */
  function boot() {
    initNav();
    initTheme();
    bindCopy();
    initFaq();
    initReveal();
    initYear();
    pollStatus();
    setInterval(function () {
      if (!document.hidden) pollStatus();
    }, SITE.statusInterval);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) pollStatus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
