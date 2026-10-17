const STORAGE_KEY = 'wayfinder-mvp-v1';
const today = new Date();
const dateOffset = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const horseMap = {
  id: 'horse',
  name: 'Pierwsze zawody w klasie L',
  category: 'Jeździectwo',
  goal: 'Przygotuj się do swojego pierwszego startu w klasie L.',
  selectedId: 'rytm',
  milestones: [
    { id: 'fundamenty', title: 'Spokojne fundamenty', category: 'Fundament', description: 'Regularność i pewność w siodle. Zbudowałaś rytm, który daje Ci solidną bazę.', date: dateOffset(-72), status: 'done', x: 100, y: 382 },
    { id: 'rownowaga', title: 'Równowaga i rytm', category: 'Umiejętność', description: 'Pierwsze przejazdy z równym tempem i coraz lepszym wyczuciem konia.', date: dateOffset(-39), status: 'done', x: 270, y: 290 },
    { id: 'rytm', title: 'Pewność w skokach', category: 'Teraz', description: 'Pracujesz nad płynnym najazdem i spokojnym rytmem. Każda próba uczy Cię czegoś nowego.', date: dateOffset(0), status: 'current', x: 438, y: 355 },
    { id: 'przejazd', title: 'Przejazd treningowy', category: 'Następny krok', description: 'Spróbuj przejechać parkur treningowy w swoim tempie. Nie wynik jest najważniejszy, tylko doświadczenie.', date: dateOffset(12), status: 'upcoming', x: 596, y: 235 },
    { id: 'pierwszy-start', title: 'Pierwszy start', category: 'Ważny moment', description: 'Zapisz się na spokojne zawody i potraktuj je jak kolejną przygodę.', date: dateOffset(38), status: 'upcoming', x: 728, y: 305 },
    { id: 'cel', title: 'Zawody w klasie L', category: 'Twój cel', description: 'Własny start w klasie L. Droga do tego celu należy do Ciebie.', date: dateOffset(70), status: 'upcoming', x: 828, y: 154 }
  ],
  entries: [
    { id: 'entry-1', type: 'activity', title: 'Pierwsze spokojne przejazdy', description: 'Dziś znalazłam rytm, którego szukałam. Mały moment, ale bardzo mój.', date: dateOffset(-2), mood: 'dumnie' },
    { id: 'entry-2', type: 'memory', title: 'Poranek w stajni', description: 'Zapach siana, cisza przed treningiem i chwila tylko dla siebie.', date: dateOffset(-7), mood: 'spokojnie' },
    { id: 'entry-3', type: 'activity', title: 'Trening równowagi', description: 'Lepiej czuję tempo. Następnym razem popracuję nad płynnymi najazdami.', date: dateOffset(-10), mood: 'refleksyjnie' }
  ]
};

const starterData = {
  screen: 'welcome',
  activeMapId: null,
  maps: [horseMap],
  selectedId: horseMap.selectedId,
  milestones: structuredClone(horseMap.milestones),
  entries: structuredClone(horseMap.entries)
};

let state = loadState();
let activeFilter = 'all';
let toastTimer;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const svgIcon = (name) => {
  const paths = {
    check: '<path d="m5 12 4 4L19 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored?.maps) && stored.maps.length) {
      const activeMap = stored.maps.find((map) => map.id === stored.activeMapId);
      return {
        ...structuredClone(starterData),
        ...stored,
        selectedId: activeMap?.selectedId ?? stored.selectedId,
        milestones: activeMap?.milestones ?? stored.milestones ?? [],
        entries: activeMap?.entries ?? stored.entries ?? []
      };
    }
    if (stored?.milestones && stored?.entries) {
      const migratedMap = { ...structuredClone(horseMap), ...stored, id: 'horse' };
      return {
        ...structuredClone(starterData),
        screen: 'welcome',
        activeMapId: null,
        maps: [migratedMap],
        selectedId: migratedMap.selectedId,
        milestones: migratedMap.milestones,
        entries: migratedMap.entries
      };
    }
  } catch (error) {
    console.warn('Nie udało się odczytać lokalnego zapisu WAYFINDER.', error);
  }
  return structuredClone(starterData);
}

