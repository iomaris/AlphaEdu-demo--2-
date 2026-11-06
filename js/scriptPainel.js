// ==================================================
// ===== SCRIPTPAINEL.JS - VERSÃO FINAL COM AVISOS =====
// ==================================================

import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged } from "./firebase-demo.js";
import { getDatabase, ref, get, set } from "./firebase-demo.js";

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

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const welcomeMessage = document.getElementById('welcome-message');
    const profileAvatar = document.querySelector('.profile-avatar');
    const sidebarProfileUsername = document.querySelector('.profile-info .username');
    const sidebarProfileEmail = document.querySelector('.profile-info .email');
    const dropdownUsername = document.querySelector('#profile-dropdown .username');
    const dropdownEmail = document.querySelector('#profile-dropdown .email');
    const leaveClassBtn = document.getElementById('leave-class-btn');
    const openModalBtn = document.getElementById('openJoinModalBtn');
    const modal = document.getElementById('joinClassModal');
    const closeModalBtn = document.getElementById('closeJoinModalBtn');
    const joinForm = document.getElementById('joinClassForm');
    const codeInput = document.getElementById('class-code-input');
    const customModalOverlay = document.getElementById('custom-modal-overlay');
    const customModalTitle = document.getElementById('custom-modal-title');
    const customModalText = document.getElementById('custom-modal-text');
    const customModalOkBtn = document.getElementById('custom-modal-ok-btn');
    const customModalCancelBtn = document.getElementById('custom-modal-cancel-btn');
    const miniNotesList = document.getElementById('mini-notes-list');
    const miniMonthYearEl = document.getElementById('mini-month-year');
    const miniDaysEl = document.getElementById('mini-calendar-days');
    const miniPrevBtn = document.getElementById('mini-prev-month');
    const miniNextBtn = document.getElementById('mini-next-month');
    const painelAvisos = document.getElementById('class-panel');
    const noticeListContainer = document.querySelector('.notice-list'); // Container dos avisos

    let miniCurrentDate = new Date();

    // --- LÓGICA DA SIDEBAR E PERFIL ---
    if (toggleBtn) {
        const setSidebarState = (isHidden) => {
            if (sidebar && mainContent) {
                sidebar.classList.toggle('hidden', isHidden);
                localStorage.setItem('sidebarState', isHidden ? 'hidden' : 'visible');
            }
        };
        toggleBtn.addEventListener('click', () => setSidebarState(!sidebar.classList.contains('hidden')));
        const savedState = localStorage.getItem('sidebarState');
        setSidebarState(savedState === 'hidden');
    }

    if (profileMenuButton) {
        profileMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
    }
    window.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.classList.remove('show');
    });

    // --- PONTO DE ENTRADA PRINCIPAL: AUTENTICAÇÃO ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            lucide.createIcons();
            loadPageData(user);
        } else {
            window.location.href = 'index.html';
        }
    });
    

    // --- FUNÇÃO ÚNICA PARA CARREGAR DADOS ---
    async function loadPageData(user) {
        if (!user) return;
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.exists() ? snapshot.val() : {};
        
        const username = userData.username || 'Usuário';
        const email = user.email;
        const avatarInitials = (username[0] || 'U') + (username.split(' ')[1]?.[0] || '');

        if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo(a) de volta, ${username}!`;
        if (profileAvatar) profileAvatar.textContent = avatarInitials;
        if (sidebarProfileUsername) sidebarProfileUsername.textContent = username;
        if (sidebarProfileEmail) sidebarProfileEmail.textContent = email;
        if (dropdownUsername) dropdownUsername.textContent = username;
        if (dropdownEmail) dropdownEmail.textContent = email;
        
        const userHasCode = !!userData.classCode;
        if (leaveClassBtn) leaveClassBtn.style.display = userHasCode ? 'flex' : 'none';
        if (openModalBtn) openModalBtn.style.display = userHasCode ? 'none' : 'flex';

        if (painelAvisos) painelAvisos.style.display = userHasCode ? 'block' : 'none';
        
        // CORREÇÃO: Chama a nova função para carregar os avisos
        if (userHasCode) {
            loadClassNotices(userData.classCode);
        }
        
        renderMiniCalendar();
        renderMiniNotes(userData.notes || {});
    }

    // ==================================================
    // ===== NOVA FUNÇÃO PARA CARREGAR AVISOS DA TURMA =====
    // ==================================================
    async function loadClassNotices(classCode) {
        if (!noticeListContainer) return;
        
        // Caminho no DB onde os avisos da turma são salvos (ex: /classes/CODIGO_DA_TURMA/notices)
        const noticesRef = ref(db, `classes/${classCode}/notices`);
        try {
            const snapshot = await get(noticesRef);
            if (snapshot.exists()) {
                const notices = snapshot.val();
                const noticesArray = Object.values(notices).sort((a, b) => new Date(b.date) - new Date(a.date));
                
                noticeListContainer.innerHTML = ''; // Limpa a lista
                noticesArray.forEach(notice => {
                    const noticeCard = document.createElement('div');
                    noticeCard.className = 'notice-card';
                    noticeCard.innerHTML = `
                        <h4>${notice.title}</h4>
                        <p>${notice.text}</p>
                        <div class="meta">Publicado por: <strong>${notice.author || 'Professor'}</strong></div>
                    `;
                    noticeListContainer.appendChild(noticeCard);
                });
            } else {
                noticeListContainer.innerHTML = '<p>Nenhum aviso importante no momento.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar avisos da turma:", error);
            noticeListContainer.innerHTML = '<p>Não foi possível carregar os avisos.</p>';
        }
    }

    // --- FUNÇÕES DOS WIDGETS DO PAINEL ---
    function renderMiniCalendar() {
        if (!miniMonthYearEl || !miniDaysEl) return;
        const year = miniCurrentDate.getFullYear();
        const month = miniCurrentDate.getMonth();
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        miniMonthYearEl.textContent = `${monthNames[month]} ${year}`;
        miniDaysEl.innerHTML = '';
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) { miniDaysEl.innerHTML += `<div class="mini-day"></div>`; }
        for (let i = 1; i <= lastDate; i++) {
            const isToday = new Date(year, month, i).toDateString() === new Date().toDateString() ? 'today' : '';
            miniDaysEl.innerHTML += `<div class="mini-day current-month ${isToday}">${i}</div>`;
        }
    }

    function renderMiniNotes(notes = {}) {
        if (!miniNotesList) return;
        const notesArray = Object.values(notes).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        miniNotesList.innerHTML = '';
        if (notesArray.length > 0) {
            notesArray.slice(0, 3).forEach(note => {
                miniNotesList.innerHTML += `<div class="mini-note-card"><h5>${note.title || 'Nota sem título'}</h5><p>${new Date(note.rawDate).toLocaleDateString('pt-BR')}</p></div>`;
            });
        } else {
            miniNotesList.innerHTML = '<p>Nenhuma nota encontrada.</p>';
        }
    }

    // --- EVENT LISTENERS DOS WIDGETS ---
    if (miniPrevBtn) miniPrevBtn.addEventListener('click', () => {
        miniCurrentDate.setMonth(miniCurrentDate.getMonth() - 1);
        loadPageData(auth.currentUser);
    });
    if (miniNextBtn) miniNextBtn.addEventListener('click', () => {
        miniCurrentDate.setMonth(miniCurrentDate.getMonth() + 1);
        loadPageData(auth.currentUser);
    });

    // --- LÓGICA DOS MODAIS ---
    const showModal = (modalEl) => modalEl.classList.add('show');
    const hideModal = (modalEl) => modalEl.classList.remove('show');

    if (openModalBtn) openModalBtn.addEventListener('click', () => showModal(modal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => hideModal(modal));
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(modal); });

    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classCode = codeInput.value.trim();
            const user = auth.currentUser;
            if (classCode && user) {
                await set(ref(db, `users/${user.uid}/classCode`), classCode);
                hideModal(modal);
                await showAlert('Sucesso!', `Código "${classCode}" aceito! Bem-vindo(a) à turma.`);
                loadPageData(user);
            } else {
                await showAlert('Atenção', 'Por favor, insira um código de turma.');
            }
        });
    }

    if (leaveClassBtn) {
        leaveClassBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            const confirmed = await showConfirm('Sair da Turma', 'Tem certeza que deseja sair da turma?');
            if (confirmed && user) {
                await set(ref(db, `users/${user.uid}/classCode`), null);
                await showAlert('Aviso', 'Você saiu da turma.');
                loadPageData(user);
            }
        });
    }

    function showAlert(title, message) {
        customModalTitle.textContent = title;
        customModalText.textContent = message;
        customModalCancelBtn.style.display = 'none';
        customModalOkBtn.textContent = 'OK';
        showModal(customModalOverlay);
        return new Promise((resolve) => {
            customModalOkBtn.onclick = () => {
                hideModal(customModalOverlay);
                resolve(true);
            };
        });
    }

    function showConfirm(title, message) {
        customModalTitle.textContent = title;
        customModalText.textContent = message;
        customModalCancelBtn.style.display = 'inline-block';
        customModalOkBtn.textContent = 'Confirmar';
        customModalCancelBtn.textContent = 'Cancelar';
        showModal(customModalOverlay);
        return new Promise((resolve) => {
            customModalOkBtn.onclick = () => {
                hideModal(customModalOverlay);
                resolve(true);
            };
            customModalCancelBtn.onclick = () => {
                hideModal(customModalOverlay);
                resolve(false);
            };
        });
    }
    
});
