import { initializeApp } from "./firebase-demo.js";
import { 
  getAuth, onAuthStateChanged, updateProfile, updatePassword, signOut
} from "./firebase-demo.js";
import { getFirestore, doc, updateDoc } from "./firebase-demo.js";

// 🔹 Configuração do Firebase (copie do seu painel)
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
const db = getFirestore(app);

const nome = document.getElementById("profile-name");
const email = document.getElementById("profile-email");
const senha = document.getElementById("profile-password");
const form = document.getElementById("profile-form");
const mensagem = document.getElementById("mensagem");

// Carregar dados do professor logado
onAuthStateChanged(auth, (user) => {
  if (user) {
    nome.value = user.displayName || "";
    email.value = user.email || "";
    document.querySelector(".username").textContent = user.displayName || "Professor";
    document.querySelector(".email").textContent = user.email;
    document.querySelector(".profile-avatar").textContent = (user.displayName?.[0] || "P").toUpperCase();
  } else {
    window.location.href = "index.html";
  }
});

// Atualizar dados
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const novoNome = nome.value.trim();
  const novaSenha = senha.value.trim();

  try {
    await updateProfile(user, { displayName: novoNome });
    const ref = doc(db, "professores", user.uid);
    await updateDoc(ref, { nome: novoNome });

    if (novaSenha) await updatePassword(user, novaSenha);

    mensagem.textContent = "✅ Dados atualizados com sucesso!";
    mensagem.style.color = "var(--accent)";
    senha.value = "";
  } catch (erro) {
    mensagem.textContent = "❌ Erro: " + erro.message;
    mensagem.style.color = "var(--danger)";
  }
});
