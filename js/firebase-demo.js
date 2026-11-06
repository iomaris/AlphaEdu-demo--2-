// Modo demonstração: substitui o Firebase (auth, realtime database, storage, firestore)
// por um banco local no navegador (localStorage). Sem login, sem cadastro, sem servidor.
// shortcut: cada visitante vê só os próprios dados e o limite é ~5 MB do localStorage; trocar de volta pelo Firebase se virar produto real.

const KEY = 'alphaedu-demo-db-v1';
const PROF_PAGES = ['PainelProfessor', 'GerenciarAvisos', 'ProfessorCalendario', 'ConfiguracoesProfessor', 'EditarPerfilProfessor'];
const page = location.pathname.split('/').pop().replace('.html', '');
const isProf = PROF_PAGES.includes(page);

const STUDENT = { uid: 'demo-aluno', email: 'aluna@alphaedu.demo', displayName: 'Ana Souza' };
const TEACHER = { uid: 'demo-prof', email: 'professor@alphaedu.demo', displayName: 'Prof. Carlos Lima' };

function iso(offsetDays, hour = 9) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(hour, 0, 0, 0);
  return d;
}
const ymd = (d) => d.toISOString().slice(0, 10);

function seed() {
  const now = Date.now();
  return {
    users: {
      [STUDENT.uid]: {
        uid: STUDENT.uid, username: STUDENT.displayName, email: STUDENT.email, userType: 'aluno', classCode: 'DEMO',
        notes: {
          n1: { title: 'Resumo — Revolução Industrial', content: 'Máquina a vapor, êxodo rural, surgimento do proletariado.', rawDate: iso(-1).toISOString(), date: iso(-1).toLocaleDateString('pt-BR') },
          n2: { title: 'Fórmulas de física', content: 'v = d / t\nF = m · a\nE = m · c²', rawDate: iso(-3).toISOString(), date: iso(-3).toLocaleDateString('pt-BR') },
        },
        calendarEvents: {
          e1: { title: 'Prova de Matemática', date: ymd(iso(3)), time: '08:00', description: 'Funções do 2º grau', type: 'prova' },
          e2: { title: 'Entrega do trabalho de História', date: ymd(iso(6)), time: '23:59', description: 'Revolução Industrial', type: 'trabalho' },
        },
        flashcardCollections: {
          c1: { id: 'c1', name: 'Biologia — Célula', description: 'Organelas e funções', createdAt: now, cards: {
            k1: { pergunta: 'Qual organela produz a energia da célula?', resposta: 'A mitocôndria, pela respiração celular.', tags: ['organelas'] },
            k2: { pergunta: 'Onde fica o DNA na célula eucarionte?', resposta: 'No núcleo, protegido pela carioteca.', tags: ['núcleo'] },
            k3: { pergunta: 'Qual organela faz a fotossíntese?', resposta: 'O cloroplasto, presente nas células vegetais.', tags: ['organelas'] },
          } },
        },
        settings: { pomodoro: { duration: 25 } },
      },
      [TEACHER.uid]: {
        uid: TEACHER.uid, username: TEACHER.displayName, email: TEACHER.email, userType: 'professor',
        classes: { DEMO: true }, turmas: { DEMO: { name: '3º Ano A', code: 'DEMO' } },
      },
    },
    classes: {
      DEMO: {
        name: '3º Ano A', code: 'DEMO', year: '2026', subject: 'Matemática', professors: { [TEACHER.uid]: true },
        notices: {
          a1: { title: 'Prova na quinta-feira', text: 'Conteúdo: funções do 2º grau. Tragam calculadora.', author: TEACHER.displayName, date: iso(-1).toISOString() },
          a2: { title: 'Aula de reposição', text: 'Sábado, das 9h às 11h, na sala 12.', author: TEACHER.displayName, date: iso(-2).toISOString() },
        },
        events: { pe1: { title: 'Prova de Matemática', date: ymd(iso(3)), time: '08:00', description: 'Funções do 2º grau' } },
      },
    },
    avisos: {
      DEMO: {
        a1: { title: 'Prova na quinta-feira', content: 'Conteúdo: funções do 2º grau. Tragam calculadora.', text: 'Conteúdo: funções do 2º grau. Tragam calculadora.', author: TEACHER.displayName, date: iso(-1).toISOString(), timestamp: now },
      },
    },
  };
}

let root;
try { root = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { root = seed(); }
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(root)); } catch (e) { console.warn('Demo: armazenamento cheio', e); } };
persist();

