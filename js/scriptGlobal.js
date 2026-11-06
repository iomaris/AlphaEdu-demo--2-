// ==================================================
// ===== SCRIPT GLOBAL - LÓGICA COMPARTILHADA =====
// ==================================================

import { getAuth, onAuthStateChanged } from "./firebase-demo.js";
import { getDatabase, ref, get } from "./firebase-demo.js";

// Exporta uma função que inicializa toda a lógica global
export function initializeGlobalLogic(auth, db ) {
    document.addEventListener('DOMContentLoaded', () => {
        // --- ELEMENTOS GLOBAIS DO DOM ---
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

        // --- LÓGICA DA SIDEBAR (ABRIR/FECHAR) ---
        if (toggleBtn && sidebar && mainContent) {
            const setSidebarState = (isHidden) => {
                sidebar.classList.toggle('hidden', isHidden);
                // Ajusta a margem do conteúdo principal quando a sidebar é alterada
                mainContent.style.marginLeft = isHidden ? '88px' : '260px';
                localStorage.setItem('sidebarState', isHidden ? 'hidden' : 'visible');
            };

            toggleBtn.addEventListener('click', () => {
                setSidebarState(!sidebar.classList.contains('hidden'));
            });

            // Aplica o estado salvo ao carregar a página
            const savedState = localStorage.getItem('sidebarState');
            if (savedState === 'hidden') {
                 setSidebarState(true);
            } else {
                 mainContent.style.marginLeft = '260px'; // Estado padrão
            }
        }

        // --- LÓGICA DO MENU DE PERFIL ---
        if (profileMenuButton && profileDropdown) {
            profileMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });
        }
        window.addEventListener('click', () => {
            if (profileDropdown) profileDropdown.classList.remove('show');
        });

        // --- AUTENTICAÇÃO E CARREGAMENTO DE DADOS DO USUÁRIO ---
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                lucide.createIcons(); // Garante que todos os ícones sejam renderizados
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const username = userData.username || 'Usuário';
                    const email = user.email;
                    const avatarInitials = (username[0] || 'U') + (username.split(' ')[1]?.[0] || '');

                    // Atualiza a UI em todos os lugares necessários
                    if (profileAvatar) profileAvatar.textContent = avatarInitials;
                    if (profileUsername) profileUsername.textContent = username;
                    if (profileEmail) profileEmail.textContent = email;
                    if (dropdownUsername) dropdownUsername.textContent = username;
                    if (dropdownEmail) dropdownEmail.textContent = email;

                    // Mostra ou esconde o botão "Sair da Turma"
                    if (leaveClassBtn) {
                        leaveClassBtn.style.display = userData.classCode ? 'flex' : 'none';
                    }
                }
            } else {
                // Se não houver usuário, redireciona para o login
                window.location.href = 'index.html';
            }
        });
    });
}
