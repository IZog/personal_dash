const STORAGE_KEY = 'personal-systems-tracker-v1';
const HABIT_DEFS = [
  { id: 'teamVideo', label: 'One team training video recorded' },
  { id: 'salesMessages', label: '10 LinkedIn/sales messages sent' },
  { id: 'proteinFirst', label: 'Protein first at each meal' },
  { id: 'tomorrowDelegation', label: "Tomorrow's delegation tasks identified" },
  { id: 'processDocumented', label: 'One process documented' }
];

const NOTIFICATION_SCHEDULE = [
  { id: 'morning-check', hour: 8, minute: 30, message: 'Morning momentum check-in. Review today\'s focus.' },
  { id: 'power-hour', hour: 12, minute: 30, message: 'Power Hour starts in 30 minutes. Protect the block!' },
  { id: 'documentation', hour: 15, minute: 30, message: 'Documentation time. Capture one process now.' },
  { id: 'habit-evening', hour: 20, minute: 0, message: 'Quick habit check – close your loops.' },
  { id: 'sunday-setup', hour: 19, minute: 0, weekday: 0, message: 'Sunday setup ritual. Plan the week ahead.' }
];

const deepClone = value => (typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value)));

const defaultState = {
  goals: {
    weight: {
      start: 86,
      target: 76,
      entries: []
    },
    mrr: {
      start: 15000,
      current: 15000,
      target: 30000,
      history: []
    }
  },
  extraction: {
    documentation: [],
    sops: [],
    recordings: [],
    delegation: {
      target: 30,
      history: []
    }
  },
  body: {
    weightEntries: [],
    fasting: {
      active: false,
      start: null,
      streak: 0,
      lastCompleted: null
    },
    meals: [],
    workouts: []
  },
  revenue: {
    templates: [],
    workshops: [],
    trainings: [],
    clientWins: [],
    caseStudyGoal: 50
  },
  energy: {
    meetings: [],
    powerHours: [],
    focusBlocks: []
  },
  habits: {
    completions: {},
    streaks: HABIT_DEFS.reduce((acc, h) => {
      acc[h.id] = { streak: 0, lastCompleted: null };
      return acc;
    }, {}),
    sundayPlan: ''
  },
  notifications: []
};

let state = loadState();
const charts = {};
const appRoot = document.getElementById('app');

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return deepClone(defaultState);
    const parsed = JSON.parse(saved);
    return mergeState(defaultState, parsed);
  } catch (error) {
    console.error('Failed to load state', error);
    return deepClone(defaultState);
  }
}

function mergeState(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming : base;
  }
  if (typeof base === 'object') {
    const result = { ...base };
    for (const key of Object.keys(base)) {
      if (incoming && Object.prototype.hasOwnProperty.call(incoming, key)) {
        result[key] = mergeState(base[key], incoming[key]);
      }
    }
    for (const key of Object.keys(incoming || {})) {
      if (!Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = incoming[key];
      }
    }
    return result;
  }
  return incoming ?? base;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey(date = new Date()) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function render() {
  updateProgressRings();
  renderDocumentation();
  renderSOPs();
  renderRecordings();
  renderDelegation();
  renderWeight();
  renderFasting();
  renderMeals();
  renderWorkouts();
  renderTemplates();
  renderWorkshops();
  renderTrainings();
  renderClientWins();
  renderMeetings();
  renderPowerHour();
  renderFocusBlocks();
  renderHabits();
  renderImpacts();
  renderStrategicAssistants();
  renderDashboard();
}

function updateProgressRings() {
  const weightRing = document.querySelector('#weight-progress .ring-progress');
  const weightValue = document.querySelector('#weight-progress .ring-value');
  const latestWeight = getLatestWeight();
  const progress = calculateProgress(state.goals.weight.start, state.goals.weight.target, latestWeight);
  applyRing(weightRing, weightValue, progress);

  const mrrRing = document.querySelector('#mrr-progress .ring-progress');
  const mrrValue = document.querySelector('#mrr-progress .ring-value');
  const currentMRR = state.goals.mrr.current ?? state.goals.mrr.start;
  const mrrProgress = calculateProgress(state.goals.mrr.start, state.goals.mrr.target, currentMRR, false);
  applyRing(mrrRing, mrrValue, mrrProgress);

  document.getElementById('weight-current').value = latestWeight ?? '';
  document.getElementById('mrr-current').value = currentMRR ?? '';
}

function calculateProgress(start, target, current, lowerIsBetter = true) {
  if (current == null) return 0;
  const range = lowerIsBetter ? start - target : target - start;
  if (range === 0) return 100;
  const achieved = lowerIsBetter ? start - current : current - start;
  return Math.min(100, Math.max(0, Math.round((achieved / range) * 100)));
}

function applyRing(circle, label, progress) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - progress / 100);
  circle.style.strokeDashoffset = offset;
  label.textContent = `${progress}%`;
}

