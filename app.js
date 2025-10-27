// ============================================
// DATA SIMULATION (In-Memory Database)
// ============================================

let currentUser = null;
let timerInterval = null;
let timerState = {
  isRunning: false,
  startTime: null,
  elapsedSeconds: 0,
  subjectId: null
};

// Sample Data
const users = [
  {
    user_id: 1,
    username: 'demo',
    password: 'demo123',
    email: 'demo@focusflow.com',
    created_at: '2024-10-01 10:00:00'
  }
];

const subjects = [
  { subject_id: 1, user_id: 1, name: 'Calculus', color_code: '#ef4444' },
  { subject_id: 2, user_id: 1, name: 'Python Programming', color_code: '#3b82f6' },
  { subject_id: 3, user_id: 1, name: 'World History', color_code: '#10b981' },
  { subject_id: 4, user_id: 1, name: 'Biology', color_code: '#f59e0b' },
  { subject_id: 5, user_id: 1, name: 'Spanish', color_code: '#8b5cf6' }
];

const studySessions = [];
const goals = [
  {
    goal_id: 1,
    user_id: 1,
    subject_id: 1,
    goal_type: 'weekly',
    target_hours: 10,
    period_start: '2024-10-21',
    period_end: '2024-10-27',
    status: 'active'
  },
  {
    goal_id: 2,
    user_id: 1,
    subject_id: null,
    goal_type: 'monthly',
    target_hours: 40,
    period_start: '2024-10-01',
    period_end: '2024-10-31',
    status: 'active'
  }
];

let nextSessionId = 1;
let nextSubjectId = 6;
let nextGoalId = 3;

// Generate sample sessions
function generateSampleSessions() {
  const now = new Date();
  const sessions = [];
  
  for (let i = 0; i < 28; i++) {
    const sessionsPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < sessionsPerDay; j++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const hour = Math.floor(Math.random() * 12) + 8;
      const minute = Math.floor(Math.random() * 60);
      date.setHours(hour, minute, 0, 0);
      
      const duration = Math.floor(Math.random() * 120) + 15;
      const endDate = new Date(date.getTime() + duration * 60000);
      
      const subjectId = subjects[Math.floor(Math.random() * subjects.length)].subject_id;
      
      sessions.push({
        session_id: nextSessionId++,
        user_id: 1,
        subject_id: subjectId,
        start_time: formatDateTime(date),
        end_time: formatDateTime(endDate),
        duration_minutes: duration
      });
    }
  }
  
  studySessions.push(...sessions);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// ============================================
// AUTHENTICATION
// ============================================

function showLogin() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('register-page').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('register-page').style.display = 'flex';
}

function login(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initializeApp();
    showToast('Login successful!', 'success');
  } else {
    showToast('Invalid username or password', 'error');
  }
}

function register(username, email, password, confirmPassword) {
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  if (users.find(u => u.username === username)) {
    showToast('Username already exists', 'error');
    return;
  }
  
  const newUser = {
    user_id: users.length + 1,
    username,
    email,
    password,
    created_at: formatDateTime(new Date())
  };
  
  users.push(newUser);
  showToast('Registration successful! Please login.', 'success');
  showLogin();
}

function logout() {
  if (timerState.isRunning) {
    stopTimer();
  }
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  showToast('Logged out successfully', 'info');
}

// ============================================
// TIMER FUNCTIONALITY
// ============================================

function updateTimerDisplay() {
  document.getElementById('timer-display').textContent = formatTime(timerState.elapsedSeconds);
}

