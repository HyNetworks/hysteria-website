document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("hof-container");
  if (!container) return;

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

  function donorName(d) {
    if (!d.name) return "";
    if (typeof d.name === "string") return d.name;
    return pick(d.name) || d.name.en || "";
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function render(data) {
    const typeLabels = data.typeLabels || {};
    const donorList = data.donors;
    if (!Array.isArray(donorList) || donorList.length === 0) {
      container.hidden = false;
      container.textContent =
        lc === "zh"
          ? "暂无捐赠者列表。"
          : lc === "ru"
            ? "Список пуст."
            : lc === "fa"
              ? "فهرستی وجود ندارد."
              : "No donor list available.";
      return;
    }

    const items = shuffle(donorList);
    container.replaceChildren();

    items.forEach(function (d) {
      const badgeText = pick(typeLabels[d.type] || {});
      const desc = pick(d.description);

      const card = document.createElement("article");
      card.className = "hof-card hof-card--" + (d.type || "individual");

      const badge = document.createElement("span");
      badge.className = "hof-card__badge";
      badge.textContent = badgeText;
      card.appendChild(badge);

      const heading = document.createElement("div");
      heading.className = "hof-card__title";

      if (d.link) {
        const a = document.createElement("a");
        a.href = d.link;
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        a.textContent = donorName(d);
        heading.appendChild(a);
      } else {
        heading.textContent = donorName(d);
      }
      card.appendChild(heading);

      if (desc) {
        const p = document.createElement("p");
        p.className = "hof-card__desc";
        p.textContent = desc;
        card.appendChild(p);
      }

      container.appendChild(card);
    });

    container.hidden = false;
  }

  function showError() {
    container.hidden = false;
    container.classList.add("hof-card--error");
    container.textContent =
      lc === "zh"
        ? "荣誉榜加载失败，请稍后刷新。"
        : lc === "ru"
          ? "Не удалось загрузить Зал славы. Обновите страницу позже."
          : lc === "fa"
            ? "بارگیری تالار افتخار ناموفق بود. بعداً صفحه را تازه‌سازی کنید."
            : "Could not load the Hall of Fame. Please try refreshing.";
  }

  fetch("/assets/donors.json", { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("bad status");
      return res.json();
    })
    .then(render)
    .catch(showError);
});
