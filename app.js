// Data Manager
const DataManager = {
  init() {
    if (!localStorage.getItem('winterArcData')) {
      this.save({ 
        userName: null,
        startDate: null,
        habits: [], 
        completions: {} 
      });
    }
  },

  load() {
    return JSON.parse(localStorage.getItem('winterArcData') || '{"userName":null,"startDate":null,"habits":[],"completions":{}}');
  },

  save(data) {
    localStorage.setItem('winterArcData', JSON.stringify(data));
  },

  setUserName(name) {
    const data = this.load();
    data.userName = name;
    if (!data.startDate) {
      data.startDate = new Date().toISOString();
    }
    this.save(data);
  },

  getUserName() {
    return this.load().userName;
  },

  addHabit(name, category) {
    const data = this.load();
    const habit = {
      id: Date.now().toString(),
      name: name,
      category: category,
      created: new Date().toISOString()
    };
    data.habits.push(habit);
    this.save(data);
    return habit;
  },

  deleteHabit(id) {
    const data = this.load();
    data.habits = data.habits.filter(h => h.id !== id);
    Object.keys(data.completions).forEach(date => {
      data.completions[date] = data.completions[date].filter(hId => hId !== id);
    });
    this.save(data);
  },

  toggleCompletion(date, habitId) {
    const data = this.load();
    if (!data.completions[date]) {
      data.completions[date] = [];
    }
    
    const idx = data.completions[date].indexOf(habitId);
    if (idx > -1) {
      data.completions[date].splice(idx, 1);
    } else {
      data.completions[date].push(habitId);
    }
    
    this.save(data);
  },

  isCompleted(date, habitId) {
    const data = this.load();
    return data.completions[date]?.includes(habitId) || false;
  },

  getCategoryCount(category) {
    const data = this.load();
    return data.habits.filter(h => h.category === category).length;
  },

  resetData() {
    if (confirm('This will erase all experiment data. Continue?')) {
      localStorage.removeItem('winterArcData');
      location.reload();
    }
  }
};

