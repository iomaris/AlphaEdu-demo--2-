// =======================================================================
// ===== SCRIPTCONFIGURACAO.JS - VERSÃO COMPLETA E AUTÔNOMA =====
// =======================================================================

// --- 1. IMPORTS E SETUP DO FIREBASE ---
import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged, deleteUser } from "./firebase-demo.js";
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
            // Inicializa a lógica específica da página de Configurações
            initializeSettingsPage(user);
        } else {
            window.location.href = 'index.html';
        }
    });
});

// --- 3. LÓGICA ESPECÍFICA DA PÁGINA DE CONFIGURAÇÕES ---
function initializeSettingsPage(user) {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const emailNotificationsToggle = document.getElementById('email-notifications-toggle');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    const loadUserSettings = async () => {
        const settingsRef = ref(db, `users/${user.uid}/settings`);
        try {
            const snapshot = await get(settingsRef);
            if (snapshot.exists()) {
                const settings = snapshot.val();
                // O modo escuro é gerenciado pelo CSS, então não aplicamos classe aqui.
                // Apenas garantimos que o toggle reflita o estado salvo.
                darkModeToggle.checked = settings.theme === 'dark';
                emailNotificationsToggle.checked = settings.notifications?.email !== false;
            } else {
                // Valores padrão se não houver configurações salvas
                darkModeToggle.checked = false; // Assumindo que o padrão é light
                emailNotificationsToggle.checked = true;
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
        }
    };

    const saveUserSetting = async (path, value) => {
        const settingRef = ref(db, `users/${user.uid}/settings/${path}`);
        try {
            await set(settingRef, value);
        } catch (error) {
            console.error(`Erro ao salvar configuração '${path}':`, error);
        }
    };

    // Listener para o toggle de Modo Escuro
    darkModeToggle.addEventListener('change', () => {
        const theme = darkModeToggle.checked ? 'dark' : 'light';
        // Apenas salva a preferência. O CSS deve cuidar da aplicação do tema.
        saveUserSetting('theme', theme);
        // Se precisar forçar a mudança sem recarregar a página, adicione/remova uma classe no <body>
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    });

    // Listener para o toggle de Notificações por E-mail
    emailNotificationsToggle.addEventListener('change', () => {
        const wantsNotifications = emailNotificationsToggle.checked;
        saveUserSetting('notifications/email', wantsNotifications);
    });

    // Listener para o botão de Excluir Conta
    deleteAccountBtn.addEventListener('click', async () => {
        const confirmation = prompt("Esta ação é IRREVERSÍVEL. Você perderá todos os seus dados (notas, arquivos, etc.).\n\nPara confirmar, digite 'EXCLUIR' na caixa abaixo.");
        
        if (confirmation === 'EXCLUIR') {
            try {
                // 1. Exclui todos os dados do usuário do Realtime Database
                const userDbRef = ref(db, `users/${user.uid}`);
                await remove(userDbRef);
                
                // 2. Exclui o usuário do sistema de autenticação do Firebase
                await deleteUser(user);
                
                alert("Sua conta foi excluída com sucesso. Você será redirecionado.");
                window.location.href = 'index.html';

            } catch (error) {
                console.error("Erro ao excluir conta:", error);
                alert("Ocorreu um erro ao excluir sua conta. Pode ser necessário fazer login novamente para completar esta ação. Se o erro persistir, contate o suporte.");
            }
        } else {
            alert("Ação cancelada. Sua conta não foi excluída.");
        }
    });

    // --- Inicialização ---
    loadUserSettings();
}


