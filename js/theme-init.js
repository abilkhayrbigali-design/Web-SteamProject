// Run before styles paint, so the chosen mode stays consistent between pages.
(() => {
  let theme = 'dark';
  try { theme = localStorage.getItem('hub-theme') === 'light' ? 'light' : 'dark'; } catch {}
  document.documentElement.dataset.bsTheme = theme;
})();
