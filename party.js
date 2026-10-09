(() => {
  const button = document.getElementById('motion-toggle');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  function render() {
    document.body.classList.toggle('motion-paused', paused);
    document.body.classList.toggle('motion-enabled', !paused);
    button.textContent = paused ? 'Włącz animacje' : 'Zatrzymaj animacje';
    button.setAttribute('aria-pressed', String(paused));
  }
  button.hidden = false;
  render();
  button.addEventListener('click', () => { paused = !paused; render(); });
  preference.addEventListener('change', event => { paused = event.matches; render(); });
})();
