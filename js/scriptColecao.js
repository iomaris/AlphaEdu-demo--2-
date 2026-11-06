// =======================================================================
// ===== SCRIPTCOLECAO.JS - VERSÃO COMPLETA E AUTÔNOMA =====
// =======================================================================

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
            // Inicializa a lógica específica da página de Coleções
            initializeCollectionsPage(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- 3. LÓGICA ESPECÍFICA DA PÁGINA DE COLEÇÕES ---
function initializeCollectionsPage(user) {
    const collectionsGrid = document.getElementById('collections-grid');
    const addCollectionBtn = document.getElementById('add-collection-btn');
    const searchInput = document.getElementById('search-input');
    const collectionModal = document.getElementById('collection-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const collectionForm = document.getElementById('collection-form');
    const modalTitle = document.getElementById('modal-title');
    const collectionNameInput = document.getElementById('collection-name');
    const collectionDescriptionInput = document.getElementById('collection-description');
    const confirmModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const closeConfirmModalBtn = document.getElementById('close-confirm-modal-btn');

    let collections = {};
    let editingCollectionId = null;
    let collectionToDeleteId = null;

    const showModal = (modal) => modal.classList.add('show');
    const hideModal = (modal) => modal.classList.remove('show');

    const loadCollectionsFromFirebase = async () => {
        const collectionsRef = ref(db, `users/${user.uid}/flashcardCollections`);
        try {
            const snapshot = await get(collectionsRef);
            collections = snapshot.exists() ? snapshot.val() : {};
            renderCollections();
        } catch (error) {
            console.error("Erro ao carregar coleções:", error);
            collections = {};
            renderCollections();
        }
    };

    const saveCollectionsToFirebase = async () => {
        const collectionsRef = ref(db, `users/${user.uid}/flashcardCollections`);
        try {
            await set(collectionsRef, collections);
        } catch (error) {
            console.error("Erro ao salvar coleções:", error);
        }
    };

    const renderCollections = (filter = '') => {
        collectionsGrid.innerHTML = '';
        const collectionsArray = Object.values(collections);

        const filteredCollections = collectionsArray.filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(filter.toLowerCase()))
        );

        if (filteredCollections.length === 0) {
            collectionsGrid.innerHTML = '<p class="no-collections-message">Nenhuma coleção encontrada. Crie uma nova para começar!</p>';
            return;
        }

        filteredCollections.forEach(collection => {
            const card = document.createElement('div');
            card.className = 'collection-card';
            card.dataset.id = collection.id;
            const cardCount = collection.cards ? Object.keys(collection.cards).length : 0;

            card.innerHTML = `
                <div>
                    <h4>${collection.name}</h4>
                    <p>${collection.description || 'Sem descrição.'}</p>
                </div>
                <div class="card-footer">
                    <span class="card-info">${cardCount} flashcards</span>
                    <div class="card-actions">
                        <a href="flashcards.html?collection=${collection.id}" class="study-btn">Estudar</a>
                        <button class="edit-btn" title="Editar Coleção"><i data-lucide="edit"></i></button>
                        <button class="delete-btn" title="Excluir Coleção"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>`;
            collectionsGrid.appendChild(card);
        });
        lucide.createIcons();
    };

    const openCollectionModal = (collection = null) => {
        if (collection) {
            editingCollectionId = collection.id;
            modalTitle.textContent = 'Editar Coleção';
            collectionNameInput.value = collection.name;
            collectionDescriptionInput.value = collection.description;
        } else {
            editingCollectionId = null;
            modalTitle.textContent = 'Nova Coleção';
            collectionForm.reset();
        }
        showModal(collectionModal);
    };

    const openConfirmModal = (collectionId) => {
        collectionToDeleteId = collectionId;
        const collectionKey = Object.keys(collections).find(key => collections[key].id === collectionId);
        const collectionName = collections[collectionKey].name;
        confirmModal.querySelector('#confirm-modal-text').textContent = `Tem certeza que deseja excluir a coleção "${collectionName}"? Todos os seus flashcards serão perdidos.`;
        showModal(confirmModal);
    };

    // --- Event Listeners ---
    addCollectionBtn.addEventListener('click', () => openCollectionModal());
    closeModalBtn.addEventListener('click', () => hideModal(collectionModal));
    cancelBtn.addEventListener('click', () => hideModal(collectionModal));
    collectionModal.addEventListener('click', (e) => { if (e.target === collectionModal) hideModal(collectionModal); });

    collectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = collectionNameInput.value.trim();
        const description = collectionDescriptionInput.value.trim();
        if (!name) { alert('O nome da coleção é obrigatório.'); return; }

        if (editingCollectionId) {
            const collectionKey = Object.keys(collections).find(key => collections[key].id === editingCollectionId);
            if (collectionKey) {
                collections[collectionKey].name = name;
                collections[collectionKey].description = description;
            }
        } else {
            const newCollectionId = `col_${Date.now()}`;
            const newCollection = { id: newCollectionId, name, description, cards: {} };
            collections[newCollectionId] = newCollection;
        }
        
        await saveCollectionsToFirebase();
        renderCollections(searchInput.value);
        hideModal(collectionModal);
    });

    collectionsGrid.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');
        
        if (editButton) {
            const card = editButton.closest('.collection-card');
            const collectionId = card.dataset.id;
            const collectionKey = Object.keys(collections).find(key => collections[key].id === collectionId);
            if (collectionKey) openCollectionModal(collections[collectionKey]);
        }
        
        if (deleteButton) {
            const card = deleteButton.closest('.collection-card');
            const collectionId = card.dataset.id;
            openConfirmModal(collectionId);
        }
    });

    searchInput.addEventListener('input', () => renderCollections(searchInput.value));

    closeConfirmModalBtn.addEventListener('click', () => hideModal(confirmModal));
    cancelDeleteBtn.addEventListener('click', () => hideModal(confirmModal));
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) hideModal(confirmModal); });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (collectionToDeleteId) {
            const collectionKey = Object.keys(collections).find(key => collections[key].id === collectionToDeleteId);
            if (collectionKey) {
                delete collections[collectionKey];
                await saveCollectionsToFirebase();
                renderCollections(searchInput.value);
            }
            hideModal(confirmModal);
        }
    });

    // --- Inicialização ---
    loadCollectionsFromFirebase();
}
