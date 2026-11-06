// =======================================================================
// ===== SCRIPT CALENDARIO.JS - VERSÃO COMPLETA E AUTÔNOMA =====
// =======================================================================

// --- 1. IMPORTS E SETUP DO FIREBASE ---
import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged } from "./firebase-demo.js";
import { getDatabase, ref, get, set, push, remove } from "./firebase-demo.js";

  const firebaseConfig = {
    apiKey: "AIzaSyBdXV5FGtIgGulzCoOGO7humceFOmA5KVU",
    authDomain: "alphaedu-1a738.firebaseapp.com",
    databaseURL: "https://alphaedu-1a738-default-rtdb.firebaseio.com/",
    projectId: "alphaedu-1a738",
    storageBucket: "alphaedu-1a738.firebasestorage.app",
    messagingSenderId: "570881564591",
    appId: "1:570881564591:web:60c1ed6f8aaa414b27995a",
    measurementId: "G-M36B97ZQVY"
  };

const app = initializeApp(firebaseConfig );
const auth = getAuth(app);
const db = getDatabase(app);

// --- 2. LÓGICA GLOBAL (SIDEBAR, PERFIL, AUTH) ---
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI Global
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileAvatar = document.querySelector('.profile-avatar');
    const profileUsername = document.querySelector('.profile-info .username');
    const profileEmail = document.querySelector('.profile-info .email');
    const dropdownUsername = document.querySelector('#profile-dropdown .username');
    const dropdownEmail = document.querySelector('#profile-dropdown .email');
    const leaveClassBtn = document.getElementById('leave-class-btn');

    // Lógica para abrir/fechar a sidebar
    if (toggleBtn && sidebar && mainContent) {
        const setSidebarState = (isHidden) => {
            sidebar.classList.toggle('hidden', isHidden);
            mainContent.style.paddingLeft = isHidden ? '118px' : '290px'; // (88px + 30px) e (260px + 30px)
            localStorage.setItem('sidebarState', isHidden ? 'hidden' : 'visible');
        };

        toggleBtn.addEventListener('click', () => {
            setSidebarState(!sidebar.classList.contains('hidden'));
        });

        const savedState = localStorage.getItem('sidebarState');
        setSidebarState(savedState === 'hidden');
    }

    // Lógica do menu de perfil
    if (profileMenuButton) {
        profileMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
    }
    window.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.classList.remove('show');
    });

    // Autenticação e carregamento de dados do usuário
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            lucide.createIcons();
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const username = userData.username || 'Usuário';
                const email = user.email;
                const avatarInitials = (username[0] || 'U') + (username.split(' ')[1]?.[0] || '');

                if (profileAvatar) profileAvatar.textContent = avatarInitials;
                if (profileUsername) profileUsername.textContent = username;
                if (profileEmail) profileEmail.textContent = email;
                if (dropdownUsername) dropdownUsername.textContent = username;
                if (dropdownEmail) dropdownEmail.textContent = email;
                if (leaveClassBtn) leaveClassBtn.style.display = userData.classCode ? 'flex' : 'none';
            }
            // Inicializa a lógica específica do calendário
            initializeCalendar(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- 3. LÓGICA ESPECÍFICA DO CALENDÁRIO ---
function initializeCalendar(user) {
    const monthYearEl = document.getElementById('month-year');
    const daysEl = document.getElementById('calendar-days');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const eventsTitleEl = document.getElementById('events-title');
    const eventListEl = document.getElementById('event-list');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventDateInput = document.getElementById('event-date');
    const eventTypeInput = document.getElementById('event-type');
    const eventDescInput = document.getElementById('event-desc');
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const closeConfirmModalBtn = document.getElementById('close-confirm-modal-btn');

    let currentDate = new Date();
    let selectedDate = new Date();
    let events = {};
    let eventIdToDelete = null;
    let editingEventId = null;

    const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

    const fetchEvents = async () => {
        const eventsRef = ref(db, `users/${user.uid}/calendarEvents`);
        const snapshot = await get(eventsRef);
        events = snapshot.exists() ? snapshot.val() : {};
        renderCalendar();
        renderEventsForDate(selectedDate);
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearEl.textContent = `${monthNames[month]} ${year}`;
        daysEl.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();

        for (let i = firstDay; i > 0; i--) {
            daysEl.innerHTML += `<div class="day other-month">${prevLastDate - i + 1}</div>`;
        }

        for (let i = 1; i <= lastDate; i++) {
            const dayDate = new Date(year, month, i);
            const dateString = dayDate.toISOString().split('T')[0];
            let classes = 'day';
            if (dayDate.toDateString() === new Date().toDateString()) classes += ' today';
            if (dayDate.toDateString() === selectedDate.toDateString()) classes += ' selected';

            const dayHasEvent = Object.values(events).some(event => event.date === dateString);
            const eventDot = dayHasEvent ? '<div class="event-dot"></div>' : '';

            daysEl.innerHTML += `<div class="${classes}" data-date="${dateString}">${i}${eventDot}</div>`;
        }

        document.querySelectorAll('.day').forEach(day => {
            day.addEventListener('click', (e) => {
                if (e.currentTarget.dataset.date) {
                    selectedDate = new Date(e.currentTarget.dataset.date + 'T00:00:00');
                    renderCalendar();
                    renderEventsForDate(selectedDate);
                }
            });
        });
    };

    const renderEventsForDate = (date) => {
        const dateString = date.toISOString().split('T')[0];
        eventsTitleEl.textContent = `Eventos para ${date.toLocaleDateString('pt-BR')}`;
        eventListEl.innerHTML = '';

        const dayEvents = Object.entries(events)
            .filter(([, event]) => event.date === dateString)
            .sort(([, a], [, b]) => a.title.localeCompare(b.title));

        if (dayEvents.length === 0) {
            eventListEl.innerHTML = '<p>Nenhum evento para este dia.</p>';
            return;
        }

        dayEvents.forEach(([id, event]) => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-type">${event.type}</div>
                <h4 class="event-title">${event.title}</h4>
                ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                <div class="event-card-footer">
                    <button class="event-action-btn edit" data-id="${id}"><i data-lucide="edit"></i></button>
                    <button class="event-action-btn delete" data-id="${id}"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            eventListEl.appendChild(card);
        });

        lucide.createIcons();

        document.querySelectorAll('.event-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => handleEditEvent(btn.dataset.id));
        });
        document.querySelectorAll('.event-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteEvent(btn.dataset.id));
        });
    };

    const showModal = (isEditing = false, eventData = null) => {
        eventForm.reset();
        editingEventId = isEditing ? eventData.id : null;
        eventModal.querySelector('h4').textContent = isEditing ? 'Editar Evento' : 'Novo Evento';
        eventModal.querySelector('.btn-save').textContent = isEditing ? 'Salvar Alterações' : 'Adicionar';

        if (isEditing) {
            eventTitleInput.value = eventData.title;
            eventDateInput.value = eventData.date;
            eventTypeInput.value = eventData.type;
            eventDescInput.value = eventData.description || '';
        } else {
            eventDateInput.value = selectedDate.toISOString().split('T')[0];
        }
        eventModal.classList.add('show');
    };

    const hideModal = () => eventModal.classList.remove('show');

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const eventData = {
            title: eventTitleInput.value,
            date: eventDateInput.value,
            type: eventTypeInput.value,
            description: eventDescInput.value,
        };

        const eventRef = editingEventId
            ? ref(db, `users/${user.uid}/calendarEvents/${editingEventId}`)
            : push(ref(db, `users/${user.uid}/calendarEvents`));

        await set(eventRef, eventData);
        hideModal();
        fetchEvents();
    };

    const handleEditEvent = (id) => {
        const eventData = { id, ...events[id] };
        showModal(true, eventData);
    };

    const handleDeleteEvent = (id) => {
        eventIdToDelete = id;
        confirmDeleteModal.classList.add('show');
    };

    const confirmDelete = async () => {
        if (eventIdToDelete) {
            await remove(ref(db, `users/${user.uid}/calendarEvents/${eventIdToDelete}`));
            eventIdToDelete = null;
            confirmDeleteModal.classList.remove('show');
            fetchEvents();
        }
    };

    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    addEventBtn.addEventListener('click', () => showModal());
    closeModalBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    eventForm.addEventListener('submit', handleFormSubmit);

    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', () => confirmDeleteModal.classList.remove('show'));
    closeConfirmModalBtn.addEventListener('click', () => confirmDeleteModal.classList.remove('show'));

    fetchEvents();
}