// UI Manager
const UI = {
  messages: [
    "Discipline logged. Performance optimized.",
    "Protocol executed. Mission status: Active.",
    "Achievement recognized. Trajectory maintained.",
    "Systems nominal. Discipline protocol engaged.",
    "Task completed. Excellence threshold reached.",
    "Mission progress updated. Analysis: Positive.",
    "Consistency detected. Neural pathways reinforced.",
    "Another victory logged. Momentum accelerating."
  ],

  pendingHabitName: null,

  formatDate(date) {
    return date.toISOString().split('T')[0];
  },

  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  },

  updateGreeting() {
    const userName = DataManager.getUserName();
    const hour = new Date().getHours();
    let timeGreeting = "Welcome back";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    const greeting = userName ? `${timeGreeting}, ${userName}.` : `${timeGreeting}.`;
    document.getElementById('greeting').textContent = greeting;
  },

  updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', options);
  },

  renderTable() {
    const data = DataManager.load();
    const days = this.getLast7Days();
    
    const header = document.getElementById('tableHeader');
    header.innerHTML = '<th>Habit</th>';
    days.forEach(day => {
      const th = document.createElement('th');
      th.textContent = day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      header.appendChild(th);
    });

    const tbody = document.getElementById('habitBody');
    tbody.innerHTML = '';

    if (data.habits.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${days.length + 1}">
            <div class="empty-state">
              <div class="empty-state-icon">⚡</div>
              <div>No habits tracked yet. Deploy your first mission above.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    data.habits.forEach(habit => {
      const tr = document.createElement('tr');
      
      const nameTd = document.createElement('td');
      const categoryEmoji = {
        fitness: '💪',
        business: '💼',
        knowledge: '📚',
        faith: '🙏',
        mental: '🧠'
      };
      
      nameTd.innerHTML = `
        <div class="habit-name">
          <span>${categoryEmoji[habit.category]} ${habit.name}</span>
          <button class="delete-habit" onclick="App.deleteHabit('${habit.id}')">×</button>
        </div>
      `;
      tr.appendChild(nameTd);

      days.forEach(day => {
        const dateStr = this.formatDate(day);
        const td = document.createElement('td');
        const isChecked = DataManager.isCompleted(dateStr, habit.id);
        
        td.innerHTML = `
          <div class="checkbox-wrapper">
            <input 
              type="checkbox" 
              ${isChecked ? 'checked' : ''}
              onchange="App.toggleHabit('${dateStr}', '${habit.id}')"
            >
          </div>
        `;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  },

  updateStats() {
    const data = DataManager.load();
    const today = this.formatDate(new Date());
    const days = this.getLast7Days();

    // Today's stats
    const totalToday = data.habits.length;
    const completedToday = data.completions[today]?.length || 0;
    const todayPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    document.getElementById('todayPercent').textContent = todayPercent + '%';
    document.getElementById('todayProgress').style.width = todayPercent + '%';

    // Score system (total checkboxes in 7 days)
    const totalPossible = data.habits.length * 7;
    let totalCompleted = 0;
    
    days.forEach(day => {
      const dateStr = this.formatDate(day);
      totalCompleted += (data.completions[dateStr]?.length || 0);
    });

    const scorePercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    
    document.getElementById('scoreDisplay').textContent = `${totalCompleted}/${totalPossible}`;
    document.getElementById('scoreProgress').style.width = scorePercent + '%';
  },

  updateProfile() {
    const data = DataManager.load();
    const days = this.getLast7Days();
    
    // Basic info
    document.getElementById('profileName').textContent = data.userName || '—';
    
    if (data.startDate) {
      const start = new Date(data.startDate);
      document.getElementById('profileStart').textContent = start.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      const daysSince = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
      document.getElementById('profileDays').textContent = daysSince;
    }

    // Total completions
    let totalCompletions = 0;
    Object.values(data.completions).forEach(arr => {
      totalCompletions += arr.length;
    });
    document.getElementById('profileTotal').textContent = totalCompletions;

    // Streak calculation
    let streak = 0;
    const sortedDates = Object.keys(data.completions).sort().reverse();
    const today = this.formatDate(new Date());
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = this.formatDate(checkDate);
      
      if (data.completions[dateStr] && data.completions[dateStr].length > 0) {
        streak++;
      } else if (dateStr !== today) {
        break;
      }
    }
    
    document.getElementById('profileStreak').textContent = `${streak} days`;

    // Category counts
    const categories = ['fitness', 'business', 'knowledge', 'faith', 'mental'];
    categories.forEach(cat => {
      const count = DataManager.getCategoryCount(cat);
      document.getElementById(`cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`).textContent = count;
    });
  },

  showMessage() {
    const msg = this.messages[Math.floor(Math.random() * this.messages.length)];
    const el = document.getElementById('motivationMsg');
    el.textContent = msg;
    el.style.opacity = '0';
    setTimeout(() => el.style.opacity = '1', 50);
  },

  showWelcomeModal() {
    document.getElementById('welcomeModal').classList.add('active');
  },

  hideWelcomeModal() {
    document.getElementById('welcomeModal').classList.remove('active');
  },

  showCategoryModal() {
    document.getElementById('categoryModal').classList.add('active');
  },

  hideCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
  }
};

// App Controller
const App = {
  init() {
    DataManager.init();
    
    // Check if user has set their name
    if (!DataManager.getUserName()) {
      UI.showWelcomeModal();
    }
    
    UI.updateGreeting();
    UI.updateDate();
    UI.renderTable();
    UI.updateStats();
    UI.updateProfile();
    this.attachEvents();
  },

  attachEvents() {
    // Welcome modal
    document.getElementById('startBtn').addEventListener('click', () => {
      const name = document.getElementById('nameInput').value.trim();
      if (name) {
        DataManager.setUserName(name);
        UI.hideWelcomeModal();
        UI.updateGreeting();
        UI.updateProfile();
      }
    });

    // Add habit form
    document.getElementById('addHabitForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('habitInput');
      const name = input.value.trim();
      
      if (name) {
        UI.pendingHabitName = name;
        UI.showCategoryModal();
        input.value = '';
      }
    });

    // Category selection
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        if (UI.pendingHabitName) {
          DataManager.addHabit(UI.pendingHabitName, category);
          UI.pendingHabitName = null;
          UI.hideCategoryModal();
          UI.renderTable();
          UI.updateStats();
          UI.updateProfile();
        }
      });
    });

    // Burger menu
    document.getElementById('burgerBtn').addEventListener('click', () => {
      document.getElementById('sidePanel').classList.add('active');
      document.getElementById('overlay').classList.add('active');
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
      document.getElementById('sidePanel').classList.remove('active');
      document.getElementById('overlay').classList.remove('active');
    });

    document.getElementById('overlay').addEventListener('click', () => {
      document.getElementById('sidePanel').classList.remove('active');
      document.getElementById('overlay').classList.remove('active');
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
      DataManager.resetData();
    });
  },

  toggleHabit(date, habitId) {
    DataManager.toggleCompletion(date, habitId);
    UI.updateStats();
    UI.updateProfile();
    UI.showMessage();
  },

  deleteHabit(id) {
    if (confirm('Remove this habit from tracking?')) {
      DataManager.deleteHabit(id);
      UI.renderTable();
      UI.updateStats();
      UI.updateProfile();
    }
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => App.init());