function getLatestWeight() {
  if (!state.body.weightEntries.length) return state.goals.weight.start;
  return state.body.weightEntries[state.body.weightEntries.length - 1].value;
}

function renderDocumentation() {
  const list = document.getElementById('documentation-list');
  list.innerHTML = '';
  state.extraction.documentation.slice().reverse().forEach(entry => {
    const item = templateLogItem(`${formatDate(entry.date)}`, entry.text);
    list.appendChild(item);
  });
}

function renderSOPs() {
  const list = document.getElementById('sop-list');
  const countField = document.querySelector('[data-field="sop-count"]');
  const progressField = document.querySelector('[data-field="sop-progress"]');
  list.innerHTML = '';
  state.extraction.sops.slice().reverse().forEach(sop => {
    const meta = `${sop.status} • ${formatDate(sop.date)}`;
    const item = templateLogItem(sop.title, meta);
    if (sop.notes) {
      const notes = document.createElement('div');
      notes.className = 'log-meta';
      notes.textContent = sop.notes;
      item.appendChild(notes);
    }
    list.appendChild(item);
  });
  countField.textContent = state.extraction.sops.length;
  const pct = Math.min(100, Math.round((state.extraction.sops.length / 50) * 100));
  progressField.style.width = `${pct}%`;
}

function renderRecordings() {
  const list = document.getElementById('recording-list');
  const countField = document.querySelector('[data-field="recording-count"]');
  list.innerHTML = '';
  state.extraction.recordings.slice().reverse().forEach(rec => {
    const meta = `${formatDate(rec.date)} • ${rec.checked ? 'Checklist complete' : 'Checklist pending'}`;
    const item = templateLogItem(rec.title, meta);
    if (rec.link) {
      const link = document.createElement('a');
      link.href = rec.link;
      link.textContent = 'Recording link';
      link.target = '_blank';
      item.appendChild(link);
    }
    list.appendChild(item);
  });
  countField.textContent = state.extraction.recordings.length;
}

function renderDelegation() {
  const currentField = document.querySelector('[data-field="delegation-current"]');
  const input = document.getElementById('delegation-input');
  const latest = state.extraction.delegation.history[state.extraction.delegation.history.length - 1];
  const current = latest ? latest.value : 70;
  input.value = current;
  currentField.textContent = `${current}%`;
  drawDelegationChart();
}

function renderWeight() {
  const weeklyAvgField = document.querySelector('[data-field="weekly-weight"]');
  const latestEntries = state.body.weightEntries.slice(-7);
  if (latestEntries.length) {
    const avg = latestEntries.reduce((sum, entry) => sum + entry.value, 0) / latestEntries.length;
    weeklyAvgField.textContent = avg.toFixed(1);
  } else {
    weeklyAvgField.textContent = '0';
  }
  drawWeightChart();
}

function renderFasting() {
  const statusField = document.querySelector('[data-field="fasting-status"]');
  const remainingField = document.querySelector('[data-field="fasting-remaining"]');
  const streakField = document.querySelector('[data-field="fasting-streak"]');
  const fastButton = document.querySelector('[data-action="toggle-fast"]');
  if (state.body.fasting.active) {
    statusField.textContent = 'Fasting in progress';
    fastButton.textContent = 'Fast Running';
    fastButton.disabled = true;
  } else {
    statusField.textContent = 'Ready for next fast';
    fastButton.textContent = 'Start Fast';
    fastButton.disabled = false;
  }
  streakField.textContent = state.body.fasting.streak;
  remainingField.textContent = formatDuration(getFastingRemaining());
}

function renderMeals() {
  const calendar = document.getElementById('meal-calendar');
  calendar.innerHTML = '';
  const grouped = groupByWeek(state.body.meals);
  const weeks = Object.entries(grouped);
  const daysToRender = weeks.length ? weeks.slice(-1)[0][1] : getCurrentWeek().map(day => ({
    day: day.label,
    photos: [],
    notes: []
  }));
  daysToRender.forEach(day => {
    const cell = document.createElement('div');
    cell.innerHTML = `<strong>${day.day}</strong>`;
    if (day.photos.length) {
      const preview = document.createElement('img');
      preview.src = day.photos[0];
      preview.alt = 'Meal photo';
      cell.appendChild(preview);
    }
    if (day.notes && day.notes.length) {
      const note = document.createElement('span');
      note.textContent = day.notes[day.notes.length - 1];
      note.className = 'log-meta';
      cell.appendChild(note);
    }
    calendar.appendChild(cell);
  });
}