window.startPomodoro = function() {
    if (pomodoroInterval) return;
    pomodoroInterval = setInterval(() => {
        if (pomodoroRemaining > 0) {
            pomodoroRemaining--;
            updatePomodoroDisplay();
        } else {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;
            alert("Pomodoro finalizado! Hora de uma pausa.");
        }
    }, 1000);
}

window.pausePomodoro = function() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
}

window.resetPomodoro = function() {
    pausePomodoro();
    pomodoroRemaining = pomodoroTime;
    updatePomodoroDisplay();
}

function updateCustomDisplay() {
    const minutes = Math.floor(customRemaining / 60).toString().padStart(2, '0');
    const seconds = (customRemaining % 60).toString().padStart(2, '0');
    customMinutesEl.textContent = minutes;
    customSecondsEl.textContent = seconds;
}

window.startCustomTimer = function() {
    if (customInterval) return;
    if (customRemaining === 0) {
        const min = parseInt(customMinutesInput.value) || 0;
        const sec = parseInt(customSecondsInput.value) || 0;
        customRemaining = min * 60 + sec;
    }
    if (!customRemaining) return;
    customInterval = setInterval(() => {
        if (customRemaining > 0) {
            customRemaining--;
            updateCustomDisplay();
        } else {
            clearInterval(customInterval);
            customInterval = null;
            alert("Tempo finalizado!");
        }
    }, 1000);
}

