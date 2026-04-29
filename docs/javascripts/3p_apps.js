/**
 * Third-party apps: groups by type (types[]), single-select platform filter, /assets/3p.json
 */
document.addEventListener("DOMContentLoaded", function () {
  const root = document.getElementById("tpa-root");
  if (!root) return;

  const langs = ["en", "zh", "ru", "fa"];
  const raw = document.documentElement.lang || "en";
  const lc = langs.includes(raw.toLowerCase().split("-")[0])
    ? raw.toLowerCase().split("-")[0]
    : "en";

  function pick(obj) {
    if (!obj || typeof obj !== "object") return "";
    const s = obj[lc] || obj.en;
    return typeof s === "string" ? s.trim() : "";
  }

  /** @type {null | string} null = all platforms */
  let platformFilter = null;

  function nameSort(a, b) {
    return a.name.localeCompare(b.name, lc, { sensitivity: "base" });
  }

  function appTypes(app) {
    if (Array.isArray(app.types)) return app.types;
    if (typeof app.type === "string") return [app.type];
    return [];
  }

  function appHasType(app, typeKey) {
    return appTypes(app).indexOf(typeKey) !== -1;
  }

  function matchesFilter(app) {
    if (platformFilter === null) return true;
    const pl = app.platforms;
    return Array.isArray(pl) && pl.indexOf(platformFilter) !== -1;
  }

  function renderCard(app, data) {
    const platLabels = data.platformLabels || {};
    const card = document.createElement("article");
    card.className = "tpa-card";

    const titleEl = document.createElement("div");
    titleEl.className = "tpa-card__title";
    if (app.link) {
      const a = document.createElement("a");
      a.href = app.link;
      a.rel = "noopener noreferrer";
      a.target = "_blank";
      a.textContent = app.name;
      titleEl.appendChild(a);
    } else {
      titleEl.textContent = app.name;
    }
    card.appendChild(titleEl);

    const desc = pick(app.description);
    if (desc) {
      const p = document.createElement("p");
      p.className = "tpa-card__desc";
      p.textContent = desc;
      card.appendChild(p);
    }

    if (Array.isArray(app.platforms) && app.platforms.length) {
      const meta = document.createElement("div");
      meta.className = "tpa-card__platforms";
      meta.setAttribute("aria-label", pick(data.ui.filterLabel));
      app.platforms.forEach(function (key) {
        const lab = pick(platLabels[key]);
        if (!lab) return;
        const span = document.createElement("span");
        span.className = "tpa-chip tpa-chip--static";
        span.textContent = lab;
        meta.appendChild(span);
      });
      card.appendChild(meta);
    }

    return card;
  }

  function syncChipPressed(chips) {
    chips.querySelectorAll("button[data-all]").forEach(function (el) {
      el.setAttribute(
        "aria-pressed",
        platformFilter === null ? "true" : "false"
      );
    });
    chips.querySelectorAll("button[data-platform]").forEach(function (el) {
      const pk = el.dataset.platform;
      el.setAttribute(
        "aria-pressed",
        platformFilter === pk ? "true" : "false"
      );
    });
  }

  function renderFilters(data, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "tpa-filters";

    const chips = document.createElement("div");
    chips.className = "tpa-chips";
    chips.setAttribute("role", "group");

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "tpa-chip tpa-chip--toggle";
    allBtn.setAttribute("aria-pressed", "true");
    allBtn.textContent = pick(data.ui.all);
    allBtn.dataset.all = "1";
    chips.appendChild(allBtn);

    const order = data.platformOrder || [];
    const platLabels = data.platformLabels || {};
    order.forEach(function (key) {
      if (!platLabels[key]) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tpa-chip tpa-chip--toggle";
      b.setAttribute("aria-pressed", "false");
      b.textContent = pick(platLabels[key]);
      b.dataset.platform = key;
      chips.appendChild(b);
    });

    chips.addEventListener("click", function (ev) {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const btn = t.closest("button[data-all], button[data-platform]");
      if (!btn) return;

      if (btn.dataset.all === "1") {
        platformFilter = null;
      } else {
        const p = btn.dataset.platform;
        if (!p) return;
        platformFilter = platformFilter === p ? null : p;
      }

      syncChipPressed(chips);
      onChange();
    });

    wrap.appendChild(chips);
    return wrap;
  }

  function renderEverything(data) {
    root.replaceChildren();

    const typeOrder = data.typeOrder || [];
    const typeLabels = data.typeLabels || {};
    const apps = data.apps || [];

    const sectionsHost = document.createElement("div");
    sectionsHost.className = "tpa-sections";

    const noMatchesEl = document.createElement("p");
    noMatchesEl.className = "tpa-no-matches";
    noMatchesEl.hidden = true;
    noMatchesEl.textContent = pick(data.ui.noMatches);

    function paint() {
      sectionsHost.replaceChildren();
      let any = false;

      typeOrder.forEach(function (typeKey) {
        const sectionApps = apps
          .filter(function (a) {
            return appHasType(a, typeKey) && matchesFilter(a);
          })
          .sort(nameSort);
        if (sectionApps.length === 0) return;
        any = true;

        const section = document.createElement("section");
        section.className = "tpa-section";

        const h = document.createElement("h3");
        h.className = "tpa-section__title";
        h.textContent = pick(typeLabels[typeKey] || {});
        section.appendChild(h);

        const grid = document.createElement("div");
        grid.className = "tpa-grid";
        sectionApps.forEach(function (app) {
          grid.appendChild(renderCard(app, data));
        });
        section.appendChild(grid);
        sectionsHost.appendChild(section);
      });

      noMatchesEl.hidden = any;
    }

    const filterEl = renderFilters(data, paint);
    root.appendChild(filterEl);
    root.appendChild(noMatchesEl);
    root.appendChild(sectionsHost);

    paint();
    root.hidden = false;
  }

  function showError() {
    root.hidden = false;
    root.classList.add("tpa-root--error");
    root.textContent =
      lc === "zh"
        ? "无法加载第三方应用列表，请稍后刷新。"
        : lc === "ru"
        ? "Не удалось загрузить список приложений. Обновите страницу позже."
        : lc === "fa"
        ? "بارگیری فهرست برنامه‌ها ناموفق بود. بعداً صفحه را تازه‌سازی کنید."
        : "Could not load the app list. Please try refreshing.";
  }

  fetch("/assets/3p.json", { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("bad status");
      return res.json();
    })
    .then(renderEverything)
    .catch(showError);
});
