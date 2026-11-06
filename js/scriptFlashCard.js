// =======================================================================
// ===== SCRIPTFLASHCARD.JS - VERSÃO COMPLETA E AUTÔNOMA =====
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
            // Inicializa a lógica específica da página de Flashcards
            initializeFlashcardPage(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});





// --- 3. LÓGICA ESPECÍFICA DA PÁGINA DE FLASHCARD ---
function initializeFlashcardPage(user) {
    const front = document.getElementById("card-front");
    const back = document.getElementById("card-back");
    const flashcard = document.getElementById("flashcard");
    const tagsContainer = document.getElementById("tags");
    const counter = document.getElementById("counter");
    const cardModal = document.getElementById("modal");
    const cardForm = document.getElementById("card-form");
    const modalTitle = document.getElementById("modal-title");
    const modalPergunta = document.getElementById("modal-pergunta");
    const modalResposta = document.getElementById("modal-resposta");
    const modalTags = document.getElementById("modal-tags");
    const saveBtn = document.getElementById("save");
    const addCardBtn = document.getElementById("add-card-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const cancelBtn = document.getElementById("cancel");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const shuffleBtn = document.getElementById("shuffle");
    const editBtn = document.getElementById("edit");
    const deleteBtn = document.getElementById("delete");
    const confirmModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const closeConfirmModalBtn = document.getElementById('close-confirm-modal-btn');
    const collectionTitleEl = document.getElementById('collection-title');
    const collectionDescriptionEl = document.getElementById('collection-description');

    let collectionKey = null;
    let currentCollection = null;
    let currentCards = [];
    let cardKeys = [];
    let currentIndex = 0;
    let isEditMode = false;
    let editingCardKey = null;
    let cardToDeleteKey = null;

    const showModal = (modal) => modal.classList.add('show');
    const hideModal = (modal) => modal.classList.remove('show');

    const loadDataFromFirebase = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const collectionId = urlParams.get('collection');

        if (!collectionId) {
            showError("ID da coleção não fornecido na URL.");
            return;
        }

        const collectionsRef = ref(db, `users/${user.uid}/flashcardCollections`);
        try {
            const snapshot = await get(collectionsRef);
            if (snapshot.exists()) {
                const allCollections = snapshot.val();
                collectionKey = Object.keys(allCollections).find(key => allCollections[key].id === collectionId);
                currentCollection = collectionKey ? allCollections[collectionKey] : null;
            }

            if (currentCollection) {
                currentCards = currentCollection.cards ? Object.values(currentCollection.cards) : [];
                cardKeys = currentCollection.cards ? Object.keys(currentCollection.cards) : [];
                collectionTitleEl.textContent = currentCollection.name;
                collectionDescriptionEl.textContent = currentCollection.description || 'Revise os flashcards desta coleção.';
                renderCard();
            } else {
                showError("Coleção não encontrada.");
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showError("Erro ao carregar a coleção.");
        }
    };

    const showError = (message) => {
        const mainHeader = document.querySelector('.main-header');
        const panel = document.querySelector('.panel');
        mainHeader.innerHTML = `<h1>Erro</h1><p>${message}</p>`;
        if (panel) panel.style.display = 'none';
    };

    const renderCard = () => {
        flashcard.classList.remove("is-flipped");
        if (currentCards.length === 0) {
            front.textContent = "Nenhum flashcard nesta coleção.";
            back.textContent = "Clique em 'Novo Flashcard' para começar.";
            tagsContainer.innerHTML = "";
            counter.textContent = "0 / 0";
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            return;
        }
        
        editBtn.style.display = 'inline-flex';
        deleteBtn.style.display = 'inline-flex';
        const card = currentCards[currentIndex];
        front.textContent = card.pergunta;
        back.textContent = card.resposta;
        tagsContainer.innerHTML = (card.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');
        counter.textContent = `${currentIndex + 1} / ${currentCards.length}`;
    };

    const openCardModal = (card = null, key = null) => {
        if (card) {
            isEditMode = true;
            editingCardKey = key;
            modalTitle.textContent = "Editar Flashcard";
            modalPergunta.value = card.pergunta;
            modalResposta.value = card.resposta;
            modalTags.value = (card.tags || []).join(", ");
            saveBtn.textContent = "Salvar Alterações";
        } else {
            isEditMode = false;
            editingCardKey = null;
            modalTitle.textContent = "Novo Flashcard";
            cardForm.reset();
            saveBtn.textContent = "Criar Flashcard";
        }
        showModal(cardModal);
    };

    const openConfirmModal = (key) => {
        cardToDeleteKey = key;
        confirmModal.querySelector('#confirm-modal-text').textContent = `Tem certeza que deseja excluir este flashcard?`;
        showModal(confirmModal);
    };

    // --- Event Listeners ---
    flashcard.addEventListener("click", () => flashcard.classList.toggle("is-flipped"));
    addCardBtn.addEventListener("click", () => openCardModal());
    closeModalBtn.addEventListener("click", () => hideModal(cardModal));
    cancelBtn.addEventListener("click", () => hideModal(cardModal));
    cardModal.addEventListener("click", (e) => { if (e.target === cardModal) hideModal(cardModal); });

    prevBtn.addEventListener("click", () => {
        if (currentCards.length > 0) {
            currentIndex = (currentIndex - 1 + currentCards.length) % currentCards.length;
            renderCard();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (currentCards.length > 0) {
            currentIndex = (currentIndex + 1) % currentCards.length;
            renderCard();
        }
    });

    shuffleBtn.addEventListener("click", () => {
        if (currentCards.length > 1) {
            let oldIndex = currentIndex;
            while (currentIndex === oldIndex) {
                currentIndex = Math.floor(Math.random() * currentCards.length);
            }
            renderCard();
        }
    });

    editBtn.addEventListener("click", () => {
        if (currentCards.length > 0) {
            const cardKey = cardKeys[currentIndex];
            openCardModal(currentCards[currentIndex], cardKey);
        }
    });

    deleteBtn.addEventListener("click", () => {
        if (currentCards.length > 0) {
            const cardKey = cardKeys[currentIndex];
            openConfirmModal(cardKey);
        }
    });

    cardForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const pergunta = modalPergunta.value.trim();
        const resposta = modalResposta.value.trim();
        const tags = modalTags.value.split(",").map(t => t.trim()).filter(t => t !== "");
        if (!pergunta || !resposta) {
            alert("Por favor, preencha a pergunta e a resposta.");
            return;
        }

        const cardData = { pergunta, resposta, tags };
        let cardKeyToUpdate = editingCardKey;

        if (isEditMode) {
            const cardRef = ref(db, `users/${user.uid}/flashcardCollections/${collectionKey}/cards/${cardKeyToUpdate}`);
            await set(cardRef, cardData);
        } else {
            cardKeyToUpdate = `card_${Date.now()}`;
            const cardRef = ref(db, `users/${user.uid}/flashcardCollections/${collectionKey}/cards/${cardKeyToUpdate}`);
            await set(cardRef, cardData);
        }
        
        hideModal(cardModal);
        await loadDataFromFirebase(); // Recarrega tudo para garantir consistência
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (cardToDeleteKey) {
            const cardRef = ref(db, `users/${user.uid}/flashcardCollections/${collectionKey}/cards/${cardToDeleteKey}`);
            await remove(cardRef);
            
            if (currentIndex >= currentCards.length - 1 && currentIndex > 0) {
                currentIndex--;
            }
            
            hideModal(confirmModal);
            await loadDataFromFirebase(); // Recarrega para mostrar o estado atual
        }
    });

    closeConfirmModalBtn.addEventListener('click', () => hideModal(confirmModal));
    cancelDeleteBtn.addEventListener('click', () => hideModal(confirmModal));
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) hideModal(confirmModal); });

    // --- Inicialização ---
    loadDataFromFirebase();
}
