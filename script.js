// FRONTEND JS: interacts with backend API and implements reminder notifications
const API_BASE = '/api'; // served from same origin when backend serves frontend

// Auth elements
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authBtn = document.getElementById('authBtn');
const toggleLink = document.getElementById('toggleLink');
const authTitle = document.getElementById('authTitle');
let isLogin = true;

// Notes UI elements
const noteText = document.getElementById('noteText');
const addNoteBtn = document.getElementById('addNoteBtn');
const colorInput = document.getElementById('colorInput');
const categoryInput = document.getElementById('categoryInput');
const reminderInput = document.getElementById('reminderInput');
const notesContainer = document.getElementById('notesContainer');
const searchBox = document.getElementById('searchBox');
const categoryFilter = document.getElementById('categoryFilter');
const pinnedOnly = document.getElementById('pinnedOnly');
const themeToggle = document.querySelector('.theme-toggle');

// Helpers
const tokenKey = 'ns_token';
function getToken(){ return localStorage.getItem(tokenKey); }
function setToken(t){ localStorage.setItem(tokenKey,t); }
function removeToken(){ localStorage.removeItem(tokenKey); }

// Toggle login/signup
toggleLink.onclick = () => {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? 'Login' : 'Signup';
  nameInput.style.display = isLogin ? 'none' : 'block';
  authBtn.textContent = isLogin ? 'Login' : 'Signup';
};

// Auth
authBtn.onclick = async () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  try {
    const url = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
    const body = isLogin ? { email, password } : { name, email, password };
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return alert(data.msg || 'Auth failed');
    setToken(data.token);
    alert('Logged in');
    await loadNotes();
    startReminderPolling();
  } catch (err){ console.error(err); alert('Error'); }
};

// Load notes
async function loadNotes(){
  if (!getToken()) return;
  try{
    const res = await fetch(`${API_BASE}/notes`, { headers:{ 'x-auth-token': getToken() } });
    const notes = await res.json();
    renderNotes(notes);
    populateCategories(notes);
  }catch(err){ console.error(err); }
}

function renderNotes(notes){
  const filter = (searchBox.value || '').toLowerCase();
  notesContainer.innerHTML = '';
  notes.filter(n => {
    if (pinnedOnly.checked && !n.pinned) return false;
    if (categoryFilter.value && n.category !== categoryFilter.value) return false;
    return n.text.toLowerCase().includes(filter);
  }).forEach(n => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.style.background = n.color || '#fff';
    card.innerHTML = `
      <div class="meta"><strong>${n.category}</strong><small>${new Date(n.createdAt).toLocaleString()}</small></div>
      <div class="text">${escapeHtml(n.text)}</div>
      <div class="note-actions">
        <button class="pin">${n.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </div>
    `;

    card.querySelector('.pin').onclick = async () => {
      await updateNote(n._id, { pinned: !n.pinned }); loadNotes();
    };
    card.querySelector('.edit').onclick = async () => {
      const updated = prompt('Edit note', n.text);
      if (updated !== null) { await updateNote(n._id, { text: updated }); loadNotes(); }
    };
    card.querySelector('.delete').onclick = async () => { if (confirm('Delete note?')) { await deleteNote(n._id); loadNotes(); } };

    notesContainer.appendChild(card);
  });
}

function populateCategories(notes){
  const categories = Array.from(new Set(notes.map(n => n.category || 'General')));
  categoryFilter.innerHTML = '<option value="">All categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Add note
addNoteBtn.onclick = async () => {
  if (!getToken()) return alert('Please login first');
  const body = {
    text: noteText.value.trim(),
    color: colorInput.value,
    category: categoryInput.value || 'General',
    reminder: reminderInput.value ? new Date(reminderInput.value).toISOString() : null
  };
  if (!body.text) return alert('Note text required');
  await fetch(`${API_BASE}/notes`, { method:'POST', headers:{ 'Content-Type':'application/json', 'x-auth-token': getToken() }, body: JSON.stringify(body) });
  noteText.value=''; categoryInput.value=''; reminderInput.value=''; loadNotes();
};

// Update note helper
async function updateNote(id, patch){
  await fetch(`${API_BASE}/notes/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json','x-auth-token':getToken() }, body: JSON.stringify(patch) });
}

async function deleteNote(id){
  await fetch(`${API_BASE}/notes/${id}`, { method:'DELETE', headers:{ 'x-auth-token': getToken() } });
}

searchBox.addEventListener('input', loadNotes);
pinnedOnly.addEventListener('change', loadNotes);
categoryFilter.addEventListener('change', loadNotes);

// Theme toggle
themeToggle.onclick = () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
};

// Escape helper
function escapeHtml(text){
  const p = document.createElement('p'); p.textContent = text; return p.innerHTML;
}

// REMINDERS: polling endpoint and Notification API
let reminderInterval = null;
function startReminderPolling(){
  // request permission for notifications
  if (Notification && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }

  if (reminderInterval) clearInterval(reminderInterval);
  // Poll every 60 seconds
  reminderInterval = setInterval(checkReminders, 60 * 1000);
  // also run once immediately
  checkReminders();
}

async function checkReminders(){
  if (!getToken()) return;
  try{
    const res = await fetch(`${API_BASE}/notes/reminders/upcoming`, { headers:{ 'x-auth-token': getToken() } });
    if (!res.ok) return;
    const upcoming = await res.json();
    upcoming.forEach(n => {
      showReminderNotification(n);
    });
  }catch(err){ console.error('Reminder error', err); }
}

function showReminderNotification(note){
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const title = 'NoteSpace Reminder';
  const options = {
    body: note.text.length > 120 ? note.text.slice(0,120) + '...' : note.text,
    tag: 'notespace-reminder-' + note._id,
    renotify: false
  };
  new Notification(title, options);
}

// Start polling if token exists
if (getToken()) {
  loadNotes();
  startReminderPolling();
}