function startTimer() {
  const subjectSelect = document.getElementById('timer-subject');
  const subjectId = parseInt(subjectSelect.value);
  
  if (!subjectId) {
    showToast('Please select a subject', 'error');
    return;
  }
  
  timerState.isRunning = true;
  timerState.startTime = new Date();
  timerState.subjectId = subjectId;
  timerState.elapsedSeconds = 0;
  
  const subject = subjects.find(s => s.subject_id === subjectId);
  document.getElementById('active-subject-name').textContent = subject.name;
  document.getElementById('active-session-info').style.display = 'block';
  
  const timerBtn = document.getElementById('timer-btn');
  timerBtn.textContent = 'Stop';
  timerBtn.classList.remove('btn--primary');
  timerBtn.classList.add('btn--danger');
  
  timerInterval = setInterval(() => {
    timerState.elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
  
  showToast('Timer started', 'success');
}

function stopTimer() {
  if (!timerState.isRunning) return;
  
  clearInterval(timerInterval);
  
  const endTime = new Date();
  const duration = Math.floor(timerState.elapsedSeconds / 60);
  
  if (duration > 0) {
    const session = {
      session_id: nextSessionId++,
      user_id: currentUser.user_id,
      subject_id: timerState.subjectId,
      start_time: formatDateTime(timerState.startTime),
      end_time: formatDateTime(endTime),
      duration_minutes: duration
    };
    
    studySessions.push(session);
    showToast(`Session saved: ${duration} minutes`, 'success');
  }
  
  timerState.isRunning = false;
  timerState.startTime = null;
  timerState.elapsedSeconds = 0;
  timerState.subjectId = null;
  
  document.getElementById('active-session-info').style.display = 'none';
  document.getElementById('timer-display').textContent = '00:00:00';
  
  const timerBtn = document.getElementById('timer-btn');
  timerBtn.textContent = 'Start';
  timerBtn.classList.remove('btn--danger');
  timerBtn.classList.add('btn--primary');
  
  refreshDashboard();
  renderRecentSessions();
}

// ============================================
// DASHBOARD
// ============================================

function refreshDashboard() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const userSessions = studySessions.filter(s => s.user_id === currentUser.user_id);
  
  const last7Days = userSessions.filter(s => new Date(s.start_time) >= sevenDaysAgo)
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  
  const last30Days = userSessions.filter(s => new Date(s.start_time) >= thirtyDaysAgo)
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  
  const activeGoals = goals.filter(g => g.user_id === currentUser.user_id && g.status === 'active').length;
  
  document.getElementById('stat-7days').textContent = formatDuration(last7Days);
  document.getElementById('stat-30days').textContent = formatDuration(last30Days);
  document.getElementById('stat-goals').textContent = activeGoals;
  
  document.getElementById('welcome-message').textContent = `Welcome back, ${currentUser.username}!`;
}

function renderRecentSessions() {
  const tbody = document.querySelector('#recent-sessions-table tbody');
  tbody.innerHTML = '';
  
  const userSessions = studySessions
    .filter(s => s.user_id === currentUser.user_id)
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    .slice(0, 5);
  
  userSessions.forEach(session => {
    const subject = subjects.find(s => s.subject_id === session.subject_id);
    const date = new Date(session.start_time);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="subject-badge">
          <span class="subject-color" style="background: ${subject.color_code}"></span>
          ${subject.name}
        </div>
      </td>
      <td>${date.toLocaleDateString()}</td>
      <td>${formatDuration(session.duration_minutes)}</td>
    `;
    tbody.appendChild(row);
  });
  
  if (userSessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">No sessions yet</td></tr>';
  }
}

function populateSubjectDropdowns() {
  const userSubjects = subjects.filter(s => s.user_id === currentUser.user_id);
  
  const dropdowns = [
    'timer-subject',
    'session-subject',
    'filter-subject',
    'goal-subject'
  ];
  
  dropdowns.forEach(id => {
    const select = document.getElementById(id);
    const currentValue = select.value;
    const options = Array.from(select.options).filter(opt => opt.value === '');
    
    select.innerHTML = options.map(opt => opt.outerHTML).join('');
    
    userSubjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.subject_id;
      option.textContent = subject.name;
      select.appendChild(option);
    });
    
    if (currentValue) select.value = currentValue;
  });
}

// ============================================
// SUBJECTS
// ============================================

function renderSubjects() {
  const grid = document.getElementById('subjects-grid');
  grid.innerHTML = '';
  
  const userSubjects = subjects.filter(s => s.user_id === currentUser.user_id);
  
  userSubjects.forEach(subject => {
    const totalTime = studySessions
      .filter(s => s.subject_id === subject.subject_id)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="subject-card-header">
        <div class="subject-card-color" style="background: ${subject.color_code}"></div>
        <div class="subject-card-name">${subject.name}</div>
      </div>
      <div class="subject-card-stats">Total: ${formatDuration(totalTime)}</div>
      <div class="subject-card-actions">
        <button class="btn btn--secondary" onclick="editSubject(${subject.subject_id})">Edit</button>
        <button class="btn btn--danger" onclick="confirmDeleteSubject(${subject.subject_id})">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
  
  if (userSubjects.length === 0) {
    grid.innerHTML = '<p class="text-center">No subjects yet. Add your first subject to get started!</p>';
  }
}

function showSubjectModal(subjectId = null) {
  const modal = document.getElementById('subject-modal');
  const title = document.getElementById('subject-modal-title');
  const nameInput = document.getElementById('subject-name');
  const idInput = document.getElementById('subject-id');
  const colorInput = document.getElementById('subject-color');
  
  if (subjectId) {
    const subject = subjects.find(s => s.subject_id === subjectId);
    title.textContent = 'Edit Subject';
    nameInput.value = subject.name;
    idInput.value = subject.subject_id;
    colorInput.value = subject.color_code;
    
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.color === subject.color_code);
    });
  } else {
    title.textContent = 'Add Subject';
    nameInput.value = '';
    idInput.value = '';
    colorInput.value = '#ef4444';
    
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.color === '#ef4444');
    });
  }
  
  openModal('subject-modal');
}

function saveSubject(e) {
  e.preventDefault();
  
  const name = document.getElementById('subject-name').value;
  const color = document.getElementById('subject-color').value;
  const id = document.getElementById('subject-id').value;
  
  if (id) {
    const subject = subjects.find(s => s.subject_id === parseInt(id));
    subject.name = name;
    subject.color_code = color;
    showToast('Subject updated', 'success');
  } else {
    const newSubject = {
      subject_id: nextSubjectId++,
      user_id: currentUser.user_id,
      name,
      color_code: color
    };
    subjects.push(newSubject);
    showToast('Subject added', 'success');
  }
  
  closeModal('subject-modal');
  renderSubjects();
  populateSubjectDropdowns();
}

function editSubject(subjectId) {
  showSubjectModal(subjectId);
}

function confirmDeleteSubject(subjectId) {
  currentDeleteId = subjectId;
  currentDeleteType = 'subject';
  document.getElementById('confirm-message').textContent = 'Are you sure you want to delete this subject? All associated sessions will remain but show as "Unknown Subject".';
  openModal('confirm-modal');
}

function deleteSubject(subjectId) {
  const index = subjects.findIndex(s => s.subject_id === subjectId);
  if (index > -1) {
    subjects.splice(index, 1);
    showToast('Subject deleted', 'success');
    renderSubjects();
    populateSubjectDropdowns();
  }
}

// ============================================
// SESSIONS
// ============================================

function renderSessions(filterSubjectId = null, filterDateFrom = null, filterDateTo = null) {
  const tbody = document.querySelector('#sessions-table tbody');
  tbody.innerHTML = '';
  
  let userSessions = studySessions.filter(s => s.user_id === currentUser.user_id);
  
  if (filterSubjectId) {
    userSessions = userSessions.filter(s => s.subject_id === parseInt(filterSubjectId));
  }
  
  if (filterDateFrom) {
    const fromDate = new Date(filterDateFrom);
    userSessions = userSessions.filter(s => new Date(s.start_time) >= fromDate);
  }
  
  if (filterDateTo) {
    const toDate = new Date(filterDateTo);
    toDate.setHours(23, 59, 59);
    userSessions = userSessions.filter(s => new Date(s.start_time) <= toDate);
  }
  
  userSessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  
  userSessions.forEach(session => {
    const subject = subjects.find(s => s.subject_id === session.subject_id);
    const startDate = new Date(session.start_time);
    const endDate = new Date(session.end_time);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="subject-badge">
          <span class="subject-color" style="background: ${subject ? subject.color_code : '#888'}"></span>
          ${subject ? subject.name : 'Unknown'}
        </div>
      </td>
      <td>${startDate.toLocaleDateString()}</td>
      <td>${startDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
      <td>${endDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
      <td>${formatDuration(session.duration_minutes)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon" onclick="editSession(${session.session_id})" title="Edit">✏️</button>
          <button class="btn-icon" onclick="confirmDeleteSession(${session.session_id})" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  if (userSessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No sessions found</td></tr>';
  }
}

function showSessionModal(sessionId = null) {
  const modal = document.getElementById('session-modal');
  const title = document.getElementById('session-modal-title');
  const subjectSelect = document.getElementById('session-subject');
  const dateInput = document.getElementById('session-date');
  const startInput = document.getElementById('session-start');
  const endInput = document.getElementById('session-end');
  const idInput = document.getElementById('session-id');
  
  if (sessionId) {
    const session = studySessions.find(s => s.session_id === sessionId);
    title.textContent = 'Edit Session';
    subjectSelect.value = session.subject_id;
    
    const startDate = new Date(session.start_time);
    dateInput.value = formatDate(startDate);
    startInput.value = startDate.toTimeString().slice(0, 5);
    
    const endDate = new Date(session.end_time);
    endInput.value = endDate.toTimeString().slice(0, 5);
    
    idInput.value = session.session_id;
  } else {
    title.textContent = 'Manual Session Entry';
    subjectSelect.value = '';
    dateInput.value = formatDate(new Date());
    startInput.value = '';
    endInput.value = '';
    idInput.value = '';
  }
  
  openModal('session-modal');
}

function saveSession(e) {
  e.preventDefault();
  
  const subjectId = parseInt(document.getElementById('session-subject').value);
  const date = document.getElementById('session-date').value;
  const startTime = document.getElementById('session-start').value;
  const endTime = document.getElementById('session-end').value;
  const sessionId = document.getElementById('session-id').value;
  
  if (!subjectId || !date || !startTime || !endTime) {
    showToast('Please fill all fields', 'error');
    return;
  }
  
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);
  
  if (endDateTime <= startDateTime) {
    showToast('End time must be after start time', 'error');
    return;
  }
  
  const duration = Math.floor((endDateTime - startDateTime) / 60000);
  
  if (sessionId) {
    const session = studySessions.find(s => s.session_id === parseInt(sessionId));
    session.subject_id = subjectId;
    session.start_time = formatDateTime(startDateTime);
    session.end_time = formatDateTime(endDateTime);
    session.duration_minutes = duration;
    showToast('Session updated', 'success');
  } else {
    const newSession = {
      session_id: nextSessionId++,
      user_id: currentUser.user_id,
      subject_id: subjectId,
      start_time: formatDateTime(startDateTime),
      end_time: formatDateTime(endDateTime),
      duration_minutes: duration
    };
    studySessions.push(newSession);
    showToast('Session added', 'success');
  }
  
  closeModal('session-modal');
  renderSessions();
  refreshDashboard();
  renderRecentSessions();
}

function editSession(sessionId) {
  showSessionModal(sessionId);
}

function confirmDeleteSession(sessionId) {
  currentDeleteId = sessionId;
  currentDeleteType = 'session';
  document.getElementById('confirm-message').textContent = 'Are you sure you want to delete this session?';
  openModal('confirm-modal');
}

function deleteSession(sessionId) {
  const index = studySessions.findIndex(s => s.session_id === sessionId);
  if (index > -1) {
    studySessions.splice(index, 1);
    showToast('Session deleted', 'success');
    renderSessions();
    refreshDashboard();
    renderRecentSessions();
  }
}

function applyFilters() {
  const subjectId = document.getElementById('filter-subject').value;
  const dateFrom = document.getElementById('filter-date-from').value;
  const dateTo = document.getElementById('filter-date-to').value;
  renderSessions(subjectId, dateFrom, dateTo);
}

// ============================================
// STATISTICS
// ============================================

function renderStatistics() {
  const userSessions = studySessions.filter(s => s.user_id === currentUser.user_id);
  
  // Calculate stats
  const totalMinutes = userSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  
  const uniqueDays = new Set(userSessions.map(s => s.start_time.split(' ')[0])).size;
  const avgDaily = uniqueDays > 0 ? Math.floor(totalMinutes / uniqueDays) : 0;
  
  // Most studied subject
  const subjectTotals = {};
  userSessions.forEach(s => {
    subjectTotals[s.subject_id] = (subjectTotals[s.subject_id] || 0) + s.duration_minutes;
  });
  
  let mostStudiedSubject = '-';
  let maxMinutes = 0;
  for (const [subjectId, minutes] of Object.entries(subjectTotals)) {
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      const subject = subjects.find(s => s.subject_id === parseInt(subjectId));
      mostStudiedSubject = subject ? subject.name : '-';
    }
  }
  
  // Calculate streak
  const sortedSessions = userSessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let checkDate = new Date(today);
  
  while (true) {
    const dateStr = formatDate(checkDate);
    const hasSession = sortedSessions.some(s => s.start_time.startsWith(dateStr));
    
    if (hasSession) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (checkDate.getTime() === today.getTime()) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Update display
  document.getElementById('total-study-time').textContent = `${totalHours}h`;
  document.getElementById('avg-daily-time').textContent = formatDuration(avgDaily);
  document.getElementById('most-studied-subject').textContent = mostStudiedSubject;
  document.getElementById('current-streak').textContent = `${streak} days`;
  
  renderHeatmap();
  renderSubjectChart();
}

function renderHeatmap() {
  const container = document.getElementById('heatmap-container');
  container.innerHTML = '';
  
  const today = new Date();
  const userSessions = studySessions.filter(s => s.user_id === currentUser.user_id);
  
  // Calculate daily totals for last 30 days
  const dailyTotals = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    dailyTotals[dateStr] = 0;
  }
  
  userSessions.forEach(session => {
    const dateStr = session.start_time.split(' ')[0];
    if (dailyTotals.hasOwnProperty(dateStr)) {
      dailyTotals[dateStr] += session.duration_minutes;
    }
  });
  
  // Create heatmap
  const dates = Object.keys(dailyTotals).sort();
  dates.forEach(dateStr => {
    const minutes = dailyTotals[dateStr];
    const hours = minutes / 60;
    
    let intensity = 'rgba(99, 102, 241, 0.1)';
    if (hours >= 4) intensity = 'rgba(99, 102, 241, 1)';
    else if (hours >= 3) intensity = 'rgba(99, 102, 241, 0.7)';
    else if (hours >= 2) intensity = 'rgba(99, 102, 241, 0.5)';
    else if (hours >= 1) intensity = 'rgba(99, 102, 241, 0.3)';
    
    const day = document.createElement('div');
    day.className = 'heatmap-day';
    day.style.background = intensity;
    day.dataset.tooltip = `${dateStr}: ${formatDuration(minutes)}`;
    day.textContent = new Date(dateStr).getDate();
    container.appendChild(day);
  });
  
  // Add legend
  const legend = document.createElement('div');
  legend.className = 'heatmap-legend';
  legend.innerHTML = `
    <span>Less</span>
    <div class="legend-item"><div class="legend-box" style="background: rgba(99, 102, 241, 0.1)"></div></div>
    <div class="legend-item"><div class="legend-box" style="background: rgba(99, 102, 241, 0.3)"></div></div>
    <div class="legend-item"><div class="legend-box" style="background: rgba(99, 102, 241, 0.5)"></div></div>
    <div class="legend-item"><div class="legend-box" style="background: rgba(99, 102, 241, 0.7)"></div></div>
    <div class="legend-item"><div class="legend-box" style="background: rgba(99, 102, 241, 1)"></div></div>
    <span>More</span>
  `;
  container.appendChild(legend);
}

let subjectChartInstance = null;

function renderSubjectChart() {
  const period = document.getElementById('chart-period').value;
  const now = new Date();
  let filterDate = null;
  
  if (period === '7') {
    filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30') {
    filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  let userSessions = studySessions.filter(s => s.user_id === currentUser.user_id);
  if (filterDate) {
    userSessions = userSessions.filter(s => new Date(s.start_time) >= filterDate);
  }
  
  const subjectTotals = {};
  const subjectColors = {};
  
  userSessions.forEach(session => {
    const subject = subjects.find(s => s.subject_id === session.subject_id);
    if (subject) {
      subjectTotals[subject.name] = (subjectTotals[subject.name] || 0) + session.duration_minutes;
      subjectColors[subject.name] = subject.color_code;
    }
  });
  
  const labels = Object.keys(subjectTotals);
  const data = Object.values(subjectTotals).map(m => Math.round(m / 60 * 10) / 10);
  const colors = labels.map(label => subjectColors[label]);
  
  const ctx = document.getElementById('subject-chart').getContext('2d');
  
  if (subjectChartInstance) {
    subjectChartInstance.destroy();
  }
  
  subjectChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#252836'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e5e7eb',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.parsed}h`;
            }
          }
        }
      }
    }
  });
}