function renderWorkouts() {
  const weekGrid = document.getElementById('workout-week');
  weekGrid.innerHTML = '';
  const week = getCurrentWeek();
  week.forEach(day => {
    const cell = document.createElement('div');
    const workout = state.body.workouts.find(w => w.date === day.date);
    cell.innerHTML = `<strong>${day.label}</strong>`;
    if (workout) {
      cell.innerHTML += `<span>✔</span>`;
      if (workout.notes) {
        const note = document.createElement('span');
        note.textContent = workout.notes;
        cell.appendChild(note);
      }
    }
    weekGrid.appendChild(cell);
  });
  document.getElementById('workout-today').checked = Boolean(state.body.workouts.find(w => w.date === todayKey()));
  const todaysWorkout = state.body.workouts.find(w => w.date === todayKey());
  document.getElementById('workout-notes').value = todaysWorkout?.notes ?? '';
}

function renderTemplates() {
  const list = document.getElementById('template-list');
  const countField = document.querySelector('[data-field="template-count"]');
  list.innerHTML = '';
  state.revenue.templates.slice().reverse().forEach(template => {
    const meta = `${template.category || 'General'} • ${formatDate(template.date)}`;
    const item = templateLogItem(template.title, meta);
    if (template.content) {
      const notes = document.createElement('div');
      notes.className = 'log-meta';
      notes.textContent = template.content;
      item.appendChild(notes);
    }
    list.appendChild(item);
  });
  countField.textContent = state.revenue.templates.length;
}

function renderWorkshops() {
  const list = document.getElementById('workshop-list');
  list.innerHTML = '';
  state.revenue.workshops.slice().reverse().forEach(workshop => {
    const meta = `${workshop.status} • Target €${workshop.target || 0}`;
    const item = templateLogItem(workshop.title, meta);
    list.appendChild(item);
  });
}

function renderTrainings() {
  const list = document.getElementById('training-list');
  list.innerHTML = '';
  state.revenue.trainings.slice().reverse().forEach(training => {
    const meta = `${formatDate(training.date)} • ${training.members || 'Team'}`;
    const item = templateLogItem(training.topic, meta);
    if (training.friday) {
      const badge = document.createElement('span');
      badge.className = 'log-meta';
      badge.textContent = 'Friday session complete';
      item.appendChild(badge);
    }
    list.appendChild(item);
  });
}

function renderClientWins() {
  const list = document.getElementById('client-win-list');
  const caseCount = document.querySelector('[data-field="case-count"]');
  list.innerHTML = '';
  state.revenue.clientWins.slice().reverse().forEach(win => {
    const meta = `${formatDate(win.date)}`;
    const item = templateLogItem(win.client, meta);
    if (win.result) {
      const result = document.createElement('div');
      result.className = 'log-meta';
      result.textContent = win.result;
      item.appendChild(result);
    }
    list.appendChild(item);
  });
  caseCount.textContent = state.revenue.clientWins.length;
}

function renderMeetings() {
  const list = document.getElementById('meeting-list');
  list.innerHTML = '';
  const todayMeetings = state.energy.meetings.filter(m => m.date === todayKey());
  document.querySelector('[data-field="meeting-count"]').textContent = todayMeetings.length;
  state.energy.meetings.slice().reverse().forEach(meeting => {
    const meta = `${meeting.time} • Energy drain ${meeting.energy}/5`;
    const item = templateLogItem(meeting.title, meta);
    list.appendChild(item);
  });
}

function renderPowerHour() {
  const powerRate = calculatePowerHourRate();
  document.querySelector('[data-field="power-rate"]').textContent = `${Math.round(powerRate)}%`;
  const remaining = getTimerRemaining('power', 60 * 60);
  document.querySelector('[data-field="power-remaining"]').textContent = formatDuration(remaining);
  document.querySelector('[data-field="power-status"]').textContent = state.energy.powerHours.some(p => p.active)
    ? 'Power hour in progress'
    : 'Ready';
}

function renderFocusBlocks() {
  const list = document.getElementById('focus-list');
  list.innerHTML = '';
  state.energy.focusBlocks.slice().reverse().forEach(block => {
    const meta = `${block.start} • ${block.duration} min • ${block.interruptions} interruptions`;
    const item = templateLogItem(block.block, meta);
    list.appendChild(item);
  });
  document.querySelector('[data-field="productive-time"]').textContent = determineProductiveTime();
}

