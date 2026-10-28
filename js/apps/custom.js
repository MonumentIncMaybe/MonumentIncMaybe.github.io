/* custom.js - "website apps": a normal window that shows a site in an iframe, with the site's
 * favicon as the icon (desktop icon, title bar, taskbar).
 *
 * Add a row to SITES to add another app. `id` is what XP.open() uses; the first one keeps "custom".
 *   name        window title + desktop label
 *   url         page to show
 *   iconDomain  the domain whose favicon is used as the icon (any domain works)
 * Some sites refuse to be shown inside a frame; that is the site's choice, not a bug here.
 */
(function () {
  const SITES = [
    { id: "custom", name: "Deltarune", url: "https://mollomm1.github.io/test/", iconDomain: "deltarune.com" }
    // , { id: "wiki", name: "Wikipedia", url: "https://en.wikipedia.org/", iconDomain: "wikipedia.org" }
  ];

  /* Shown if the favicon can't be fetched (offline, blocked...). */
  const FALLBACK = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 28s-11-7-11-14a6 6 0 0 1 11-3.5A6 6 0 0 1 27 14c0 7-11 14-11 14z" fill="#ff0000"/></svg>'
  );

  SITES.forEach(site => {
    XP.icons.set(site.id, `https://www.google.com/s2/favicons?sz=64&domain=${site.iconDomain}`);
    XP.icons.fallbacks[site.id] = FALLBACK;

    XP.apps.register({
      id: site.id,
      title: site.name,
      label: site.name,
      icon: site.id,
      desktop: true,
      size: { w: 624, h: 405 },
      content: () => `<div class="pg"><iframe title="${site.name}" src="${site.url}" allow="fullscreen" style="width:100%;height:100%;border:0;background:#fff"></iframe></div>`
    });
  });
})();
