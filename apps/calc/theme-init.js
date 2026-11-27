(function () {
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = null;
  var root = document.documentElement;
  if (t) root.setAttribute('data-theme', t);
  var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  var m = document.getElementById('theme-color');
  if (m) m.setAttribute('content', dark ? '#1e1e1c' : '#ffffff');
})();