function determineProductiveTime() {
  if (!state.energy.focusBlocks.length) return '--';
  const bucketed = state.energy.focusBlocks.reduce((acc, block) => {
    const hour = parseInt(block.start.split(':')[0], 10);
    if (Number.isNaN(hour)) return acc;
    const bucket = `${hour.toString().padStart(2, '0')}:00`;
    acc[bucket] = acc[bucket] || { duration: 0, interruptions: 0, sessions: 0 };
    acc[bucket].duration += block.duration;
    acc[bucket].interruptions += block.interruptions;
    acc[bucket].sessions += 1;
    return acc;
  }, {});
  const scored = Object.entries(bucketed).map(([time, data]) => {
    const focusQuality = data.duration - data.interruptions * 5;
    return { time, score: focusQuality / data.sessions };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].time : '--';
}

function renderHabits() {
  const list = document.getElementById('habit-list');
  const template = document.getElementById('habit-item-template');
  list.innerHTML = '';
  HABIT_DEFS.forEach(habit => {
    const node = template.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector('input');
    checkbox.checked = isHabitComplete(habit.id, todayKey());
    checkbox.addEventListener('change', () => toggleHabit(habit.id, checkbox.checked));
    node.querySelector('.habit-label').textContent = habit.label;
    node.querySelector('.habit-streak').textContent = `${state.habits.streaks[habit.id].streak} day streak`;
    list.appendChild(node);
  });
  document.querySelector('[data-field="habit-weekly"]').textContent = `${Math.round(calculateHabitCompletion(7) * 100)}%`;
  document.querySelector('[data-field="habit-monthly"]').textContent = `${Math.round(calculateHabitCompletion(30) * 100)}%`;
  renderHabitStreaks();
}

function renderHabitStreaks() {
  const container = document.getElementById('habit-streaks');
  container.innerHTML = '';
  HABIT_DEFS.forEach(habit => {
    const streak = state.habits.streaks[habit.id];
    const div = document.createElement('div');
    div.innerHTML = `<strong>${habit.label.split(' ')[0]}</strong><br>Streak: ${streak.streak}`;
    container.appendChild(div);
  });
}

function renderImpacts() {
  document.querySelector('[data-field="impact-videos"]').textContent = state.extraction.recordings.length;
  const salesMessages = countHabitTotals('salesMessages');
  document.querySelector('[data-field="impact-sales"]').textContent = salesMessages;
  document.querySelector('[data-field="impact-cases"]').textContent = state.revenue.clientWins.length;
  drawCompoundChart();
}

function renderStrategicAssistants() {
  document.querySelector('[data-field="delegation-assistant"]').textContent = buildDelegationSuggestion();
  document.querySelector('[data-field="energy-optimizer"]').textContent = buildEnergyInsight();
  const { projection6, projection12 } = calculateCompoundProjection();
  document.querySelector('[data-field="compound-6"]').textContent = projection6;
  document.querySelector('[data-field="compound-12"]').textContent = projection12;
  document.querySelector('[data-field="quick-win"]').textContent = buildQuickWin();
}

function renderDashboard() {
  const pendingList = document.querySelector('[data-field="pending-habits"]');
  pendingList.innerHTML = '';
  const incomplete = HABIT_DEFS.filter(h => !isHabitComplete(h.id, todayKey()));
  if (incomplete.length === 0) {
    pendingList.innerHTML = '<li>All habits crushed today!</li>';
  } else {
    incomplete.forEach(habit => {
      const li = document.createElement('li');
      li.textContent = habit.label;
      pendingList.appendChild(li);
    });
  }
  document.querySelector('[data-field="current-block"]').textContent = deriveCurrentBlock();
  const chartData = buildMomentumTrend();
  drawMomentumChart(chartData);
  document.querySelector('[data-field="habit-rate"]').textContent = `${Math.round(chartData.habitRate * 100)}%`;
  document.querySelector('[data-field="delegation-trend"]').textContent = `${Math.round(chartData.delegationTrend)}%`;
  document.querySelector('[data-field="energy-avg"]').textContent = `${chartData.energyAverage.toFixed(1)}/5`;
}

function deriveCurrentBlock() {
  const now = new Date();
  const hour = now.getHours();
  if (isTimerActive('power')) return 'Power Hour (Deep Work)';
  if (state.body.fasting.active) {
    return hour < 12 ? 'Morning fasted focus' : 'Prep healthy break-fast';
  }
  if (hour < 9) return 'Morning setup';
  if (hour < 12) return 'Client delivery';
  if (hour < 15) return 'Growth systems';
  if (hour < 18) return 'Delegation & documentation';
  return 'Evening wind-down';
}

function buildMomentumTrend() {
  const lastSevenDays = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const key = todayKey(date);
    return {
      key,
      habits: HABIT_DEFS.filter(h => isHabitComplete(h.id, key)).length / HABIT_DEFS.length,
      delegation: getDelegationForDate(key) ?? null,
      energy: averageEnergyForDate(key)
    };
  });
  const habitRate = lastSevenDays.reduce((sum, day) => sum + day.habits, 0) / lastSevenDays.length;
  const delegationTrend = lastSevenDays.reduce((sum, day) => sum + (day.delegation ?? 0), 0) / lastSevenDays.filter(d => d.delegation != null).length || 0;
  const energyAverage = lastSevenDays.reduce((sum, day) => sum + (day.energy || 0), 0) / lastSevenDays.filter(d => d.energy != null).length || 0;
  return {
    labels: lastSevenDays.map(day => day.key.slice(5)),
    habitSeries: lastSevenDays.map(day => Math.round(day.habits * 100)),
    delegationSeries: lastSevenDays.map(day => day.delegation ?? null),
    energySeries: lastSevenDays.map(day => day.energy ?? null),
    habitRate,
    delegationTrend,
    energyAverage
  };
}

