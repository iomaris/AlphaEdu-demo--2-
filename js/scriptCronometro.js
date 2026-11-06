// =======================================================================
// ===== SCRIPT CRONOMETRO.JS - VERSÃO COMPLETA E CORRIGIDA =====
// =======================================================================

// --- 1. IMPORTS E SETUP DO FIREBASE ---
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
            // Ajusta a margem do conteúdo principal com base no estado
            mainContent.style.marginLeft = isHidden ? '88px' : '260px';
            localStorage.setItem('sidebarState', isHidden ? 'hidden' : 'visible');
        };

        toggleBtn.addEventListener('click', () => {
            // Alterna o estado atual da sidebar
            setSidebarState(!sidebar.classList.contains('hidden'));
        });

        // ===== PONTO CRÍTICO DA CORREÇÃO =====
        // Verifica o estado salvo no localStorage AO CARREGAR A PÁGINA
        const savedState = localStorage.getItem('sidebarState');
        
        // Aplica o estado salvo IMEDIATAMENTE
        if (savedState === 'hidden') {
            // Se o estado salvo for 'hidden', aplica esse estado
            setSidebarState(true);
        } else {
            // Caso contrário (se for 'visible' ou nulo), aplica o estado padrão (aberto)
            setSidebarState(false);
        }
        // =====================================
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

                // Atualiza a UI com os dados do usuário
                if (profileAvatar) profileAvatar.textContent = avatarInitials;
                if (profileUsername) profileUsername.textContent = username;
                if (profileEmail) profileEmail.textContent = email;
                if (dropdownUsername) dropdownUsername.textContent = username;
                if (dropdownEmail) dropdownEmail.textContent = email;
                if (leaveClassBtn) leaveClassBtn.style.display = userData.classCode ? 'flex' : 'none';
            }
            // Carrega as configurações específicas do cronômetro
            loadUserSettings(user);
        } else {
            window.location.href = 'index.html';
        }
    });

    // --- LÓGICA ESPECÍFICA DO CRONÔMETRO ---
    const tabPomodoro = document.getElementById("tab-pomodoro");
    const tabTimer = document.getElementById("tab-timer");
    const pomodoroTab = document.getElementById("pomodoro-tab");
    const timerTab = document.getElementById("timer-tab");
    const settingsEl = document.getElementById("pomodoro-settings");

    tabPomodoro.addEventListener("click", () => {
        pomodoroTab.classList.add("active");
        timerTab.classList.remove("active");
        tabPomodoro.classList.add("active");
        tabTimer.classList.remove("active");
        if(settingsEl) settingsEl.style.display = 'block';
    });

    tabTimer.addEventListener("click", () => {
        pomodoroTab.classList.remove("active");
        timerTab.classList.add("active");
        tabPomodoro.classList.remove("active");
        tabTimer.classList.add("active");
        if(settingsEl) settingsEl.style.display = 'none';
    });
});


// --- 3. LÓGICA E ESTADO DO CRONÔMETRO ---
const pomodoroMinutesEl = document.getElementById("pomodoro-minutes");
const pomodoroSecondsEl = document.getElementById("pomodoro-seconds");
const customMinutesEl = document.getElementById("custom-minutes");
const customSecondsEl = document.getElementById("custom-seconds");
const customMinutesInput = document.getElementById("custom-minutes-input");
const customSecondsInput = document.getElementById("custom-seconds-input");
const pomodoroLengthInput = document.getElementById("pomodoro-length");

let pomodoroInterval, customInterval;
let pomodoroTime = 25 * 60, pomodoroRemaining = pomodoroTime;
let customRemaining = 0;

// Funções do Pomodoro
function updatePomodoroDisplay() {
    pomodoroMinutesEl.textContent = Math.floor(pomodoroRemaining / 60).toString().padStart(2, '0');
    pomodoroSecondsEl.textContent = (pomodoroRemaining % 60).toString().padStart(2, '0');
}
window.startPomodoro = () => {
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
};
window.pausePomodoro = () => { clearInterval(pomodoroInterval); pomodoroInterval = null; };
window.resetPomodoro = () => { pausePomodoro(); pomodoroRemaining = pomodoroTime; updatePomodoroDisplay(); };

// Funções do Temporizador Customizado
function updateCustomDisplay() {
    customMinutesEl.textContent = Math.floor(customRemaining / 60).toString().padStart(2, '0');
    customSecondsEl.textContent = (customRemaining % 60).toString().padStart(2, '0');
}
window.startCustomTimer = () => {
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
};
window.pauseCustomTimer = () => { clearInterval(customInterval); customInterval = null; };
window.resetCustomTimer = () => {
    pauseCustomTimer();
    customRemaining = 0;
    customMinutesInput.value = '';
    customSecondsInput.value = '';
    updateCustomDisplay();
};

// Funções de Configurações (Firebase)
window.applySettings = async () => {
    const length = parseInt(pomodoroLengthInput.value) || 25;
    pomodoroTime = length * 60;
    resetPomodoro();
    const user = auth.currentUser;
    if (!user) return;
    try {
        await set(ref(db, `users/${user.uid}/settings/pomodoro`), { duration: length });
        alert("Configurações salvas!");
    } catch (error) { console.error("Erro ao salvar configurações:", error); }
};

async function loadUserSettings(user) {
    try {
        const snapshot = await get(ref(db, `users/${user.uid}/settings/pomodoro`));
        if (snapshot.exists()) {
            const settings = snapshot.val();
            pomodoroTime = (settings.duration || 25) * 60;
            pomodoroLengthInput.value = settings.duration || 25;
        }
    } catch (error) { console.error("Erro ao carregar configurações:", error); }
    resetPomodoro();
    updateCustomDisplay();
}