// ============================================
// GOALS
// ============================================

function renderGoals() {
  const activeList = document.getElementById('active-goals-list');
  const completedList = document.getElementById('completed-goals-list');
  
  activeList.innerHTML = '';
  completedList.innerHTML = '';
  
  const userGoals = goals.filter(g => g.user_id === currentUser.user_id);
  
  userGoals.forEach(goal => {
    const card = createGoalCard(goal);
    if (goal.status === 'active') {
      activeList.appendChild(card);
    } else {
      completedList.appendChild(card);
    }
  });
  
  if (activeList.children.length === 0) {
    activeList.innerHTML = '<p class="text-center">No active goals. Create one to get started!</p>';
  }
  
  if (completedList.children.length === 0) {
    completedList.innerHTML = '<p class="text-center">No completed goals yet.</p>';
  }
}

function createGoalCard(goal) {
  const card = document.createElement('div');
  card.className = 'goal-card';
  
  const subjectName = goal.subject_id 
    ? subjects.find(s => s.subject_id === goal.subject_id)?.name || 'Unknown'
    : 'All Subjects';
  
  const startDate = new Date(goal.period_start);
  const endDate = new Date(goal.period_end);
  const now = new Date();
  
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  // Calculate progress
  let totalMinutes = 0;
  const sessions = studySessions.filter(s => {
    const sessionDate = new Date(s.start_time);
    const matchesUser = s.user_id === currentUser.user_id;
    const matchesSubject = !goal.subject_id || s.subject_id === goal.subject_id;
    const inPeriod = sessionDate >= startDate && sessionDate <= endDate;
    return matchesUser && matchesSubject && inPeriod;
  });
  
  totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const currentHours = Math.round(totalMinutes / 60 * 10) / 10;
  const percentage = Math.min(Math.round((currentHours / goal.target_hours) * 100), 100);
  
  let progressClass = 'low';
  if (percentage >= 80) progressClass = 'high';
  else if (percentage >= 50) progressClass = 'medium';
  
  card.innerHTML = `
    <div class="goal-header">
      <div class="goal-info">
        <h4>${subjectName} - ${goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal</h4>
        <div class="goal-meta">
          Target: ${goal.target_hours} hours | ${daysRemaining > 0 ? daysRemaining + ' days remaining' : 'Expired'}
        </div>
      </div>
    </div>
    <div class="goal-progress">
      <div class="progress-bar-container">
        <div class="progress-bar ${progressClass}" style="width: ${percentage}%">
          ${percentage}%
        </div>
      </div>
      <div class="progress-text">${currentHours}h / ${goal.target_hours}h</div>
    </div>
  `;
  
  return card;
}

