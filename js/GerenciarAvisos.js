import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged, signOut } from "./firebase-demo.js";
import { getDatabase, ref, get, child, push, update, remove, onValue } from "./firebase-demo.js";

// Sua configuração do Firebase
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

let currentUserUid = null;
let currentUserName = null;

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. LÓGICA GLOBAL (SIDEBAR, PERFIL, AUTH) ---
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main");
    const toggleBtn = document.getElementById("toggle-sidebar-btn");
    const profileMenuButton = document.getElementById("profile-menu-button");
    const profileDropdown = document.getElementById("profile-dropdown");
    const profileAvatar = document.getElementById("profile-avatar");
    const profileUsername = document.getElementById("profile-username");
    const profileEmail = document.getElementById("profile-email");
    const dropdownUsername = document.getElementById("dropdown-username");
    const dropdownEmail = document.getElementById("dropdown-email");
    const logoutButton = document.getElementById("logout-btn");

    if (toggleBtn && sidebar && mainContent) {
        const setSidebarState = (isHidden) => {
            sidebar.classList.toggle("hidden", isHidden);
            mainContent.style.marginLeft = isHidden ? "88px" : "260px"; // Ajusta a margem do main content
            localStorage.setItem("sidebarState", isHidden ? "hidden" : "visible");
        };
        toggleBtn.addEventListener("click", () => setSidebarState(!sidebar.classList.contains("hidden")));
        const savedState = localStorage.getItem("sidebarState");
        setSidebarState(savedState === "hidden");
    }

    if (profileMenuButton) {
        profileMenuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("show");
        });
    }
    window.addEventListener("click", () => {
        if (profileDropdown) profileDropdown.classList.remove("show");
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = "index.html"; // Redireciona para a página inicial ou de login
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                alert("Erro ao fazer logout. Tente novamente.");
            }
        });
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserUid = user.uid;
            const dbRef = ref(db);
            try {
                const snapshot = await get(child(dbRef, `users/${currentUserUid}`));
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    if (userData.userType !== "professor") {
                        alert("Acesso negado. Você não tem permissão de professor.");
                        window.location.href = "PainelAluno.html"; // Redireciona para o painel se não for professor
                        return;
                    }
                    currentUserName = userData.username;
                    const email = userData.email;
                    const avatarInitials = (currentUserName.split(" ")[0][0] || "") + (currentUserName.split(" ")[1]?.[0] || "");

                    if (profileAvatar) profileAvatar.textContent = avatarInitials;
                    if (profileUsername) profileUsername.textContent = currentUserName;
                    if (profileEmail) profileEmail.textContent = email;
                    if (dropdownUsername) dropdownUsername.textContent = currentUserName;
                    if (dropdownEmail) dropdownEmail.textContent = email;

                    // Inicializa a lógica de avisos após o login e verificação de perfil
                    initAvisos(db, currentUserUid, currentUserName);

                } else {
                    console.log("Nenhum dado disponível para este usuário.");
                    alert("Dados do usuário não encontrados. Faça login novamente.");
                    window.location.href = "index.html";
                }
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                alert("Erro ao carregar dados do usuário. Faça login novamente.");
                window.location.href = "index.html";
            }
        }
    });

    // Função showPage para navegação (mantida para compatibilidade, mas não usada diretamente neste HTML)
    window.showPage = (pageId) => {
        // Esta função é mais relevante para um SPA que carrega conteúdo dinamicamente.
        // Para este HTML, a navegação é feita por links diretos, mas a classe 'active' pode ser gerenciada.
        document.querySelectorAll(".sidebar nav a").forEach(link => link.classList.remove("active"));
        const activeLink = document.querySelector(`.sidebar nav a[href*=\'${pageId}.html\']`);
        if (activeLink) activeLink.classList.add("active");
        // Em um cenário de múltiplas páginas, você redirecionaria: window.location.href = `${pageId}.html`;
    };

    // Re-renderiza os ícones do Lucide
    lucide.createIcons();
});

