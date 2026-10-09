// Planowany przylot. W grudniu Polska jest w strefie UTC+01:00.
// Zmień tę datę, jeśli rok lub godzina przylotu są inne.
const ARRIVAL = '2026-12-24T11:45:00+01:00';
const arrivalTime = new Date(ARRIVAL).getTime();
const fields = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map(id => [id, document.getElementById(id)]));

function updateCountdown(now = Date.now()) {
  const total = Math.max(0, Math.floor((arrivalTime - now) / 1000));
  const values = {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
  };
  for (const [key, value] of Object.entries(values)) fields[key].textContent = String(value).padStart(2, '0');
  if (now >= arrivalTime) {
    document.getElementById('headline').innerHTML = 'NO TO JAZDA!<br><em>WESOŁYCH<br>ŚWIĄT!</em>';
  }
}

updateCountdown();
setInterval(() => updateCountdown(), 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });
