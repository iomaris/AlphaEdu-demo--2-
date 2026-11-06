// Flashcard do topo da página inicial: clique vira, "Próximo cartão" troca.
const cartoes = [
  { materia: 'Biologia', pergunta: 'Qual organela produz a energia da célula?', resposta: 'A mitocôndria, pela respiração celular.' },
  { materia: 'História', pergunta: 'Que invenção marcou o início da Revolução Industrial?', resposta: 'A máquina a vapor, aperfeiçoada por James Watt.' },
  { materia: 'Física', pergunta: 'O que diz a segunda lei de Newton?', resposta: 'Força é igual a massa vezes aceleração: F = m · a.' },
  { materia: 'Geografia', pergunta: 'Quais rios se encontram em frente a Manaus?', resposta: 'O Rio Negro e o Solimões, no Encontro das Águas.' },
];

const ficha = document.getElementById('ficha');
const dica = document.getElementById('ficha-dica');
let atual = 0;

function mostrar(i) {
  const c = cartoes[i];
  document.getElementById('ficha-materia').textContent = c.materia;
  document.getElementById('ficha-pergunta').textContent = c.pergunta;
  document.getElementById('ficha-resposta').textContent = c.resposta;
}

ficha.addEventListener('click', () => {
  const virada = ficha.classList.toggle('virada');
  dica.textContent = virada ? 'Clique de novo para voltar à pergunta' : 'Clique no cartão para ver a resposta';
});

document.getElementById('ficha-proxima').addEventListener('click', () => {
  atual = (atual + 1) % cartoes.length;
  ficha.classList.remove('virada');
  dica.textContent = 'Clique no cartão para ver a resposta';
  mostrar(atual);
});