function showGoalModal() {
  const today = new Date();
  document.getElementById('goal-start').value = formatDate(today);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('goal-end').value = formatDate(nextWeek);
  
  document.getElementById('goal-type').value = 'weekly';
  document.getElementById('goal-subject').value = '';
  document.getElementById('goal-target').value = '';
  
  openModal('goal-modal');
}

function saveGoal(e) {
  e.preventDefault();
  
  const type = document.getElementById('goal-type').value;
  const subjectId = document.getElementById('goal-subject').value;
  const target = parseInt(document.getElementById('goal-target').value);
  const start = document.getElementById('goal-start').value;
  const end = document.getElementById('goal-end').value;
  
  if (!target || !start || !end) {
    showToast('Please fill all required fields', 'error');
    return;
  }
  
  const newGoal = {
    goal_id: nextGoalId++,
    user_id: currentUser.user_id,
    subject_id: subjectId ? parseInt(subjectId) : null,
    goal_type: type,
    target_hours: target,
    period_start: start,
    period_end: end,
    status: 'active'
  };
  
  goals.push(newGoal);
  showToast('Goal created', 'success');
  closeModal('goal-modal');
  renderGoals();
  refreshDashboard();
}

// ============================================
// PROFILE
// ============================================

function renderProfile() {
  document.getElementById('profile-username').textContent = currentUser.username;
  document.getElementById('profile-email').textContent = currentUser.email;
  
  const createdDate = new Date(currentUser.created_at);
  document.getElementById('profile-created').textContent = createdDate.toLocaleDateString();
  
  const userSessions = studySessions.filter(s => s.user_id === currentUser.user_id);
  const userSubjects = subjects.filter(s => s.user_id === currentUser.user_id);
  const totalMinutes = userSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  
  document.getElementById('profile-sessions').textContent = userSessions.length;
  document.getElementById('profile-subjects').textContent = userSubjects.length;
  document.getElementById('profile-hours').textContent = `${totalHours}h`;
}