function drawChart(canvasId, config, key) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (charts[key]) {
    charts[key].data = config.data;
    charts[key].options = { ...charts[key].options, ...config.options };
    charts[key].update();
  } else {
    charts[key] = new Chart(canvas, config);
  }
}

function drawWeightChart() {
  const labels = state.body.weightEntries.map(entry => entry.date.slice(5));
  const data = state.body.weightEntries.map(entry => entry.value);
  drawChart('weight-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.3)',
        tension: 0.4,
        fill: true,
        pointRadius: 3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { ticks: { color: '#94a3b8' } }
      }
    }
  }, 'weight');
}

function drawDelegationChart() {
  const labels = state.extraction.delegation.history.map(entry => entry.date.slice(5));
  const data = state.extraction.delegation.history.map(entry => entry.value);
  drawChart('delegation-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Delivery time %',
        data,
        borderColor: '#facc15',
        backgroundColor: 'rgba(250, 204, 21, 0.3)',
        tension: 0.4,
        fill: true,
        pointRadius: 3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { ticks: { color: '#94a3b8' }, suggestedMin: 0, suggestedMax: 100 }
      }
    }
  }, 'delegation');
}

function drawMomentumChart({ labels, habitSeries, delegationSeries, energySeries }) {
  drawChart('momentum-chart', {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Habit %',
          data: habitSeries,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Delegation %',
          data: delegationSeries,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.2)',
          yAxisID: 'y1'
        },
        {
          label: 'Energy',
          data: energySeries,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#e2e8f0' } } },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { position: 'left', ticks: { color: '#38bdf8', callback: v => `${v}%` }, min: 0, max: 100 },
        y1: { position: 'right', ticks: { color: '#f97316' }, min: 0, max: 100, grid: { drawOnChartArea: false } },
        y2: { position: 'right', ticks: { color: '#22c55e' }, min: 0, max: 5, grid: { drawOnChartArea: false } }
      }
    }
  }, 'momentum');
}

function drawCompoundChart() {
  const months = ['Now', '1m', '2m', '3m', '4m', '5m', '6m'];
  const { projectionSeries } = calculateCompoundProjection(true);
  drawChart('compound-chart', {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Projected training videos',
        data: projectionSeries,
        backgroundColor: 'rgba(99, 102, 241, 0.6)'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { ticks: { color: '#94a3b8' } }
      }
    }
  }, 'compound');
}

function templateLogItem(title, meta) {
  const template = document.getElementById('log-item-template');
  const node = template.content.firstElementChild.cloneNode(true);
  node.querySelector('.log-title').textContent = title;
  node.querySelector('.log-meta').textContent = meta;
  return node;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function groupByWeek(entries) {
  const grouped = {};
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const key = todayKey(startOfWeek);
    if (!grouped[key]) {
      grouped[key] = Array.from({ length: 7 }, (_, idx) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + idx);
        return {
          day: dayDate.toLocaleDateString(undefined, { weekday: 'short' }),
          date: todayKey(dayDate),
          photos: [],
          notes: []
        };
      });
    }
    const dayIndex = date.getDay();
    const array = grouped[key];
    const dayEntry = array[dayIndex];
    if (entry.photo) {
      dayEntry.photos.push(entry.photo);
    }
    if (entry.note) {
      dayEntry.notes.push(entry.note);
    }
  });
  return grouped;
}

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(start);
    date.setDate(start.getDate() + idx);
    return { date: todayKey(date), label: date.toLocaleDateString(undefined, { weekday: 'short' }) };
  });
}

function calculatePowerHourRate() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sessions = state.energy.powerHours.filter(p => p.date.startsWith(monthKey));
  const scheduled = now.getDate();
  if (scheduled === 0) return 0;
  const completed = sessions.filter(p => p.completed).length;
  return (completed / scheduled) * 100;
}

function getTimerRemaining(type, duration) {
  const active = state.energy.powerHours.find(p => p.active);
  if (type === 'power' && active) {
    const elapsed = (Date.now() - new Date(active.start).getTime()) / 1000;
    return Math.max(0, duration - elapsed);
  }
  return duration;
}

function isTimerActive(type) {
  if (type === 'power') {
    return Boolean(state.energy.powerHours.find(p => p.active));
  }
  return false;
}

function getFastingRemaining() {
  if (!state.body.fasting.active || !state.body.fasting.start) return 16 * 60 * 60;
  const elapsed = (Date.now() - new Date(state.body.fasting.start).getTime()) / 1000;
  return Math.max(0, 16 * 60 * 60 - elapsed);
}