const split = (p) => String(p || '').split('/').filter(Boolean);
const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
function read(path) { let n = root; for (const k of split(path)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n ?? null; }
function write(path, value) {
  const keys = split(path);
  if (!keys.length) { root = value ?? {}; return; }
  let n = root;
  for (const k of keys.slice(0, -1)) { if (n[k] == null || typeof n[k] !== 'object') n[k] = {}; n = n[k]; }
  const last = keys.at(-1);
  if (value === null || value === undefined) delete n[last]; else n[last] = clone(value);
}

// ---------- firebase-app ----------
export const initializeApp = (config) => ({ config });

// ---------- firebase-auth ----------
const baseUser = isProf ? TEACHER : STUDENT;
const currentUser = { ...baseUser, ...(read(`_auth/${baseUser.uid}`) || {}), emailVerified: true };
const auth = { currentUser };
export const getAuth = () => auth;
export const onAuthStateChanged = (_a, cb) => { setTimeout(() => cb(currentUser), 0); return () => {}; };
export const signOut = async () => { location.href = 'index.html'; };
export const deleteUser = async () => { localStorage.removeItem(KEY); location.href = 'index.html'; };
export const updatePassword = async () => {};
export const updateProfile = async (u, data) => { Object.assign(u, data); write(`_auth/${u.uid}`, data); persist(); };
export const updateEmail = async (u, email) => { u.email = email; write(`_auth/${u.uid}/email`, email); persist(); };
export const reauthenticateWithCredential = async () => {};
export const EmailAuthProvider = { credential: () => ({}) };
export class GoogleAuthProvider {}
export const signInWithEmailAndPassword = async () => ({ user: currentUser });
export const createUserWithEmailAndPassword = async () => ({ user: currentUser });
export const signInWithPopup = async () => ({ user: currentUser });

// ---------- firebase-database ----------
const DB = { kind: 'db' };
export const getDatabase = () => DB;
const mkRef = (path) => ({ path: split(path).join('/'), key: split(path).at(-1) ?? null, constraints: [] });
export const ref = (_db, path = '') => mkRef(path);
export const child = (parent, path) => mkRef(`${parent.path}/${path}`);
export const orderByChild = (k) => ({ type: 'orderByChild', k });
export const equalTo = (v) => ({ type: 'equalTo', v });
export const orderByKey = () => ({ type: 'orderByKey' });
export const limitToLast = (n) => ({ type: 'limitToLast', n });
export const query = (r, ...constraints) => ({ ...r, constraints: [...r.constraints, ...constraints] });

function makeSnap(key, value) {
  return {
    key, exists: () => value !== null && value !== undefined, val: () => clone(value),
    forEach(cb) { if (value && typeof value === 'object') for (const k of Object.keys(value)) if (cb(makeSnap(k, value[k])) === true) return true; return false; },
    child: (p) => makeSnap(split(p).at(-1), split(p).reduce((n, k) => (n == null ? null : n[k] ?? null), value)),
    hasChildren: () => !!value && typeof value === 'object' && Object.keys(value).length > 0,
    size: value && typeof value === 'object' ? Object.keys(value).length : 0,
  };
}
function evaluate(r) {
  let v = read(r.path);
  const by = r.constraints.find((c) => c.type === 'orderByChild');
  const eq = r.constraints.find((c) => c.type === 'equalTo');
  if (v && typeof v === 'object' && by && eq) {
    v = Object.fromEntries(Object.entries(v).filter(([, c]) => split(by.k).reduce((n, k) => (n == null ? undefined : n[k]), c) === eq.v));
    if (!Object.keys(v).length) v = null;
  }
  return makeSnap(r.key, v);
}

const listeners = new Set();
const notify = () => { persist(); listeners.forEach((l) => l.cb(evaluate(l.ref))); };

export const get = async (r) => evaluate(r);
export const set = async (r, value) => { write(r.path, value); notify(); };
export const update = async (r, values) => { for (const [k, v] of Object.entries(values || {})) write(`${r.path}/${k}`, v); notify(); };
export const remove = async (r) => { write(r.path, null); notify(); };
let pushCount = 0;
export function push(r, value) {
  const key = '-demo' + Date.now().toString(36) + (pushCount++).toString(36);
  const nr = mkRef(`${r.path}/${key}`);
  const p = value === undefined ? Promise.resolve(nr) : set(nr, value).then(() => nr);
  return Object.assign(p, nr);
}
export function onValue(r, cb) {
  const l = { ref: r, cb }; listeners.add(l);
  setTimeout(() => cb(evaluate(r)), 0);
  return () => listeners.delete(l);
}
export const off = () => {};
export const serverTimestamp = () => Date.now();

// ---------- firebase-storage ----------
export const getStorage = () => ({ kind: 'storage' });
export const uploadBytes = (sr, file) => new Promise((resolve) => {
  // arquivos ficam no próprio navegador; os grandes só valem até fechar a aba
  if (file.size > 1.5e6) { write(`_files/${sr.path}`, URL.createObjectURL(file)); persist(); return resolve({ ref: sr }); }
  const fr = new FileReader();
  fr.onload = () => { write(`_files/${sr.path}`, fr.result); persist(); resolve({ ref: sr }); };
  fr.readAsDataURL(file);
});
export const getDownloadURL = async (sr) => read(`_files/${sr.path}`) || '#';
export const deleteObject = async (sr) => { write(`_files/${sr.path}`, null); persist(); };

// ---------- firebase-firestore ----------
export const getFirestore = () => ({ kind: 'fs' });
export const doc = (_fs, col, id) => ({ path: `_fs/${col}/${id}` });
export const getDoc = async (d) => { const v = read(d.path); return { exists: () => v != null, data: () => clone(v) }; };
export const setDoc = async (d, data, opts) => { write(d.path, opts?.merge ? { ...(read(d.path) || {}), ...data } : data); persist(); };
export const updateDoc = async (d, data) => { write(d.path, { ...(read(d.path) || {}), ...data }); persist(); };
export const deleteDoc = async (d) => { write(d.path, null); persist(); };

// Atalho para recomeçar a demonstração do zero (usado pelo botão "Reiniciar demo")
export const resetDemo = () => { localStorage.removeItem(KEY); location.reload(); };
window.alphaEduResetDemo = resetDemo;
