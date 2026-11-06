
// --- 1. IMPORTS E SETUP DO FIREBASE ---
import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged } from "./firebase-demo.js";
import { getDatabase, ref, get, set, remove } from "./firebase-demo.js";

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

const app = initializeApp(firebaseConfig);
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
            mainContent.style.paddingLeft = isHidden ? '118px' : '290px';
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
            // Inicializa a lógica específica do Bloco de Notas
            initializeNotepad(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- 3. LÓGICA ESPECÍFICA DO BLOCO DE NOTAS ---
function initializeNotepad(user) {
    const newNoteBtn = document.getElementById('newNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const closeModalBtn = document.getElementById('closeModal');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const notesContainer = document.getElementById('notesContainer');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');
    const noteTitleInput = document.getElementById('noteTitleInput');
    const noteContentInput = document.getElementById('noteContentInput');
    const deleteModal = document.getElementById("deleteModal");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const closeDeleteModalBtn = document.getElementById("closeDeleteModal");

    let notes = {};
    let isEditing = false;
    let editingNoteId = null;
    let noteToDeleteId = null;

    const loadNotes = async () => {
        const notesRef = ref(db, `users/${user.uid}/notes`);
        try {
            const snapshot = await get(notesRef);
            notes = snapshot.exists() ? snapshot.val() : {};
            renderNotes();
        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            notes = {};
            renderNotes();
        }
    };

    const saveNoteToFirebase = async (noteId, noteData) => {
        const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
        await set(noteRef, noteData);
    };

    const deleteNoteFromFirebase = async (noteId) => {
        const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
        await remove(noteRef);
    };

    const renderNotes = (filter = '') => {
        notesContainer.innerHTML = '';
        const notesArray = Object.values(notes);

        const filteredNotes = notesArray.filter(note =>
            note.title.toLowerCase().includes(filter.toLowerCase()) ||
            note.content.toLowerCase().includes(filter.toLowerCase())
        ).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

        if (filteredNotes.length === 0) {
            notesContainer.innerHTML = `<p class="no-notes-message">Nenhuma nota encontrada.</p>`;
            return;
        }

        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note-card');
            noteElement.setAttribute('data-id', note.id);

            const previewContent = note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content;
            const formattedContent = previewContent.replace(/\n/g, '<br>');

            noteElement.innerHTML = `
                <div>
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-date">Criada em: ${note.date}</span>
                    <div class="note-content"><p>${formattedContent}</p></div>
                </div>
                <div class="note-actions">
                    <button class="action-btn edit-btn" title="Editar"><i data-lucide="pencil"></i></button>
                    <button class="action-btn delete-btn" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            notesContainer.appendChild(noteElement);
        });

        addNoteActionListeners();
        lucide.createIcons();
    };

    const addNoteActionListeners = () => {
        notesContainer.querySelectorAll('.note-card').forEach(card => {
            const noteId = card.dataset.id;
            card.querySelector('.edit-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(noteId);
            });
            card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openDeleteConfirmation(noteId);
            });
        });
    };

    const openNewModal = () => {
        isEditing = false;
        editingNoteId = null;
        modalTitle.textContent = 'Nova Nota';
        noteTitleInput.value = '';
        noteContentInput.value = '';
        noteModal.classList.add('show');
    };

    const openEditModal = (id) => {
        isEditing = true;
        editingNoteId = id;
        modalTitle.textContent = 'Editar Nota';
        const note = notes[id];
        if (!note) return;
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        noteModal.classList.add('show');
    };

    const closeModal = () => noteModal.classList.remove('show');

    const openDeleteConfirmation = (id) => {
        noteToDeleteId = id;
        deleteModal.classList.add("show");
    };

    const closeDeleteModal = () => {
        noteToDeleteId = null;
        deleteModal.classList.remove("show");
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date).replace(',', ' às');
    };

    // --- Event Listeners ---
    newNoteBtn.addEventListener('click', openNewModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    searchInput.addEventListener('input', () => renderNotes(searchInput.value.trim()));

    saveNoteBtn.addEventListener('click', async () => {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        if (!title) { alert('Por favor, insira um título para a nota.'); return; }

        const date = new Date();
        const noteId = isEditing ? editingNoteId : `note_${date.getTime()}`;
        
        const noteData = {
            id: noteId,
            title: title,
            content: content,
            date: formatDate(date),
            rawDate: date.toISOString()
        };

        notes[noteId] = noteData;
        await saveNoteToFirebase(noteId, noteData);
        renderNotes(searchInput.value.trim());
        closeModal();
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (noteToDeleteId) {
            await deleteNoteFromFirebase(noteToDeleteId);
            delete notes[noteToDeleteId];
            renderNotes(searchInput.value.trim());
            closeDeleteModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);

    window.addEventListener('click', (event) => {
        if (event.target === noteModal) closeModal();
        if (event.target === deleteModal) closeDeleteModal();
    });

    // --- Inicialização ---
    loadNotes();
}