function saveState() {
  try {
    const activeMap = state.maps.find((map) => map.id === state.activeMapId);
    if (activeMap) {
      activeMap.selectedId = state.selectedId;
      activeMap.milestones = state.milestones;
      activeMap.entries = state.entries;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast('Nie udało się zapisać zmian w tej przeglądarce.');
    console.error(error);
  }
  $('#save-status')?.classList.add('saved');
}

function getActiveMap() {
  return state.maps.find((map) => map.id === state.activeMapId) ?? null;
}

function renderMapPicker() {
  const choices = $('#map-choices');
  if (!choices) return;
  const mapCards = state.maps.map((map) => {
    const completed = map.milestones.filter((point) => point.status === 'done').length;
    const progress = Math.round((completed / Math.max(map.milestones.length, 1)) * 100);
    const nextStep = map.milestones.find((point) => point.status === 'upcoming')?.title ?? 'Właśnie dotarłaś do celu';
    return `<article class="map-choice-card ${map.id === 'horse' ? 'horse-map-card' : ''}">
      <div class="map-choice-art ${map.id === 'horse' ? 'horse-map-art' : ''}">
        <svg viewBox="0 0 520 230" aria-hidden="true"><path class="mini-route-shadow" d="M45 180Q130 154 189 126T329 84T474 40"/><path class="mini-route" d="M45 180Q130 154 189 126T329 84T474 40"/><circle cx="45" cy="180" r="5"/><circle cx="189" cy="126" r="5"/><circle cx="329" cy="84" r="5"/><circle cx="474" cy="40" r="6"/></svg>
        <span class="map-art-category">${escapeHtml(map.category)}</span><span class="map-art-count">${map.milestones.length} ETAPÓW</span>
        <span class="map-art-next">${escapeHtml(nextStep)}</span>
      </div>
      <div class="map-choice-copy"><div><h2>${escapeHtml(map.name)}</h2><p>${escapeHtml(map.goal)}</p></div><div class="map-choice-progress"><div class="map-choice-progress-label"><span>${completed} z ${map.milestones.length} etapów za Tobą</span><strong>${progress}%</strong></div><span class="map-choice-progress-track"><i style="width:${progress}%"></i></span></div><button class="map-open-button" type="button" data-open-map="${escapeHtml(map.id)}">Otwórz mapę <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></button></div>
    </article>`;
  }).join('');
  choices.innerHTML = `${mapCards}<button class="map-create-card" id="add-map-button" type="button"><span class="map-create-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-7-7h14"/></svg></span><strong>Stwórz nową mapę</strong><span>Wybierz cel, a potem ułóż swoją drogę.</span></button>`;
  $('#library-back-button').hidden = !state.activeMapId;
}

function showScreen(screen) {
  if (screen === 'dashboard' && !getActiveMap()) screen = 'library';
  state.screen = screen;
  $('#welcome-screen').classList.toggle('active', screen === 'welcome');
  $('#map-library-screen').classList.toggle('active', screen === 'library');
  $('#app-shell').classList.toggle('active', screen === 'dashboard');
  if (screen === 'library') renderMapPicker();
  if (screen === 'dashboard') renderAll();
  saveState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openMap(id) {
  const map = state.maps.find((item) => item.id === id);
  if (!map) return;
  state.activeMapId = map.id;
  state.selectedId = map.selectedId;
  state.milestones = map.milestones;
  state.entries = map.entries;
  showScreen('dashboard');
}

function createMap(name, category, goal) {
  const id = `map-${crypto.randomUUID()}`;
  const makePoint = (title, pointCategory, description, date, status, x, y, suffix) => ({
    id: `${id}-${suffix}`,
    title,
    category: pointCategory,
    description,
    date,
    status,
    x,
    y
  });
  const map = {
    id,
    name,
    category,
    goal,
    selectedId: `${id}-step-1`,
    milestones: [
      makePoint('Pierwszy mały krok', 'Początek', goal, dateOffset(0), 'current', 100, 382, 'step-1'),
      makePoint('Znajdź swój rytm', 'Praktyka', 'Poznaj swoje tempo i sprawdź, co pomaga Ci iść dalej.', dateOffset(14), 'upcoming', 310, 264, 'step-2'),
      makePoint('Pierwsze wyzwanie', 'Ważny moment', 'Zauważ, czego nauczyła Cię droga do tego miejsca.', dateOffset(30), 'upcoming', 545, 315, 'step-3'),
      makePoint('Twój cel', 'Cel', goal, dateOffset(60), 'upcoming', 820, 154, 'step-4')
    ],
    entries: []
  };
  state.maps.push(map);
  state.activeMapId = map.id;
  state.selectedId = map.selectedId;
  state.milestones = map.milestones;
  state.entries = map.entries;
  $('#map-dialog').close();
  showScreen('dashboard');
  showToast('Twoja nowa mapa jest gotowa.');
}

function formatDate(value, options = { day: 'numeric', month: 'short' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pl-PL', options).format(new Date(`${value}T12:00:00`));
}

function routePoints() {
  return state.milestones.map(({ x, y }) => `${x},${y}`).join(' ');
}

function renderMap() {
  const map = $('#journey-map');
  if (!map) return;
  const currentIndex = state.milestones.findIndex((point) => point.status === 'current');
  const completed = state.milestones.slice(0, Math.max(currentIndex, 0) + (currentIndex < 0 ? 0 : 1));
  const donePoints = completed.length > 1 ? completed.map(({ x, y }) => `${x},${y}`).join(' ') : '';
  const nodes = state.milestones.map((point, index) => {
    const labelBelow = point.y < 100;
    const labelX = point.x > 750 ? point.x - 4 : point.x + 17;
    const anchor = point.x > 750 ? 'end' : 'start';
    const labelY = point.y + (labelBelow ? 27 : -12);
    const chosen = point.id === state.selectedId;
    const dateLabel = point.status === 'done' ? formatDate(point.date) : point.status === 'current' ? 'TERAZ' : formatDate(point.date);
    return `<g class="map-node ${point.status} ${chosen ? 'selected' : ''}" data-point="${escapeHtml(point.id)}" tabindex="0" role="button" aria-label="${escapeHtml(point.title)}${chosen ? ', wybrany' : ''}">
      <circle class="node-halo" cx="${point.x}" cy="${point.y}" r="21"/><circle class="node-ring" cx="${point.x}" cy="${point.y}" r="13"/><circle class="node-core" cx="${point.x}" cy="${point.y}" r="9"/>
      <text class="node-number" x="${point.x}" y="${point.y}">${point.status === 'done' ? '✓' : index + 1}</text>
      <text class="node-label" x="${labelX}" y="${labelY}" text-anchor="${anchor}">${escapeHtml(point.title)}</text>
      <text class="node-date" x="${labelX}" y="${labelY + 13}" text-anchor="${anchor}">${escapeHtml(dateLabel.toLocaleUpperCase('pl-PL'))}</text>
    </g>`;
  }).join('');
  map.innerHTML = `<defs><linearGradient id="mapTint" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#151a34" stop-opacity=".12"/><stop offset="1" stop-color="#3d2c55" stop-opacity=".2"/></linearGradient></defs>
    <rect width="900" height="520" fill="url(#mapTint)" pointer-events="none"/>
    <path class="route-back" d="M${routePoints().replaceAll(' ', ' L')}"/><path class="route-line" d="M${routePoints().replaceAll(' ', ' L')}"/>
    ${donePoints ? `<path class="route-done" d="M${donePoints.replaceAll(' ', ' L')}"/>` : ''}
    <g transform="translate(827 93)"><path class="summit" d="M-27 18 0-23 11-6 20-15 39 18Z"/><path class="summit-line" d="m-8-5 8 3 5-8 6 9 5-3"/><path class="summit-line" d="m-1-22 3 14"/></g>${nodes}`;
  map.setAttribute('aria-label', `Mapa trasy, ${state.milestones.length} punktów. Wybrany: ${getSelected()?.title ?? 'brak'}.`);
}

function getSelected() {
  return state.milestones.find((point) => point.id === state.selectedId) ?? state.milestones[0];
}

function renderOverview() {
  const done = state.milestones.filter((point) => point.status === 'done').length;
  const active = state.milestones.find((point) => point.status === 'current');
  const percentage = Math.round((done / Math.max(state.milestones.length, 1)) * 100);
  $('#milestone-summary').textContent = `${done} z ${state.milestones.length} etapów`;
  $('#progress-label').textContent = `${percentage}%`;
  $('#progress-fill').style.width = `${percentage}%`;
  $('#next-step').textContent = state.milestones.find((point) => point.status === 'upcoming')?.title ?? (active ? 'Jesteś na ostatnim etapie' : 'Dodaj kolejny punkt');
  $('#map-node-count').textContent = `${state.milestones.length} ${state.milestones.length === 1 ? 'punkt' : state.milestones.length < 5 ? 'punkty' : 'punktów'} na trasie`;
  $('#route-count').textContent = String(state.milestones.length).padStart(2, '0');
}

function renderDetail() {
  const point = getSelected();
  const detail = $('#selected-detail');
  if (!point) {
    detail.innerHTML = '<p class="detail-description">Dodaj pierwszy punkt na swojej drodze.</p>';
    return;
  }
  const completed = point.status === 'done';
  const dateText = point.status === 'current' ? 'Jesteś tutaj' : formatDate(point.date, { day: 'numeric', month: 'long', year: 'numeric' });
  detail.innerHTML = `<div class="detail-category"><i></i>${escapeHtml(point.category)}</div>
    <h2 class="detail-title">${escapeHtml(point.title)}</h2>
    <p class="detail-description">${escapeHtml(point.description || 'Ten punkt czeka na Twoją historię.')}</p>
    <div class="detail-meta"><span class="meta-pill">${svgIcon('calendar')}${escapeHtml(dateText)}</span>${completed ? `<span class="meta-pill">${svgIcon('check')}Zrobione</span>` : ''}</div>
    ${point.status !== 'done' ? `<button class="detail-action" id="complete-point-button">${svgIcon('check')}Oznacz jako zrobione</button>` : '<button class="detail-action done-action" disabled>✓ Ten etap jest już za Tobą</button>'}`;
  $('#complete-point-button')?.addEventListener('click', () => completePoint(point.id));
}

function renderRouteList() {
  $('#route-list').innerHTML = state.milestones.map((point, index) => `<button class="route-row ${point.status} ${point.id === state.selectedId ? 'selected' : ''}" data-point="${escapeHtml(point.id)}">
    <span class="route-dot">${point.status === 'done' ? '✓' : index + 1}</span><span class="route-name">${escapeHtml(point.title)}</span><span class="route-date">${point.status === 'current' ? 'teraz' : formatDate(point.date)}</span>
  </button>`).join('');
}

function renderJournal() {
  const entries = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = activeFilter === 'all' ? entries : entries.filter((entry) => entry.type === activeFilter);
  $('#journal-count').textContent = entries.length;
  $('#journal-total').textContent = String(entries.length).padStart(2, '0');
  $('#filter-all-count').textContent = entries.length;
  $$('.filter-button').forEach((button) => button.classList.toggle('active', button.dataset.filter === activeFilter));
  if (!filtered.length) {
    $('#journal-grid').innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5zm0 0v17M9 7h7m-7 4h7"/></svg><strong>To dobre miejsce na pierwszą chwilę.</strong><p>Zapisz trening, małe zwycięstwo albo coś, co chcesz zapamiętać.</p></div>`;
    return;
  }
  $('#journal-grid').innerHTML = filtered.map((entry) => `<article class="journal-card"><div class="journal-card-date"><strong>${formatDate(entry.date, { day: '2-digit' })}</strong><span>${formatDate(entry.date, { month: 'short' }).replace('.', '').toUpperCase()}</span></div><div class="journal-card-content"><div class="journal-card-top"><span class="journal-kind">${entry.type === 'activity' ? 'Trening' : 'Wspomnienie'}</span><span class="journal-mood">${escapeHtml(entry.mood || 'spokojnie')}</span></div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.description || 'Ten moment należy do Twojej drogi.')}</p></div></article>`).join('');
}

function renderMemories() {
  const memories = state.entries.filter((entry) => entry.type === 'memory').sort((a, b) => b.date.localeCompare(a.date));
  if (!memories.length) {
    $('#memory-feature').innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg><strong>Ta kolekcja czeka na Twoje chwile.</strong><p>Dodaj wspomnienie z drogi i wróć do niego, kiedy zechcesz.</p></div>';
    return;
  }
  $('#memory-feature').innerHTML = memories.map((memory) => `<article class="memory-card"><div class="memory-art" aria-hidden="true"><svg viewBox="0 0 360 137"><path d="M0 105 80 56l50 35 65-59 54 42 53-30 58 37v56H0Z" fill="#9eaa8e" opacity=".55"/><path d="m113 86 82-54 26 40-15-11-14 9-17-8-18 18z" fill="#718268" opacity=".78"/><circle cx="280" cy="25" r="13" fill="#d4b979" opacity=".7"/></svg></div><div class="memory-card-content"><span>${formatDate(memory.date, { day: 'numeric', month: 'long', year: 'numeric' })} · ${escapeHtml(memory.mood || 'spokojnie')}</span><h3>${escapeHtml(memory.title)}</h3><p>${escapeHtml(memory.description || 'Ten moment należy do Twojej drogi.')}</p></div></article>`).join('');
}

function renderAll() {
  const activeMap = getActiveMap();
  if (activeMap) {
    $('#goal-title').textContent = activeMap.name;
      $('#goal-subtitle').textContent = activeMap.goal;
    $('#profile-name').textContent = activeMap.name;
    $('#profile-category').textContent = activeMap.category;
  }
  renderOverview();
  renderMap();
  renderDetail();
  renderRouteList();
  renderJournal();
  renderMemories();
}

function completePoint(id) {
  const point = state.milestones.find((item) => item.id === id);
  if (!point || point.status === 'done') return;
  point.status = 'done';
  const index = state.milestones.indexOf(point);
  const next = state.milestones[index + 1];
  if (next && next.status === 'upcoming') next.status = 'current';
  state.selectedId = point.id;
  saveState();
  renderAll();
  showToast('Ten krok jest już częścią Twojej drogi.');
}

function openEntryDialog(type = 'activity', existing = null) {
  const dialog = $('#entry-dialog');
  $('#entry-type').value = type;
  $('#entry-id').value = existing?.id ?? '';
  $('#dialog-kicker').textContent = existing ? 'EDYTUJ WPIS' : type === 'memory' ? 'NOWE WSPOMNIENIE' : type === 'milestone' ? 'PUNKT NA MAPIE' : 'NOWY WPIS';
  $('#dialog-title').textContent = existing ? 'Zmień szczegóły' : type === 'memory' ? 'Zachowaj tę chwilę' : type === 'milestone' ? 'Dodaj punkt do mapy' : 'Zapisz tę chwilę';
  $('#entry-title-input').value = existing?.title ?? '';
  $('#entry-description').value = existing?.description ?? '';
  $('#entry-date-input').value = existing?.date ?? dateOffset(type === 'milestone' ? 7 : 0);
  $('#entry-mood').value = existing?.mood ?? 'spokojnie';
  $('#mood-field').hidden = type === 'milestone';
  $('#submit-entry span').textContent = existing ? 'Zapisz zmiany' : type === 'milestone' ? 'Dodaj punkt' : 'Zapisz wpis';
  dialog.showModal();
  $('#entry-title-input').focus();
}

function handleEntrySubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const id = $('#entry-id').value;
  const type = $('#entry-type').value;
  if (type === 'milestone') {
    const existing = state.milestones.find((point) => point.id === id);
    if (existing) {
      existing.title = $('#entry-title-input').value.trim().slice(0, 54);
      existing.description = $('#entry-description').value.trim().slice(0, 220);
      existing.date = $('#entry-date-input').value;
    } else {
      const index = state.milestones.length;
      const positions = [[100, 400], [275, 260], [445, 340], [610, 190]];
      const [x, y] = positions[index % positions.length];
      const point = {
        id: `point-${crypto.randomUUID()}`,
        title: $('#entry-title-input').value.trim().slice(0, 54),
        category: 'Własny punkt',
        description: $('#entry-description').value.trim().slice(0, 220),
        date: $('#entry-date-input').value,
        status: 'upcoming',
        x,
        y
      };
      state.milestones.push(point);
      state.selectedId = point.id;
    }
    saveState();
    $('#entry-dialog').close();
    renderAll();
    showToast(existing ? 'Punkt został zaktualizowany.' : 'Nowy punkt pojawił się na Twojej mapie.');
    return;
  }
  const entry = {
    id: id || `entry-${crypto.randomUUID()}`,
    type,
    title: $('#entry-title-input').value.trim(),
    description: $('#entry-description').value.trim(),
    date: $('#entry-date-input').value,
    mood: $('#entry-mood').value
  };
  if (!entry.title) return;
  if (id) state.entries = state.entries.map((item) => item.id === id ? entry : item);
  else state.entries.push(entry);
  saveState();
  $('#entry-dialog').close();
  renderAll();
  showToast(id ? 'Wpis został zaktualizowany.' : 'Zapisano. To część Twojej drogi.');
}

function addMilestone() {
  openEntryDialog('milestone');
}

function editSelectedPoint() {
  const point = getSelected();
  if (!point) return;
  openEntryDialog('milestone', point);
}

function switchView(viewName) {
  const viewMap = { mapa: 'map-view', dziennik: 'journal-view', wspomnienia: 'memories-view' };
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === viewMap[viewName]));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === viewName));
  $('#page-title').textContent = viewName === 'mapa' ? 'MAPA PODRÓŻY' : viewName === 'dziennik' ? 'DZIENNIK PODRÓŻY' : 'WSPOMNIENIA';
}

function handleMapCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  createMap($('#map-name-input').value.trim(), $('#map-category-input').value, $('#map-goal-input').value.trim());
  form.reset();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

$('#map-view').addEventListener('click', (event) => {
  const node = event.target.closest('[data-point]');
  if (!node) return;
  const point = state.milestones.find((item) => item.id === node.dataset.point);
  if (!point) return;
  state.selectedId = point.id;
  renderMap();
  renderDetail();
  renderRouteList();
});
$('#journey-map').addEventListener('keydown', (event) => {
  const node = event.target.closest('[data-point]');
  if (!node) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
$('#route-list').addEventListener('click', (event) => {
  const row = event.target.closest('[data-point]');
  if (!row) return;
  state.selectedId = row.dataset.point;
  renderMap();
  renderDetail();
  renderRouteList();
});
$$('.nav-item').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
$('#entry-form').addEventListener('submit', handleEntrySubmit);
$('#map-form').addEventListener('submit', handleMapCreate);
$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => $('#entry-dialog').close()));
$$('[data-close-map-dialog]').forEach((button) => button.addEventListener('click', () => $('#map-dialog').close()));
$('#entry-dialog').addEventListener('click', (event) => {
  if (event.target === $('#entry-dialog')) $('#entry-dialog').close();
});
$('#map-dialog').addEventListener('click', (event) => {
  if (event.target === $('#map-dialog')) $('#map-dialog').close();
});
$('#begin-button').addEventListener('click', () => showScreen('library'));
$('#library-back-button').addEventListener('click', () => showScreen(state.activeMapId ? 'dashboard' : 'welcome'));
$('#maps-library-button').addEventListener('click', () => showScreen('library'));
$('#map-choices').addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-open-map]');
  if (openButton) {
    openMap(openButton.dataset.openMap);
    return;
  }
  if (event.target.closest('#add-map-button')) $('#map-dialog').showModal();
});
$('#add-point-button').addEventListener('click', addMilestone);
$('#edit-point-button').addEventListener('click', editSelectedPoint);
$('#show-all-button').addEventListener('click', () => $('#route-list').scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
$('#add-activity-button').addEventListener('click', () => openEntryDialog('activity'));
$('#journal-add-button').addEventListener('click', () => openEntryDialog('activity'));
$('#memory-add-button').addEventListener('click', () => openEntryDialog('memory'));
$('#help-button').addEventListener('click', () => showToast('To lokalny prototyp. Twoje wpisy zapisują się tylko w tej przeglądarce.'));
$('#profile-button').addEventListener('click', () => showToast('Przykładowy cel możesz zmienić, edytując punkt na mapie.'));
$('#map-fit').addEventListener('click', () => {
  $('#journey-map').classList.remove('map-recenter');
  requestAnimationFrame(() => $('#journey-map').classList.add('map-recenter'));
});
$$('.filter-button').forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  renderJournal();
}));
const startScreen = window.matchMedia('(max-width:760px)').matches ? 'welcome' : state.screen ?? 'welcome';
showScreen(startScreen);
