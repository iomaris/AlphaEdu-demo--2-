// =======================================================================
// ===== SCRIPTARQUIVOS.JS - VERSÃO COMPLETA E AUTÔNOMA =====
// =======================================================================

// --- 1. IMPORTS E SETUP DO FIREBASE ---
import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged } from "./firebase-demo.js";
import { getDatabase, ref as dbRef, get, set, remove } from "./firebase-demo.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "./firebase-demo.js";

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
const storage = getStorage(app);

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
            const userRef = dbRef(db, `users/${user.uid}`);
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
            // Inicializa a lógica específica da página de arquivos
            initializeFilesPage(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- 3. LÓGICA ESPECÍFICA DA PÁGINA DE ARQUIVOS ---
function initializeFilesPage(user) {
    const addFileBtn = document.getElementById('addFileBtn');
    const fileModal = document.getElementById('fileModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const fileForm = document.getElementById('fileForm');
    const filesContainer = document.getElementById('filesContainer');
    const fileInput = document.getElementById('fileInput');
    const fileNameEl = document.getElementById('fileName');
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    let filesMetadata = {};
    let fileToDeleteId = null;

    const showModal = (modal) => modal.classList.add('show');
    const hideModal = (modal) => modal.classList.remove('show');

    const loadFilesMetadata = async () => {
        const filesRef = dbRef(db, `users/${user.uid}/files`);
        try {
            const snapshot = await get(filesRef);
            filesMetadata = snapshot.exists() ? snapshot.val() : {};
            renderFiles();
        } catch (error) {
            console.error("Erro ao carregar metadados:", error);
            filesMetadata = {};
            renderFiles();
        }
    };

    const renderFiles = () => {
        filesContainer.innerHTML = '';
        const filesArray = Object.values(filesMetadata);

        if (filesArray.length === 0) {
            filesContainer.innerHTML = '<p class="empty-message">Nenhum arquivo salvo. Clique em "Adicionar Arquivo" para começar.</p>';
            return;
        }

        filesArray.sort((a, b) => b.id - a.id).forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.dataset.id = file.id;

            fileCard.innerHTML = `
                <div class="file-card-header">
                    <i data-lucide="file-text"></i>
                    <h4 class="file-title">${file.title}</h4>
                </div>
                <p class="file-description">${file.description || 'Sem descrição.'}</p>
                <div class="file-meta">
                    <span class="file-date">Salvo em: ${new Date(file.id).toLocaleDateString('pt-BR')}</span>
                    <div class="file-actions">
                        <button class="delete-btn" data-id="${file.id}"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            `;
            
            fileCard.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    window.open(file.downloadURL, '_blank');
                }
            });
            filesContainer.appendChild(fileCard);
        });
        lucide.createIcons();
    };

    // --- Event Listeners ---
    addFileBtn.addEventListener('click', () => {
        fileForm.reset();
        fileNameEl.textContent = 'Clique para selecionar um arquivo PDF';
        document.getElementById('modalTitle').textContent = 'Adicionar Novo Arquivo';
        showModal(fileModal);
    });

    closeModalBtn.addEventListener('click', () => hideModal(fileModal));
    cancelBtn.addEventListener('click', () => hideModal(fileModal));
    fileModal.addEventListener('click', (e) => { if (e.target === fileModal) hideModal(fileModal); });

    fileInput.addEventListener('change', () => {
        fileNameEl.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'Clique para selecionar um arquivo PDF';
    });

    fileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        const title = document.getElementById('fileTitleInput').value.trim();
        if (!file || !title) {
            alert('Por favor, selecione um arquivo e forneça um título.');
            return;
        }

        const saveButton = document.getElementById('saveFileBtn');
        saveButton.disabled = true;
        saveButton.textContent = 'Enviando...';

        try {
            const fileId = Date.now();
            const filePath = `userFiles/${user.uid}/${fileId}_${file.name}`;
            const fileStorageRef = storageRef(storage, filePath);

            const uploadResult = await uploadBytes(fileStorageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            const fileMetadata = {
                id: fileId,
                title: title,
                description: document.getElementById('fileDescriptionInput').value,
                fileName: file.name,
                filePath: filePath,
                downloadURL: downloadURL,
                createdAt: new Date().toISOString()
            };

            const fileDbRef = dbRef(db, `users/${user.uid}/files/${fileId}`);
            await set(fileDbRef, fileMetadata);

            filesMetadata[fileId] = fileMetadata;
            renderFiles();
            hideModal(fileModal);

        } catch (error) {
            console.error("Erro ao salvar arquivo:", error);
            alert("Ocorreu um erro ao salvar o arquivo. Tente novamente.");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Salvar';
        }
    });

    filesContainer.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.stopPropagation();
            fileToDeleteId = deleteButton.dataset.id;
            showModal(deleteModal);
        }
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!fileToDeleteId) return;

        try {
            const fileMeta = filesMetadata[fileToDeleteId];
            if (!fileMeta) throw new Error("Metadados do arquivo não encontrados.");

            const fileStorageRef = storageRef(storage, fileMeta.filePath);
            await deleteObject(fileStorageRef);

            const fileDbRef = dbRef(db, `users/${user.uid}/files/${fileToDeleteId}`);
            await remove(fileDbRef);

            delete filesMetadata[fileToDeleteId];
            renderFiles();
            hideModal(deleteModal);

        } catch (error) {
            console.error("Erro ao excluir arquivo:", error);
            delete filesMetadata[fileToDeleteId];
            renderFiles();
            hideModal(deleteModal);
            alert("Não foi possível excluir o arquivo do armazenamento, mas ele foi removido da sua lista.");
        } finally {
            fileToDeleteId = null;
        }
    });

    closeDeleteModalBtn.addEventListener('click', () => hideModal(deleteModal));
    cancelDeleteBtn.addEventListener('click', () => hideModal(deleteModal));
    deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) hideModal(deleteModal); });

    // --- Inicialização ---
    loadFilesMetadata();
}
