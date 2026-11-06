import { initializeApp } from "./firebase-demo.js";
import { getAuth, onAuthStateChanged, signOut } from "./firebase-demo.js";
import { getDatabase, ref, get, set, push, onValue, remove, query, orderByChild, equalTo } from "./firebase-demo.js";

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
    let currentUser = null;
    let professorName = 'Professor';
    let turmasCache = {};

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const snapshot = await get(ref(db, `users/${user.uid}`));
            if (snapshot.exists() && snapshot.val().userType === 'professor') {
                const userData = snapshot.val();
                professorName = userData.username || 'Professor';
                setupGlobalUI(userData);
                initializePageLogic();
            } else {
                alert('Acesso negado.');
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
        
    });

    function setupGlobalUI(userData) {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main');
        const toggleBtn = document.getElementById('toggle-sidebar-btn');

        // ✅ LÓGICA DA SIDEBAR SIMPLIFICADA E CORRIGIDA
        const setSidebarState = (isHidden) => {
            // Apenas adiciona ou remove a classe. O CSS faz o resto.
            sidebar.classList.toggle('hidden', isHidden);
            localStorage.setItem('sidebarState', isHidden ? 'hidden' : 'visible');
        };

        toggleBtn.addEventListener('click', () => {
            setSidebarState(!sidebar.classList.contains('hidden'));
        });

        // Aplica o estado salvo ao carregar a página
        const savedState = localStorage.getItem('sidebarState');
        setSidebarState(savedState === 'hidden');
    
        // Restante da UI do perfil
        const username = userData.username || 'Professor';
        const email = userData.email || currentUser.email;
        const avatarInitials = (username[0] || '') + (username.split(' ')[1]?.[0] || '');
        document.getElementById('profile-avatar').textContent = avatarInitials;
        document.getElementById('profile-username').textContent = username;
        document.getElementById('profile-email').textContent = email;
        document.getElementById('dropdown-username').textContent = username;
        document.getElementById('dropdown-email').textContent = email;
        document.getElementById('welcome-message').textContent = `Bem-vindo(a), ${username}!`;
        document.getElementById('profile-menu-button').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('profile-dropdown').classList.toggle('show');
        });
        document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
        window.addEventListener('click', () => document.getElementById('profile-dropdown').classList.remove('show'));
        lucide.createIcons();
    }


    function initializePageLogic() {
	        setupTurmas();
	    }

    function setupTurmas() {
        const turmasGrid = document.getElementById('turmas-grid');
        const createModal = document.getElementById('class-modal');
        const joinModal = document.getElementById('join-class-modal'); // ✅ Novo modal
        const createForm = document.getElementById('class-form');
        const joinForm = document.getElementById('join-class-form'); // ✅ Novo formulário

        document.getElementById('create-class-btn').addEventListener('click', () => openCreateModal());
        document.getElementById('join-class-btn').addEventListener('click', () => joinModal.style.display = 'flex'); // ✅ Abrir modal de adicionar
        createModal.querySelector('.close-button').addEventListener('click', () => createModal.style.display = 'none');
        joinModal.querySelector('.close-button').addEventListener('click', () => joinModal.style.display = 'none');

        function openCreateModal(turma = null) {
            createForm.reset();
            document.getElementById('class-modal-title').textContent = turma ? 'Editar Turma' : 'Criar Nova Turma';
            document.getElementById('class-id-input').value = turma ? turma.id : '';
            if (turma) {
                document.getElementById('className').value = turma.name;
                document.getElementById('classYear').value = turma.year;
            }
            createModal.style.display = 'flex';
        }

        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classId = document.getElementById('class-id-input').value;
            const classData = {
                name: document.getElementById('className').value,
                year: document.getElementById('classYear').value,
                code: classId ? turmasCache[classId].code : Math.random().toString(36).substring(2, 8).toUpperCase(),
                professors: { [currentUser.uid]: true } // Adiciona o professor que criou
            };
            const idToSave = classId || push(ref(db, 'classes')).key;
            await set(ref(db, `classes/${idToSave}`), classData);
            await set(ref(db, `users/${currentUser.uid}/classes/${idToSave}`), true);
            createModal.style.display = 'none';
        });

        // ✅ 2. LÓGICA PARA ADICIONAR TURMA
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('joinCode').value.toUpperCase();
            const classesRef = query(ref(db, 'classes'), orderByChild('code'), equalTo(code));
            const snapshot = await get(classesRef);

            if (snapshot.exists()) {
                const classId = Object.keys(snapshot.val())[0];
                await set(ref(db, `classes/${classId}/professors/${currentUser.uid}`), true);
                await set(ref(db, `users/${currentUser.uid}/classes/${classId}`), true);
                alert('Você foi adicionado à turma com sucesso!');
                joinModal.style.display = 'none';
            } else {
                alert('Código de turma inválido ou não encontrado.');
            }
        });

        const userClassesRef = ref(db, `users/${currentUser.uid}/classes`);
        onValue(userClassesRef, async (snapshot) => {
            const classIds = snapshot.val() || {};
            const promises = Object.keys(classIds).map(id => get(ref(db, `classes/${id}`)));
            const classSnapshots = await Promise.all(promises);
            
            turmasCache = {};
            const professorPromises = [];

            classSnapshots.forEach(snap => {
                if (snap.exists()) {
                    const turma = { id: snap.key, ...snap.val() };
                    turmasCache[snap.key] = turma;
                    // Busca os nomes dos professores
                    if (turma.professors) {
                        Object.keys(turma.professors).forEach(profId => {
                            professorPromises.push(
                                get(ref(db, `users/${profId}/username`)).then(nameSnap => {
                                    if (!turma.professorNames) turma.professorNames = [];
                                    if (nameSnap.exists()) turma.professorNames.push(nameSnap.val());
                                })
                            );
                        });
                    }
                }
            });
            await Promise.all(professorPromises);
            renderTurmas();
        });

        function renderTurmas() {
            turmasGrid.innerHTML = "";
            if (Object.keys(turmasCache).length === 0) {
                turmasGrid.innerHTML = "<p>Nenhuma turma encontrada. Crie ou adicione uma para começar.</p>";
                return;
            }
            Object.values(turmasCache).forEach(turma => {
                const card = document.createElement('div');
                card.className = 'turma-card';
                const professorList = turma.professorNames ? turma.professorNames.join(', ') : 'Não disponível';
                card.innerHTML = `
                    <div class="turma-card-header">
                        <h4><i data-lucide="book-marked"></i> ${turma.name}</h4>
                        <div class="turma-card-actions">
                            <button class="edit-btn"><i data-lucide="edit"></i></button>
                            <button class="delete-btn"><i data-lucide="trash-2"></i></button>
                        </div>
                    </div>
                    <div class="turma-card-body">
                        <p><strong>Ano:</strong> ${turma.year}</p>
                        <p><strong>Professores:</strong> ${professorList}</p>
                    </div>
                    <div class="turma-card-footer">Código da Turma: <strong>${turma.code}</strong></div>
                `;
                card.querySelector('.edit-btn').addEventListener('click', () => openCreateModal(turma));
                card.querySelector('.delete-btn').addEventListener('click', async () => {
                    if (confirm('Tem certeza que deseja remover esta turma?')) {
                        await remove(ref(db, `classes/${turma.id}`));
                        await remove(ref(db, `users/${currentUser.uid}/classes/${turma.id}`));
                    }
                });
                turmasGrid.appendChild(card);
            });
            lucide.createIcons();
        }
    }
});