function averageEnergyForDate(key) {
  const meetings = state.energy.meetings.filter(m => m.date === key);
  if (!meetings.length) return null;
  const drain = meetings.reduce((sum, m) => sum + (6 - m.energy), 0);
  const score = 5 - drain / meetings.length;
  return Math.max(0, Math.min(5, score));
}

function getDelegationForDate(key) {
  const entry = state.extraction.delegation.history.find(d => d.date === key);
  return entry ? entry.value : null;
}

function isHabitComplete(id, dateKey) {
  const entries = state.habits.completions[dateKey];
  return entries ? Boolean(entries[id]) : false;
}

function toggleHabit(id, completed) {
  const key = todayKey();
  if (!state.habits.completions[key]) state.habits.completions[key] = {};
  state.habits.completions[key][id] = completed;
  updateHabitStreak(id, completed);
  saveState();
  renderHabits();
  renderImpacts();
  renderDashboard();
}

function updateHabitStreak(id, completed) {
  const streak = state.habits.streaks[id];
  if (!streak) return;
  const today = todayKey();
  if (completed) {
    if (streak.lastCompleted === today) return;
    const yesterday = todayKey(new Date(Date.now() - 86400000));
    if (streak.lastCompleted === yesterday) {
      streak.streak += 1;
    } else {
      streak.streak = 1;
    }
    streak.lastCompleted = today;
  } else if (streak.lastCompleted === today) {
    streak.streak = Math.max(0, streak.streak - 1);
    streak.lastCompleted = null;
  }
}

function calculateHabitCompletion(days) {
  const today = new Date();
  let total = 0;
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const key = todayKey(date);
    total += HABIT_DEFS.length;
    completed += HABIT_DEFS.filter(h => isHabitComplete(h.id, key)).length;
  }
  return total ? completed / total : 0;
}

function countHabitTotals(id) {
  return Object.values(state.habits.completions).reduce((sum, habits) => sum + (habits[id] ? 10 : 0), 0);
}

function buildDelegationSuggestion() {
  const latest = state.extraction.delegation.history.slice(-3);
  if (!latest.length) {
    return 'Log your current delivery % to unlock delegation suggestions.';
  }
  const current = latest[latest.length - 1].value;
  if (current > 50) {
    return 'Delegate recurring client updates – they consume high delivery time.';
  }
  if (current > 35) {
    return 'Shift documentation to async updates and hand off QA reviews.';
  }
  return 'Delivery time is trending down. Identify strategic tasks to retain.';
}

function buildEnergyInsight() {
  const focusBlocks = state.energy.focusBlocks;
  if (!focusBlocks.length) return 'Log deep work blocks to learn your prime energy times.';
  const grouped = focusBlocks.reduce((acc, block) => {
    const hour = parseInt(block.start.split(':')[0], 10);
    const bucket = `${hour.toString().padStart(2, '0')}:00`;
    acc[bucket] = acc[bucket] || { total: 0, sessions: 0 };
    acc[bucket].total += block.duration;
    acc[bucket].sessions += 1;
    return acc;
  }, {});
  const best = Object.entries(grouped).sort((a, b) => b[1].total / b[1].sessions - a[1].total / a[1].sessions)[0];
  return best ? `Your energy peaks around ${best[0]}. Defend this slot for deep work.` : 'Keep logging focus blocks to reveal trends.';
}

function calculateCompoundProjection(includeSeries = false) {
  const totalVideos = state.extraction.recordings.length;
  const completedDays = Object.keys(state.habits.completions).length || 1;
  const rate = totalVideos / completedDays;
  const projection6 = Math.round(totalVideos + rate * 30 * 6);
  const projection12 = Math.round(totalVideos + rate * 30 * 12);
  if (includeSeries) {
    const projectionSeries = Array.from({ length: 7 }, (_, idx) => Math.round(totalVideos + rate * 30 * idx));
    return { projection6, projection12, projectionSeries };
  }
  return { projection6, projection12 };
}

