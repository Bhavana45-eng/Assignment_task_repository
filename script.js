// script.js

// —— Theme Toggle & Persistence ——
const themeToggle = document.getElementById('theme-toggle');
const savedTheme  = localStorage.getItem('theme');
const defaultDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function initTheme() {
  const theme = savedTheme || (defaultDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}
initTheme();

themeToggle.addEventListener('click', () => {
  const curr = document.documentElement.getAttribute('data-theme');
  const next = curr === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  themeToggle.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
});

// —— Notification Utilities ——
const notifContainer = document.getElementById('notification-container');

function showNotification(msg, duration = 3000, type = '') {
  const div = document.createElement('div');
  div.className = 'notification';
  if (type) div.classList.add(type);
  div.textContent = msg;
  notifContainer.append(div);
  setTimeout(() => div.remove(), duration);
}

function notifyHighPriority(action, task) {
  if (task.priority === 'high') {
    showNotification(`🔥 High-priority task ${action}: "${task.title}"`, 5000, 'high-priority');
  }
}

function notifyUrgentTask(action, task) {
  if (task.category === 'Urgent') {
    showNotification(`🚨 Urgent task ${action}: "${task.title}"`, 5000, 'urgent');
  }
}

// —— OOP Classes ——
class Task {
  constructor(id, title, desc, priority, category, completed = false) {
    this.id = id;
    this.title = title;
    this.desc = desc;
    this.priority = priority;
    this.category = category;
    this.completed = completed;
  }
}

class TaskManager {
  constructor() {
    this.tasks = [];
    this.nextId = 1;
  }
  addTask(title, desc, priority, category) {
    const t = new Task(this.nextId++, title, desc, priority, category);
    this.tasks.push(t);
    return t;
  }
  updateTask(id, data) {
    const t = this.tasks.find(x => x.id === id);
    if (!t) return null;
    Object.assign(t, data);
    return t;
  }
  deleteTask(id) {
    this.tasks = this.tasks.filter(x => x.id !== id);
  }
  filter({ category, search, sort }) {
    let arr = [...this.tasks];
    if (category && category !== 'all') {
      arr = arr.filter(t => t.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q)
      );
    }
    if (sort === 'high' || sort === 'low') {
      const p = { low: 1, medium: 2, high: 3 };
      arr.sort((a,b) =>
        sort === 'high'
          ? p[b.priority] - p[a.priority]
          : p[a.priority] - p[b.priority]
      );
    }
    return arr;
  }
}

// —— App Logic ——
const mgr           = new TaskManager();
const form          = document.getElementById('task-form');
const listEl        = document.getElementById('task-list');
const filterCategory= document.getElementById('filter-category');
const sortPriority  = document.getElementById('sort-priority');
const searchInput   = document.getElementById('search');

function render() {
  const tasks = mgr.filter({
    category: filterCategory.value,
    search:   searchInput.value,
    sort:     sortPriority.value
  });
  listEl.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item' + (t.completed ? ' completed' : '');
    li.innerHTML = `
      <div class="task-details">
        <h3 class="title">${t.title}</h3>
        <p>${t.desc}</p>
        <small>
          <span class="badge priority-${t.priority}">
            ${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
          </span>
          <span class="badge">${t.category}</span>
        </small>
      </div>
      <div class="buttons">
        <button class="complete-btn">${t.completed ? 'Undo' : 'Done'}</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>`;
    // Delete
    li.querySelector('.delete-btn').onclick = () => {
      mgr.deleteTask(t.id);
      render();
      showNotification('Task deleted');
    };
    // Edit
    li.querySelector('.edit-btn').onclick = () => {
      document.getElementById('task-id').value    = t.id;
      document.getElementById('title').value      = t.title;
      document.getElementById('description').value= t.desc;
      document.getElementById('priority').value   = t.priority;
      document.getElementById('category').value   = t.category;
    };
    // Complete/Undo
    li.querySelector('.complete-btn').onclick = () => {
      const was = t.completed;
      const updated = mgr.updateTask(t.id, { completed: !was });
      render();
      notifyUrgentTask(was ? 'marked incomplete' : 'completed', updated);
      notifyHighPriority(was ? 'marked incomplete' : 'completed', updated);
      showNotification(was ? 'Marked incomplete' : 'Task completed');
    };

    listEl.append(li);
  });
}

// Form submit: Create or Update
form.addEventListener('submit', e => {
  e.preventDefault();
  const id       = +document.getElementById('task-id').value;
  const title    = document.getElementById('title').value.trim();
  const desc     = document.getElementById('description').value.trim();
  const priority = document.getElementById('priority').value;
  const category = document.getElementById('category').value;

  if (!title || !desc) {
    showNotification('Title & description required');
    return;
  }
  if (id) {
    const updated = mgr.updateTask(id, { title, desc, priority, category });
    notifyUrgentTask('updated', updated);
    notifyHighPriority('updated', updated);
    showNotification('Task updated');
  } else {
    const added = mgr.addTask(title, desc, priority, category);
    notifyUrgentTask('added', added);
    notifyHighPriority('added', added);
    showNotification('Task added');
  }
  form.reset();
  document.getElementById('task-id').value = '';
  render();
});

// Filters & Search
[filterCategory, sortPriority].forEach(el => el.addEventListener('change', render));
searchInput.addEventListener('input', render);

// Initial render
render();