// ============================================
// NAVIGATION
// ============================================

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active-view');
  });
  
  document.getElementById(`${viewName}-view`).classList.add('active-view');
  
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
  
  const titles = {
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    sessions: 'Study Sessions',
    statistics: 'Statistics',
    goals: 'Goals',
    profile: 'Profile'
  };
  
  document.getElementById('page-title').textContent = titles[viewName];
  
  // Render view-specific content
  if (viewName === 'subjects') renderSubjects();
  else if (viewName === 'sessions') renderSessions();
  else if (viewName === 'statistics') renderStatistics();
  else if (viewName === 'goals') renderGoals();
  else if (viewName === 'profile') renderProfile();
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('active');
  }
}

// ============================================
// INITIALIZATION
// ============================================

function updateDateTime() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  document.getElementById('current-datetime').textContent = now.toLocaleDateString('en-US', options);
}

function initializeApp() {
  populateSubjectDropdowns();
  refreshDashboard();
  renderRecentSessions();
  updateDateTime();
  setInterval(updateDateTime, 60000);
  
  // Initialize color picker
  const colorPicker = document.getElementById('color-picker');
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  
  colors.forEach(color => {
    const option = document.createElement('div');
    option.className = 'color-option';
    option.style.background = color;
    option.dataset.color = color;
    option.onclick = function() {
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('subject-color').value = color;
    };
    colorPicker.appendChild(option);
  });
}