window.pauseCustomTimer = function() {
    clearInterval(customInterval);
    customInterval = null;
}

window.resetCustomTimer = function() {
    pauseCustomTimer();
    customRemaining = 0;
    customMinutesInput.value = '';
    customSecondsInput.value = '';
    updateCustomDisplay();
}

window.applySettings = async function() {
    const length = parseInt(pomodoroLengthInput.value) || 25;
    pomodoroTime = length * 60;
    resetPomodoro();
    
    const user = auth.currentUser;
    if (!user) return;
    const settingsRef = ref(db, `users/${user.uid}/settings/pomodoro`);
    try {
        await set(settingsRef, { duration: length });
        alert("Configurações salvas!");
    } catch (error) {
        console.error("Erro ao salvar configurações:", error);
    }
}

// =======================================================================
// 4. EVENT LISTENERS E INICIALIZAÇÃO DA PÁGINA
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    const tabPomodoro = document.getElementById("tab-pomodoro");
    const tabTimer = document.getElementById("tab-timer");
    const pomodoroTab = document.getElementById("pomodoro-tab");
    const timerTab = document.getElementById("timer-tab");
    const settings = document.getElementById("pomodoro-settings");
    if (!tabPomodoro) return; // bloco do cronômetro copiado aqui; não existe nesta página

    tabPomodoro.addEventListener("click", () => {
        pomodoroTab.classList.add("active");
        timerTab.classList.remove("active");
        tabPomodoro.classList.add("active");
        tabTimer.classList.remove("active");
        settings.classList.remove("hidden");
    });

    tabTimer.addEventListener("click", () => {
        pomodoroTab.classList.remove("active");
        timerTab.classList.add("active");
        tabPomodoro.classList.remove("active");
        tabTimer.classList.add("active");
        settings.classList.add("hidden");
    });

    // Carrega as configurações do usuário quando a página é carregada
    const user = auth.currentUser;
    if (user) {
        loadUserSettings(user);
    }
    auth.onAuthStateChanged(user => {
        if (user) loadUserSettings(user);
    });
});

async function loadUserSettings(user) {
    const settingsRef = ref(db, `users/${user.uid}/settings/pomodoro`);
    try {
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
            const settings = snapshot.val();
            pomodoroTime = (settings.duration || 25) * 60;
            pomodoroLengthInput.value = settings.duration || 25;
        }
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }
    resetPomodoro();
    updateCustomDisplay();
}