function buildQuickWin() {
  const incomplete = HABIT_DEFS.filter(h => !isHabitComplete(h.id, todayKey()));
  if (incomplete.length) {
    return `Take 5 minutes to ${incomplete[0].label.toLowerCase()}.`;
  }
  const suggestions = [
    'Draft a new SOP outline for tomorrow\'s handoff.',
    'Send a quick thank-you note to a client – document the win.',
    'Block next week\'s power hours in your calendar.'
  ];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

function buildMomentumNotification(message) {
  const list = document.getElementById('notification-list');
  const li = document.createElement('li');
  li.innerHTML = `<span>${message}</span>`;
  const btn = document.createElement('button');
  btn.textContent = 'Done';
  btn.addEventListener('click', () => {
    list.removeChild(li);
  });
  li.appendChild(btn);
  list.appendChild(li);
}

function checkNotifications() {
  const now = new Date();
  NOTIFICATION_SCHEDULE.forEach(notification => {
    if (notification.weekday != null && notification.weekday !== now.getDay()) {
      return;
    }
    if (now.getHours() === notification.hour && now.getMinutes() === notification.minute) {
      const key = `${todayKey(now)}-${notification.id}`;
      if (!state.notifications.includes(key)) {
        buildMomentumNotification(notification.message);
        state.notifications.push(key);
        saveState();
      }
    }
  });
}

function resetDailyNotifications() {
  const today = todayKey();
  state.notifications = state.notifications.filter(key => key.startsWith(today));
}

function handleFormSubmissions() {
  document.querySelector('[data-action="save-documentation"]').addEventListener('click', () => {
    const textarea = document.getElementById('documentation-entry');
    if (!textarea.value.trim()) return;
    state.extraction.documentation.push({ date: todayKey(), text: textarea.value.trim() });
    textarea.value = '';
    saveState();
    renderDocumentation();
    renderStrategicAssistants();
  });

  document.getElementById('sop-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    state.extraction.sops.push({
      title: formData.get('title'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      date: todayKey()
    });
    form.reset();
    saveState();
    renderSOPs();
    renderStrategicAssistants();
  });

  document.getElementById('recording-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    state.extraction.recordings.push({
      title: formData.get('title'),
      link: formData.get('link'),
      checked: formData.get('checked') === 'on',
      date: todayKey()
    });
    form.reset();
    saveState();
    renderRecordings();
    renderImpacts();
    renderStrategicAssistants();
  });

  document.querySelector('[data-action="save-delegation"]').addEventListener('click', () => {
    const input = document.getElementById('delegation-input');
    if (!input.value) return;
    state.extraction.delegation.history.push({ date: todayKey(), value: Number(input.value) });
    saveState();
    renderDelegation();
    renderDashboard();
    renderStrategicAssistants();
  });

  document.querySelectorAll('[data-action="add-weight"]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById('weight-input');
      const currentInput = document.getElementById('weight-current');
      const value = Number(input.value || currentInput.value);
      if (!value) return;
      state.body.weightEntries.push({ date: todayKey(), value });
      state.goals.weight.entries = state.body.weightEntries;
      saveState();
      renderWeight();
      updateProgressRings();
    });
  });

  document.querySelector('[data-action="update-mrr"]').addEventListener('click', () => {
    const input = document.getElementById('mrr-current');
    const value = Number(input.value);
    if (!value) return;
    state.goals.mrr.current = value;
    state.goals.mrr.history.push({ date: todayKey(), value });
    saveState();
    updateProgressRings();
    renderStrategicAssistants();
  });

  document.querySelector('[data-action="break-fast"]').addEventListener('click', () => {
    if (!state.body.fasting.active) return;
    state.body.fasting.active = false;
    state.body.fasting.end = new Date().toISOString();
    const duration = (new Date(state.body.fasting.end) - new Date(state.body.fasting.start)) / 3600000;
    if (duration >= 16) {
      const lastDate = state.body.fasting.lastCompleted;
      const yesterday = todayKey(new Date(Date.now() - 86400000));
      if (lastDate === yesterday) {
        state.body.fasting.streak += 1;
      } else {
        state.body.fasting.streak = 1;
      }
      state.body.fasting.lastCompleted = todayKey();
    }
    saveState();
    renderFasting();
  });

  const mealInput = document.getElementById('meal-photo');
  mealInput.addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataURL(file);
    state.body.meals.push({ date: todayKey(), photo: dataUrl });
    event.target.value = '';
    saveState();
    renderMeals();
  });

  document.querySelectorAll('[data-action="log-workout"]').forEach(button => {
    button.addEventListener('click', () => {
      const checked = document.getElementById('workout-today').checked;
      const notes = document.getElementById('workout-notes').value;
      const existingIndex = state.body.workouts.findIndex(w => w.date === todayKey());
      if (checked) {
        const entry = { date: todayKey(), notes };
        if (existingIndex >= 0) {
          state.body.workouts[existingIndex] = entry;
        } else {
          state.body.workouts.push(entry);
        }
      } else if (existingIndex >= 0) {
        state.body.workouts.splice(existingIndex, 1);
      }
      saveState();
      renderWorkouts();
      renderStrategicAssistants();
    });
  });

  document.getElementById('template-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    state.revenue.templates.push({
      title: data.get('title'),
      category: data.get('category'),
      content: data.get('content'),
      date: todayKey()
    });
    form.reset();
    saveState();
    renderTemplates();
  });

  document.getElementById('workshop-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    state.revenue.workshops.push({
      title: data.get('title'),
      status: data.get('status'),
      target: Number(data.get('target')),
      date: todayKey()
    });
    form.reset();
    saveState();
    renderWorkshops();
    renderStrategicAssistants();
  });

  document.getElementById('training-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    state.revenue.trainings.push({
      topic: data.get('topic'),
      members: data.get('members'),
      friday: data.get('friday') === 'on',
      date: todayKey()
    });
    form.reset();
    saveState();
    renderTrainings();
  });

  document.getElementById('client-win-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    state.revenue.clientWins.push({
      client: data.get('client'),
      result: data.get('result'),
      date: todayKey()
    });
    form.reset();
    saveState();
    renderClientWins();
    renderStrategicAssistants();
  });

  document.getElementById('meeting-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.energy.meetings.push({
      title: data.get('title'),
      time: data.get('time'),
      energy: Number(data.get('energy')),
      date: todayKey()
    });
    event.target.reset();
    saveState();
    renderMeetings();
    renderDashboard();
    renderStrategicAssistants();
  });

  document.getElementById('focus-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.target);
    state.energy.focusBlocks.push({
      block: data.get('block'),
      start: data.get('start'),
      duration: Number(data.get('duration')),
      interruptions: Number(data.get('interruptions')),
      date: todayKey()
    });
    event.target.reset();
    saveState();
    renderFocusBlocks();
    renderStrategicAssistants();
  });

  document.querySelector('[data-action="save-power-hour"]').addEventListener('click', () => {
    const notes = document.getElementById('power-notes').value.trim();
    const active = state.energy.powerHours.find(p => p.active);
    if (active) {
      active.completed = true;
      active.active = false;
      active.end = new Date().toISOString();
      active.notes = notes;
      document.getElementById('power-notes').value = '';
    }
    saveState();
    renderPowerHour();
    renderStrategicAssistants();
  });

  document.querySelector('[data-action="save-sunday"]').addEventListener('click', () => {
    state.habits.sundayPlan = document.getElementById('sunday-plan').value;
    saveState();
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function startFast() {
  if (state.body.fasting.active) return;
  state.body.fasting.active = true;
  state.body.fasting.start = new Date().toISOString();
  saveState();
  renderFasting();
}

function startPowerHour() {
  if (state.energy.powerHours.some(p => p.active)) return;
  state.energy.powerHours.push({
    date: todayKey(),
    start: new Date().toISOString(),
    active: true,
    completed: false
  });
  saveState();
  renderPowerHour();
  renderDashboard();
}

function stopPowerHour() {
  const active = state.energy.powerHours.find(p => p.active);
  if (!active) return;
  active.active = false;
  active.end = new Date().toISOString();
  saveState();
  renderPowerHour();
}

function handleQuickActions() {
  const actions = {
    'start-documentation': () => {
      document.getElementById('documentation-entry').focus();
    },
    'log-recording': () => {
      document.querySelector('#recording-form input[name="title"]').focus();
    },
    'toggle-fast': () => startFast(),
    'log-meal': () => document.getElementById('meal-photo').click(),
    'log-workout': () => document.getElementById('workout-today').focus(),
    'log-client-win': () => document.querySelector('#client-win-form input[name="client"]').focus(),
    'add-workshop': () => document.querySelector('#workshop-form input[name="title"]').focus(),
    'log-training': () => document.querySelector('#training-form input[name="topic"]').focus(),
    'start-power-hour': () => startPowerHour(),
    'stop-power-hour': () => stopPowerHour(),
    'rate-meeting': () => document.querySelector('#meeting-form input[name="title"]').focus(),
    'log-deep-work': () => document.querySelector('#focus-form input[name="block"]').focus(),
    'quick-habit': () => {
      const firstIncomplete = Array.from(document.querySelectorAll('#habit-list input')).find(input => !input.checked);
      (firstIncomplete || document.querySelector('#habit-list input'))?.focus();
    },
    'sunday-setup': () => document.getElementById('sunday-plan').focus()
  };

  document.querySelectorAll('button[data-action]').forEach(button => {
    button.addEventListener('click', event => {
      const action = actions[button.dataset.action];
      if (action) {
        action();
      }
    });
  });
}

document.getElementById('toggle-ceo').addEventListener('click', event => {
  const enabled = appRoot.dataset.ceo === 'true';
  appRoot.dataset.ceo = enabled ? 'false' : 'true';
  event.currentTarget.setAttribute('aria-pressed', String(!enabled));
});

function tick() {
  renderFasting();
  renderPowerHour();
  checkNotifications();
}

function init() {
  resetDailyNotifications();
  handleFormSubmissions();
  handleQuickActions();
  render();
  document.getElementById('sunday-plan').value = state.habits.sundayPlan;
  setInterval(tick, 60 * 1000);
  setInterval(() => {
    if (state.body.fasting.active) {
      renderFasting();
    }
  }, 1000);
  tick();
}

window.addEventListener('DOMContentLoaded', init);