// --- Lógica específica de Gerenciar Avisos ---
export function initAvisos(db, currentUserUid, currentUserName) {
    const addAvisoBtn = document.getElementById("add-aviso-btn");
    const avisoModal = document.getElementById("aviso-modal");
    const avisoModalTitle = document.getElementById("aviso-modal-title");
    const avisoForm = document.getElementById("aviso-form");
    const avisoIdInput = document.getElementById("aviso-id-input");
    const avisoTitleInput = document.getElementById("aviso-title");
    const avisoContentInput = document.getElementById("aviso-text");
    const avisoTurmaSelect = document.getElementById("aviso-turma");
    const avisosList = document.getElementById("avisos-list");
    const closeButtons = avisoModal ? avisoModal.querySelectorAll(".close-button") : [];

    let editingAvisoId = null;

    if (!addAvisoBtn || !avisoModal || !avisoForm || !avisosList) {
        console.error("Elementos de aviso não encontrados no DOM.");
        return;
    }

    // Carregar turmas do professor logado
    const loadTurmas = async () => {
        avisoTurmaSelect.innerHTML = "";
        const turmasRef = ref(db, `users/${currentUserUid}/turmas`);
        const snapshot = await get(turmasRef);
        if (snapshot.exists()) {
            const turmas = snapshot.val();
            Object.keys(turmas).forEach(turmaId => {
                const option = document.createElement("option");
                option.value = turmaId;
                option.textContent = turmas[turmaId].name; // Assumindo que a turma tem um nome
                avisoTurmaSelect.appendChild(option);
            });
        } else {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Nenhuma turma disponível";
            option.disabled = true;
            avisoTurmaSelect.appendChild(option);
        }
    };

    // Abrir modal para adicionar novo aviso
    addAvisoBtn.addEventListener("click", () => {
        editingAvisoId = null;
        avisoModalTitle.textContent = "Novo Aviso";
        avisoIdInput.value = "";
        avisoTitleInput.value = "";
        avisoContentInput.value = "";
        loadTurmas(); // Carrega as turmas sempre que o modal é aberto
        avisoModal.style.display = "flex";
    });

    // Fechar modal
    closeButtons.forEach(button => {
        button.addEventListener("click", () => {
            avisoModal.style.display = "none";
        });
    });
    window.addEventListener("click", (event) => {
        if (event.target == avisoModal) {
            avisoModal.style.display = "none";
        }
    });

    // Salvar/Atualizar aviso
    avisoForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = avisoTitleInput.value;
        const content = avisoContentInput.value;
        const turmaId = avisoTurmaSelect.value;

        if (!title || !content || !turmaId) {
            alert("Por favor, preencha todos os campos e selecione uma turma.");
            return;
        }

        const avisoData = {
            title,
            content,
            author: currentUserName, // Nome do professor logado
            timestamp: Date.now(),
            turmaId: turmaId
        };

        try {
            if (editingAvisoId) {
                // Atualizar aviso existente
                await update(ref(db, `avisos/${turmaId}/${editingAvisoId}`), avisoData);
                alert("Aviso atualizado com sucesso!");
            } else {
                // Criar novo aviso
                await push(ref(db, `avisos/${turmaId}`), avisoData);
                alert("Aviso criado com sucesso!");
            }
            avisoModal.style.display = "none";
            // A lista será atualizada automaticamente pelo onValue listener
        } catch (error) {
            console.error("Erro ao salvar aviso:", error);
            alert("Erro ao salvar aviso. Tente novamente.");
        }
    });

    // Renderizar aviso na lista
    const renderAviso = (avisoId, aviso) => {
        const existingCard = document.getElementById(`aviso-${avisoId}`);
        if (existingCard) {
            existingCard.remove(); // Remove para re-renderizar com dados atualizados
        }

        const card = document.createElement("div");
        card.id = `aviso-${avisoId}`;
        card.classList.add("aviso-card");

        const date = new Date(aviso.timestamp);
        const formattedDate = date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="aviso-card-content">
                <h4>${aviso.title}</h4>
                <p class="meta">Por ${aviso.author} em ${formattedDate} para Turma: ${aviso.turmaName || 'N/A'}</p>
                <p>${aviso.content}</p>
            </div>
            <div class="aviso-actions">
                <button class="edit-btn" data-id="${avisoId}" data-turma-id="${aviso.turmaId}"><i data-lucide="edit"></i></button>
                <button class="delete-btn" data-id="${avisoId}" data-turma-id="${aviso.turmaId}"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        avisosList.prepend(card); // Adiciona os mais novos no topo

        // Adiciona event listeners para os novos botões
        card.querySelector(".edit-btn").addEventListener("click", (e) => editAviso(e.currentTarget.dataset.id, e.currentTarget.dataset.turmaId));
        card.querySelector(".delete-btn").addEventListener("click", (e) => deleteAviso(e.currentTarget.dataset.id, e.currentTarget.dataset.turmaId));
        lucide.createIcons(); // Re-renderiza ícones para o novo card
    };

    // Editar aviso
    const editAviso = async (avisoId, turmaId) => {
        const avisoRef = ref(db, `avisos/${turmaId}/${avisoId}`);
        const snapshot = await get(avisoRef);
        if (snapshot.exists()) {
            const aviso = snapshot.val();
            editingAvisoId = avisoId;
            avisoModalTitle.textContent = "Editar Aviso";
            avisoIdInput.value = avisoId;
            avisoTitleInput.value = aviso.title;
            avisoContentInput.value = aviso.content;
            await loadTurmas(); // Carrega as turmas
            avisoTurmaSelect.value = turmaId; // Seleciona a turma correta
            avisoModal.style.display = "flex";
        } else {
            alert("Aviso não encontrado.");
        }
    };

    // Deletar aviso
    const deleteAviso = async (avisoId, turmaId) => {
        if (confirm("Tem certeza que deseja excluir este aviso?")) {
            try {
                await remove(ref(db, `avisos/${turmaId}/${avisoId}`));
                document.getElementById(`aviso-${avisoId}`).remove();
                alert("Aviso excluído com sucesso!");
            } catch (error) {
                console.error("Erro ao excluir aviso:", error);
                alert("Erro ao excluir aviso. Tente novamente.");
            }
        }
    };

    // Listener para carregar e exibir avisos em tempo real
    const loadAvisos = async () => {
        avisosList.innerHTML = ""; // Limpa a lista antes de carregar
        const turmasRef = ref(db, `users/${currentUserUid}/turmas`);
        const turmasSnapshot = await get(turmasRef);
        if (turmasSnapshot.exists()) {
            const turmas = turmasSnapshot.val();
            for (const turmaId in turmas) {
                const turmaName = turmas[turmaId].name; // Pega o nome da turma
                const avisosTurmaRef = ref(db, `avisos/${turmaId}`);
                onValue(avisosTurmaRef, (snapshot) => {
                    snapshot.forEach((childSnapshot) => {
                        const avisoId = childSnapshot.key;
                        const aviso = { ...childSnapshot.val(), turmaName }; // Adiciona o nome da turma ao aviso
                        renderAviso(avisoId, aviso);
                    });
                });
            }
        } else {
            avisosList.innerHTML = "<p>Nenhum aviso encontrado. Crie uma turma primeiro.</p>";
        }
    };

    loadAvisos();

    // Lógica de busca (opcional, pode ser implementada aqui)
    const searchAvisosInput = document.getElementById("search-avisos");
    if (searchAvisosInput) {
        searchAvisosInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll(".aviso-card").forEach(card => {
                const title = card.querySelector("h4").textContent.toLowerCase();
                const content = card.querySelector("p").textContent.toLowerCase();
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }
}

