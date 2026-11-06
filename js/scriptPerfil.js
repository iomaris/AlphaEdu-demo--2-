// =======================================================================
// ===== SCRIPTPERFIL.JS - VERSÃO COMPLETA E AUTÔNOMA =====
// =======================================================================

// --- 1. IMPORTS E SETUP DO FIREBASE ---
import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged, updatePassword } from "./firebase-demo.js";
import { getDatabase, ref, get, update } from "./firebase-demo.js";

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
            // Inicializa a lógica específica da página de Perfil
            initializeProfilePage(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- 3. LÓGICA ESPECÍFICA DA PÁGINA DE PERFIL ---
function initializeProfilePage(user) {
    const profileForm = document.getElementById('profile-form');
    const profileNameInput = document.getElementById('profile-name');
    const profileEmailInput = document.getElementById('profile-email');
    const profilePasswordInput = document.getElementById('profile-password');
    const saveButton = document.querySelector('.btn-save');

    let userData = {};

    const loadProfileData = async () => {
        profileEmailInput.value = user.email;
        const userRef = ref(db, `users/${user.uid}`);
        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                userData = snapshot.val();
                profileNameInput.value = userData.username || '';
            }
        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
        }
    };

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveButton.disabled = true;
        saveButton.textContent = 'Salvando...';

        const newName = profileNameInput.value.trim();
        const newPassword = profilePasswordInput.value.trim();
        
        try {
            // 1. Atualiza o nome de usuário no Realtime Database
            if (newName && newName !== userData.username) {
                const userDbRef = ref(db, `users/${user.uid}`);
                await update(userDbRef, { username: newName });
            }

            // 2. Atualiza a senha no Firebase Auth (se uma nova foi digitada)
            if (newPassword) {
                if (newPassword.length < 6) {
                    alert("A nova senha deve ter no mínimo 6 caracteres.");
                    throw new Error("Senha muito curta.");
                }
                await updatePassword(user, newPassword);
                profilePasswordInput.value = ''; // Limpa o campo após o sucesso
            }

            alert("Perfil atualizado com sucesso!");
            // Recarrega os dados para garantir que a UI esteja atualizada
            // e o nome no menu da sidebar também mude, se for o caso.
            window.location.reload(); 

        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Esta é uma operação sensível. Por favor, faça login novamente antes de alterar sua senha.");
                window.location.href = 'index.html';
            } else {
                alert("Ocorreu um erro ao salvar as alterações.");
            }
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Salvar Alterações';
        }
    });

    // --- Inicialização ---
    loadProfileData();
}