let currentDeleteId = null;
let currentDeleteType = null;

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  generateSampleSessions();
  
  // Auth forms
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    login(username, password);
  });
  
  document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    register(username, email, password, confirmPassword);
  });
  
  document.getElementById('show-register').addEventListener('click', function(e) {
    e.preventDefault();
    showRegister();
  });
  
  document.getElementById('show-login').addEventListener('click', function(e) {
    e.preventDefault();
    showLogin();
  });
  
  // Navigation
  document.querySelectorAll('.menu-item[data-view]').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      switchView(this.dataset.view);
    });
  });
  
  document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
  
  // Mobile menu
  document.getElementById('menu-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
  });
  
  document.getElementById('close-sidebar').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('active');
  });
  
  // Timer
  document.getElementById('timer-btn').addEventListener('click', function() {
    if (timerState.isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  });
  
  // Subject modal
  document.getElementById('add-subject-btn').addEventListener('click', () => showSubjectModal());
  document.getElementById('subject-form').addEventListener('submit', saveSubject);
  
  // Session modal
  document.getElementById('manual-entry-btn').addEventListener('click', () => showSessionModal());
  document.getElementById('session-form').addEventListener('submit', saveSession);
  
  // Goal modal
  document.getElementById('create-goal-btn').addEventListener('click', showGoalModal);
  document.getElementById('goal-form').addEventListener('submit', saveGoal);
  
  // Filters
  document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
  
  // Chart period selector
  document.getElementById('chart-period').addEventListener('change', renderSubjectChart);
  
  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.modal').classList.remove('active');
    });
  });
  
  // Confirm delete
  document.getElementById('confirm-delete-btn').addEventListener('click', function() {
    if (currentDeleteType === 'subject') {
      deleteSubject(currentDeleteId);
    } else if (currentDeleteType === 'session') {
      deleteSession(currentDeleteId);
    }
    closeModal('confirm-modal');
  });
  
  // Close modal on background click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });
});