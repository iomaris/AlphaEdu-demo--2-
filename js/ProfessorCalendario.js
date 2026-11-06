/* ================================================== */
/* ===== ProfessorCalendario.js - VERSÃO FINAL ===== */
/* ================================================== */

import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged, signOut } from "./firebase-demo.js";
import { getDatabase, ref, get, set, push, onValue, remove, query, orderByChild, equalTo } from "./firebase-demo.js";

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

let turmasCache = {};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            get(ref(db, `users/${user.uid}`)).then(snapshot => {
                if (snapshot.exists() && snapshot.val().userType === 'professor') {
                    lucide.createIcons();
                    setupGlobalUI(snapshot.val());
                    initializeCalendar(user.uid);
                } else {
                    alert('Acesso negado. Esta área é restrita para professores.');
                    window.location.href = 'index.html';
                }
            });
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- LÓGICA GLOBAL DA INTERFACE (SIDEBAR, PERFIL) ---
function setupGlobalUI(userData) {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutButton = document.querySelector('.logout');

    const setSidebarState = (isHidden) => {
        sidebar.classList.toggle('hidden', isHidden);
        localStorage.setItem('sidebarState', isHidden ? 'hidden' : 'visible');
    };
    toggleBtn.addEventListener('click', () => setSidebarState(!sidebar.classList.contains('hidden')));
    const savedState = localStorage.getItem('sidebarState');
    setSidebarState(savedState === 'hidden');

    profileMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });
    window.addEventListener('click', () => profileDropdown.classList.remove('show'));

    const username = userData.username || 'Professor';
    const email = userData.email;
    const avatarInitials = (username[0] || 'P') + (username.split(' ')[1]?.[0] || '');
    document.querySelector('.profile-avatar').textContent = avatarInitials;
    document.querySelectorAll('.profile-info .username, #profile-dropdown .username').forEach(el => el.textContent = username);
    document.querySelectorAll('.profile-info .email, #profile-dropdown .email').forEach(el => el.textContent = email);

    logoutButton.addEventListener('click', () => signOut(auth));
}

