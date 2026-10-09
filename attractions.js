(() => {
  const config = window.ATTRACTIONS_CONFIG || {};
  const status = document.getElementById('attractions-status');
  const accessForm = document.getElementById('family-access');
  const content = document.getElementById('attractions-content');
  const form = document.getElementById('attraction-form');
  const title = document.getElementById('attraction-title');
  const author = document.getElementById('attraction-author');
  const list = document.getElementById('attractions-list');
  const empty = document.getElementById('attractions-empty');
  const refresh = document.getElementById('refresh-attractions');
  let familyCode = '';
  let busy = false;
  let pending = null;

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.supabaseUrl || '') || !config.publishableKey?.startsWith('sb_publishable_')) {
    status.textContent = 'Wspólna lista czeka na uruchomienie. Wkrótce będzie można dopisywać pomysły!';
    return;
  }
  accessForm.hidden = false;
  status.textContent = 'Wpisz kod od organizatora, żeby zobaczyć wspólne plany.';

  async function rpc(name, data) {
    const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: familyCode, ...data }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    if (!response.ok) {
      if (body.message === 'INVALID_FAMILY_CODE') throw new Error('Nieprawidłowy kod rodzinnej listy.');
      if (body.message === 'LIST_FULL') throw new Error('Lista osiągnęła limit pomysłów. Daj znać organizatorowi.');
      throw new Error('Nie udało się połączyć ze wspólną listą. Spróbuj ponownie.');
    }
    return body;
  }

  function render(items) {
    list.replaceChildren();
    for (const item of items) {
      const row = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'attraction-name';
      name.textContent = item.title;
      row.append(name);
      if (item.author) {
        const by = document.createElement('span');
        by.className = 'attraction-by';
        by.textContent = item.author;
        row.append(by);
      }
      list.append(row);
    }
    empty.hidden = items.length !== 0;
  }

  async function load() {
    const items = await rpc('family_attractions_list', {});
    render(items);
    status.textContent = 'Wspólna lista jest aktualna.';
  }

  function setBusy(value) {
    busy = value;
    for (const button of document.querySelectorAll('.attractions button')) button.disabled = value;
  }

  accessForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    familyCode = document.getElementById('family-code').value.trim();
    setBusy(true);
    status.textContent = 'Otwieranie wspólnej listy…';
    try {
      await load();
      accessForm.hidden = true;
      content.hidden = false;
      document.getElementById('family-code').value = '';
      title.focus();
    } catch (error) { status.textContent = error.message; }
    finally { setBusy(false); }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const idea = title.value.trim();
    const by = author.value.trim();
    if (!idea) { title.setCustomValidity('Wpisz pomysł na atrakcję.'); title.reportValidity(); return; }
    // Ten sam identyfikator przy ponowieniu zapisu zapobiega duplikatom po zerwaniu połączenia.
    if (!pending || pending.title !== idea || pending.author !== by) pending = { title: idea, author: by, id: crypto.randomUUID() };
    setBusy(true);
    status.textContent = 'Zapisywanie pomysłu…';
    try {
      await rpc('family_attractions_add', { p_title: pending.title, p_author: pending.author, p_id: pending.id });
      title.value = '';
      pending = null;
      status.textContent = 'Pomysł zapisany dla całej rodziny.';
      try { await load(); }
      catch { status.textContent = 'Pomysł zapisany. Odśwież listę, żeby zobaczyć aktualne plany.'; }
      title.focus();
    } catch (error) { status.textContent = error.message; }
    finally { setBusy(false); }
  });
  title.addEventListener('input', () => title.setCustomValidity(''));

  refresh.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    status.textContent = 'Odświeżanie wspólnych planów…';
    try { await load(); }
    catch (error) { status.textContent = error.message; }
    finally { setBusy(false); }
  });

  setInterval(async () => {
    if (content.hidden || busy || document.hidden) return;
    setBusy(true);
    try { await load(); }
    catch { status.textContent = 'Nie udało się odświeżyć listy. Wyświetlane są ostatnio pobrane plany.'; }
    finally { setBusy(false); }
  }, 30000);
})();