// --- LÓGICA DO CALENDÁRIO ---
function initializeCalendar(userId) {
    const monthYearEl = document.getElementById('month-year');
    const daysEl = document.getElementById('calendar-days');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const eventsTitleEl = document.getElementById('events-title');
    const eventListEl = document.getElementById('event-list');
    const addEventBtn = document.getElementById('add-event-btn');

    const eventModal = document.getElementById('event-modal');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventForm = document.getElementById('event-form');
    const eventIdInput = document.getElementById('event-id-input');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventTurmaSelect = document.getElementById('event-turma-select');
    const eventDateInput = document.getElementById('event-date-input');
    const closeBtn = eventModal.querySelector('.close-btn');
    const cancelBtn = eventModal.querySelector('.btn-cancel');

    let currentDate = new Date();
    let selectedDate = new Date();
    let allEvents = {};

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const fetchTurmasAndEvents = () => {
        const turmasRef = query(ref(db, 'classes'), orderByChild(`professors/${userId}`), equalTo(true));
        onValue(turmasRef, (snapshot) => {
            turmasCache = snapshot.exists() ? snapshot.val() : {};
            fetchAllEvents();
        });
    };

    const fetchAllEvents = () => {
        const classIds = Object.keys(turmasCache);
        allEvents = {};
        if (classIds.length === 0) {
            renderCalendar();
            renderEventsForDate(selectedDate);
            return;
        }
        const promises = classIds.map(id => get(ref(db, `classes/${id}/events`)));
        
        Promise.all(promises).then(snapshots => {
            snapshots.forEach((snap, index) => {
                if (snap.exists()) {
                    const classId = classIds[index];
                    const events = snap.val();
                    for (const eventId in events) {
                        allEvents[eventId] = { ...events[eventId], classId, id: eventId };
                    }
                }
            });
            renderCalendar();
            renderEventsForDate(selectedDate);
        });
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

            const dayHasEvent = Object.values(allEvents).some(event => event.date === dateString);
            const eventDot = dayHasEvent ? '<div class="event-dot"></div>' : '';

            daysEl.innerHTML += `<div class="${classes}" data-date="${dateString}">${i}${eventDot}</div>`;
        }

        document.querySelectorAll('.day:not(.other-month)').forEach(day => {
            day.addEventListener('click', (e) => {
                selectedDate = new Date(e.currentTarget.dataset.date + 'T00:00:00');
                renderCalendar();
                renderEventsForDate(selectedDate);
            });
        });
    };

    const renderEventsForDate = (date) => {
        const dateString = date.toISOString().split('T')[0];
        eventsTitleEl.textContent = `Eventos para ${date.toLocaleDateString('pt-BR')}`;
        eventListEl.innerHTML = '';

        const dayEvents = Object.values(allEvents)
            .filter(event => event.date === dateString)
            .sort((a, b) => a.title.localeCompare(b.title));

        if (dayEvents.length === 0) {
            eventListEl.innerHTML = '<p>Nenhum evento para este dia.</p>';
            return;
        }

        dayEvents.forEach(event => {
            const turmaName = turmasCache[event.classId]?.name || 'Turma desconhecida';
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-turma">${turmaName}</div>
                <h4 class="event-title">${event.title}</h4>
                <div class="event-card-footer">
                    <button class="event-action-btn edit" data-id="${event.id}"><i data-lucide="edit"></i></button>
                    <button class="event-action-btn delete" data-id="${event.id}"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            eventListEl.appendChild(card);
        });

        lucide.createIcons();

        document.querySelectorAll('.event-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEventModal(allEvents[btn.dataset.id]));
        });
        document.querySelectorAll('.event-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const eventToDelete = allEvents[btn.dataset.id];
                if (confirm(`Tem certeza que deseja excluir o evento "${eventToDelete.title}"?`)) {
                    await remove(ref(db, `classes/${eventToDelete.classId}/events/${eventToDelete.id}`));
                    fetchAllEvents();
                }
            });
        });
    };

    const openEventModal = (event = null) => {
        eventForm.reset();
        eventModalTitle.textContent = event ? 'Editar Evento' : 'Novo Evento';
        eventIdInput.value = event ? event.id : '';
        
        eventTurmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
        for (const classId in turmasCache) {
            const turma = turmasCache[classId];
            const option = document.createElement('option');
            option.value = classId;
            option.textContent = turma.name;
            eventTurmaSelect.appendChild(option);
        }
        
        if (event) {
            eventTitleInput.value = event.title;
            eventTurmaSelect.value = event.classId;
            eventDateInput.value = event.date;
        } else {
            eventDateInput.value = selectedDate.toISOString().split('T')[0];
        }
        eventModal.style.display = 'flex';
    };

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = eventIdInput.value;
        const classId = eventTurmaSelect.value;
        const eventData = {
            title: eventTitleInput.value,
            date: eventDateInput.value,
        };

        if (!classId) {
            alert('Por favor, selecione uma turma.');
            return;
        }
        
        if (eventId && allEvents[eventId] && allEvents[eventId].classId !== classId) {
            await remove(ref(db, `classes/${allEvents[eventId].classId}/events/${eventId}`));
        }

        const idToSave = eventId || push(ref(db, `classes/${classId}/events`)).key;
        await set(ref(db, `classes/${classId}/events/${idToSave}`), eventData);
        
        eventModal.style.display = 'none';
        fetchAllEvents();
    });

    prevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    addEventBtn.addEventListener('click', () => openEventModal());
    closeBtn.addEventListener('click', () => eventModal.style.display = 'none');
    cancelBtn.addEventListener('click', () => eventModal.style.display = 'none');

    // Inicia o processo buscando as turmas, que por sua vez, buscará os eventos.
    fetchTurmasAndEvents();
}
