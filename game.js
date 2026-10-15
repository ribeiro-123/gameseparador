import { COLS, ROWS, COLETA_POS, CATALOGO_ITENS, FALAS_CLIENTES, FRASES_ENTREGADORES } from './config.js';
import { atualizarInterfaceLista, atualizarEstadoControles, mostrarModalVitoria } from './ui.js';
import { desenharTudo } from './renderer.js';
import { tocarSom } from './audio.js';

export const gameState = {
  playerX: COLETA_POS.x,
  playerY: COLETA_POS.y -2,
  temItemNoCarrinho: false,
  itemColetadoAtual: null,
  listaPedido: [],
  itemAtualNoMapa: null,
  entreguesCount: 0,
  pedidosConcluidosCount: 0,
  moedasTotais: 0,
  tempoRestanteSegundos: 0,
  timerInterval: null,
  jogoAtivo: false,
  penalidadeAte: 0,
  clientes: [],
  entregadorAtivo: false,
  entregadorProgressoAnimacao: 0,
  entregadorSentido: "entrando",
  entregadorFala: "",
  joystickVector: { x: 0, y: 0 },
  ultimoMovimentoPlayer: 0,
  ultimoMovimentoNPC: 0,
  tileSize: 0,
  offsetX: 0,
  offsetY: 0
};

// --- Tutorial Interativo Guiado por Etapas (Atualizado com Checkout) ---
let passoTutorialAtivo = 0; // 0 = Nenhum, 1 = Mover, 2 = Coletar, 3 = Ir à Coleta, 4 = Soltar, 5 = Concluído

export function verificarEIniciarTutorialPrimeiraVez() {
  const jaFezTutorial = localStorage.getItem('supermarket_tutorial_concluido');
  if (!jaFezTutorial) {
    passoTutorialAtivo = 1;
    exibirModalPassoTutorial();
  }
}

function limparDestaquesTutorial() {
  document.querySelectorAll('.tutorial-destaque-zoom').forEach(el => {
    el.classList.remove('tutorial-destaque-zoom');
  });
  gameState.destacarCheckout = false; // Força a desativação imediata
}

function exibirModalPassoTutorial() {
  let modalAntigo = document.getElementById("modalTutorialPasso");
  if (modalAntigo) modalAntigo.remove();

  limparDestaquesTutorial();

  let textoMensagem = "";
  
  if (passoTutorialAtivo === 1) {
    textoMensagem = "Use o controle para mover o separador até o item indicado pelo círculo verde";
    let joystickEl = document.getElementById("joystickHandle") || document.querySelector(".joystick");
    if (joystickEl) joystickEl.classList.add('tutorial-destaque-zoom');

  } else if (passoTutorialAtivo === 2) {
    textoMensagem = "Excelente! Agora toque no ícone do carrinho para coletar o item";
    let btnAcao = document.getElementById("bAcao") || document.querySelector("btn-acao");
    if (btnAcao) btnAcao.classList.add('tutorial-destaque-zoom');

    
} else if (passoTutorialAtivo === 3) {
    textoMensagem = "Ótimo! Agora leve o item até a área de coleta (checkout) destacada embaixo no mercado.";
    gameState.destacarCheckout = true;

  } else if (passoTutorialAtivo === 4) {
    textoMensagem = "Perfeito. Agora toque novamente no ícone do carrinho para soltar o item";
    let btnAcao = document.getElementById("btnAcao") || document.querySelector(".btn-acao");
    if (btnAcao) btnAcao.classList.add('tutorial-destaque-zoom');

  } else if (passoTutorialAtivo === 5) {
    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    textoMensagem = "Parabéns você coletou o primeiro item do pedido! Agora basta coletar o restante. Boa sorte!";
    let contadorItens = document.getElementById("contadorItens") || document.querySelector(".lista-progresso");
    if (contadorItens) contadorItens.classList.add('tutorial-destaque-zoom');

  } else {
    limparDestaquesTutorial();
    return; 
  }

  gameState.jogoAtivo = false; 

  const modal = document.createElement("div");
  modal.id = "modalTutorialPasso";
  modal.style.cssText = `
    position: fixed; top: 25%; left: 50%; transform: translate(-50%, -50%);
    background: #1e293b; color: #ffffff; padding: 12px; border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 10000; width: 240px; height: 200px;
    text-align: center; font-family: sans-serif; border: 2px solid #3b82f6;
  `;

  modal.innerHTML = `
    <h3 style="margin-top: 0; color: #60a5fa; font-size: 18px;">Seja bem vindo(a)!</h3>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">${textoMensagem}</p>
    <button id="btnAvancarTutorial" style="
      background: #3b82f6; color: white; border: none; padding: 10px 20px;
      border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;
    ">Entendido</button>
  `;

  document.body.appendChild(modal);

  document.getElementById("btnAvancarTutorial").onclick = () => {
    modal.remove();
    limparDestaquesTutorial(); 
    gameState.jogoAtivo = true;
    requestAnimationFrame(loopDoJogo);

    if (passoTutorialAtivo === 5) {
      localStorage.setItem('supermarket_tutorial_concluido', 'true');
      passoTutorialAtivo = 0;
    }
  };
}

let aguardandoSaidaEntregador = false;

export function obterColunaDoCorredor(corredorNum) {
  let c = parseInt(corredorNum, 10) || 1;
  let corredorFisico = Math.ceil(c / 2);

  if (corredorFisico <= 5) {
    return 1 + (corredorFisico - 1) * 2;
  } else {
    return 13 + (corredorFisico - 6) * 2;
  }
}

export function ehPrateleira(c, r) {
  let prateleiraEsquerdaCima = (r >= 2 && r <= 4 && c >= 1 && c <= 9 && c % 2 !== 0);
  let prateleiraEsquerdaBaixo = (r >= 7 && r <= 9 && c >= 1 && c <= 9 && c % 2 !== 0);

  let prateleiraDireitaCima = (r >= 2 && r <= 4 && c >= 13 && c <= 21 && (c - 13) % 2 === 0);
  let prateleiraDireitaBaixo = (r >= 7 && r <= 9 && c >= 13 && c <= 21 && (c - 13) % 2 === 0);

  return prateleiraEsquerdaCima || prateleiraEsquerdaBaixo || prateleiraDireitaCima || prateleiraDireitaBaixo;
}

export function gerarProximoItemNoMapa() {
  if (gameState.entreguesCount >= gameState.listaPedido.length) {
    gameState.itemAtualNoMapa = null;
    return;
  }

  const proximo = gameState.listaPedido.find(i => !i.entregue);
  if (!proximo) {
    gameState.itemAtualNoMapa = null;
    return;
  }

  let corredorJson = proximo.corredor !== undefined ? parseInt(proximo.corredor, 10) : 1;
  let colunaPrateleira = obterColunaDoCorredor(corredorJson);

  let vx;
  if (corredorJson % 2 !== 0) {
    vx = colunaPrateleira - 1;
  } else {
    vx = colunaPrateleira + 1;
  }

  if (vx < 0) vx = 0;
  if (vx >= COLS) vx = COLS - 1;

  let vy = (proximo.posicao === "fundos") ? 2 : 7;

  gameState.itemAtualNoMapa = { info: proximo, x: vx, y: vy };
}

export function prepararNovoPedido() {
  const modal = document.getElementById("modalVitoria");
  if (modal) modal.style.display = "none";
  
  gameState.jogoAtivo = false; 
  aguardandoSaidaEntregador = false;
  if (gameState.timerInterval) clearInterval(gameState.timerInterval);

  gameState.playerX = COLETA_POS.x;
  gameState.playerY = COLETA_POS.y - 3;
  gameState.temItemNoCarrinho = false;
  gameState.itemColetadoAtual = null;
  gameState.entreguesCount = 0;
  gameState.penalidadeAte = 0;
  gameState.entregadorAtivo = false;
  gameState.entregadorProgressoAnimacao = 0;
  gameState.entregadorSentido = "entrando";
  gameState.entregadorFala = "";
  atualizarEstadoControles(false);

  const qtdItens = Math.floor(Math.random() * 16) + 5;
  gameState.listaPedido = [];
  
  let embaralhado = [...CATALOGO_ITENS].sort(() => 0.5 - Math.random());
  for (let i = 0; i < qtdItens; i++) {
    let baseItem = embaralhado[i % embaralhado.length];
    gameState.listaPedido.push({ ...baseItem, entregue: false });
  }


//   ##########TEMPO PARA COLETAR CADA ITEM DO PEDIDO
  gameState.tempoRestanteSegundos = gameState.listaPedido.length * 8;


  const timerText = document.getElementById("timerText");
  if (timerText) timerText.innerText = `${Math.ceil(gameState.tempoRestanteSegundos)}s`;

  gerarProximoItemNoMapa();
  atualizarInterfaceLista();

  const iconesNPC = ["🚶", "👨", "👩", "🧑", "🧓"];
  gameState.clientes = [];

  for (let i = 0; i < 2; i++) {
    let rx, ry;
    do {
      rx = Math.floor(Math.random() * 11);
      ry = Math.floor(Math.random() * ROWS);
    } while (ehPrateleira(rx, ry) || ehAreaColeta(rx, ry)); // <-- ADICIONADO AQUI

    gameState.clientes.push({
      x: rx, y: ry,
      dx: Math.random() < 0.5 ? 1 : -1,
      dy: 0,
      icone: iconesNPC[Math.floor(Math.random() * iconesNPC.length)],
      fala: "", tempoFalaAte: 0, inicioFala: 0
    });
  }

  for (let i = 0; i < 2; i++) {
    let rx, ry;
    do {
      rx = 12 + Math.floor(Math.random() * 12);
      ry = Math.floor(Math.random() * ROWS);
    } while (ehPrateleira(rx, ry) || ehAreaColeta(rx, ry)); // <-- ADICIONADO AQUI

    gameState.clientes.push({
      x: rx, y: ry,
      dx: Math.random() < 0.5 ? 1 : -1,
      dy: 0,
      icone: iconesNPC[Math.floor(Math.random() * iconesNPC.length)],
      fala: "", tempoFalaAte: 0, inicioFala: 0
    });
  }

  for (let i = 0; i < 2; i++) {
    let rx, ry;
    do {
      rx = 12 + Math.floor(Math.random() * 12);
      ry = Math.floor(Math.random() * ROWS);
    } while (ehPrateleira(rx, ry));

    gameState.clientes.push({
      x: rx, y: ry,
      dx: Math.random() < 0.5 ? 1 : -1,
      dy: 0,
      icone: iconesNPC[Math.floor(Math.random() * iconesNPC.length)],
      fala: "", tempoFalaAte: 0, inicioFala: 0
    });
  }

  desenharTudo();
  const overlayPronto = document.getElementById("overlayPronto");
  if (overlayPronto) overlayPronto.style.display = "flex";
}

export function ehAreaColeta(c, r) {
  let larguraColetaTiles = 2;
  return (
    r === COLETA_POS.y && 
    c >= COLETA_POS.x && 
    c < COLETA_POS.x + larguraColetaTiles
  );
}

export function iniciarPartidaReal() {
  const overlayPronto = document.getElementById("overlayPronto");
  if (overlayPronto) overlayPronto.style.display = "none";

  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(atualizarTimerRegressivo, 1000);

  gameState.jogoAtivo = true;
  requestAnimationFrame(loopDoJogo);

  verificarEIniciarTutorialPrimeiraVez();
}

function atualizarTimerRegressivo() {
  if (!gameState.jogoAtivo || aguardandoSaidaEntregador) return;

  gameState.tempoRestanteSegundos -= 1;
  if (gameState.tempoRestanteSegundos < 0) gameState.tempoRestanteSegundos = 0;

  const timerText = document.getElementById("timerText");
  if (timerText) timerText.innerText = `${Math.ceil(gameState.tempoRestanteSegundos)}s`;

  if (gameState.tempoRestanteSegundos <= 3.0 && !gameState.entregadorAtivo) {
    acionarEntregadorMoto();
  }

  if (gameState.tempoRestanteSegundos <= 0) {
    clearInterval(gameState.timerInterval);

    if (gameState.entregadorAtivo) {
      aguardandoSaidaEntregador = true;
    } else {
      finalizarRodadaPorTempoEsgotado();
    }
  }
}

export function acionarEntregadorMoto() {
  if (gameState.entregadorAtivo) return;
  
  gameState.entregadorAtivo = true;
  gameState.entregadorProgressoAnimacao = 0;
  gameState.entregadorSentido = "entrando";
  gameState.entregadorFala = "Pedido pronto?!";
  tocarSom('motoChegando');

  setTimeout(() => {
    if (gameState.entregadorAtivo && gameState.entregadorSentido === "parado") {
      gameState.entregadorSentido = "saindo";
      gameState.entregadorProgressoAnimacao = 0;
      gameState.entregadorFala = "Valeu, abraço!";
    }
  }, 4000); 
}

export function atualizarEntregador() {
  if (!gameState.entregadorAtivo) return;

  if (gameState.entregadorSentido === "entrando") {
    gameState.entregadorProgressoAnimacao += 0.025; 
    if (gameState.entregadorProgressoAnimacao >= 1) {
      gameState.entregadorProgressoAnimacao = 1;
      gameState.entregadorSentido = "parado";
    }
  } else if (gameState.entregadorSentido === "saindo") {
    gameState.entregadorProgressoAnimacao += 0.025; 
    if (gameState.entregadorProgressoAnimacao >= 1) {
      gameState.entregadorAtivo = false; 
      gameState.entregadorSentido = "entrando";
      gameState.entregadorProgressoAnimacao = 0;
      gameState.entregadorFala = "";     
      aguardandoSaidaEntregador = false;
      
      if (gameState.tempoRestanteSegundos <= 0) {
        finalizarRodadaPorTempoEsgotado();
      }
    }
  }
}

export function atualizarClientes(tempoAtual) {
  if (tempoAtual - gameState.ultimoMovimentoNPC > 900) {
    const direcoes = [
      {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
      {dx: 0, dy: 1}, {dx: 0, dy: -1},
      {dx: 1, dy: 1}, {dx: -1, dy: -1}
    ];

    gameState.clientes.forEach(cliente => {
      if (Math.random() < 0.75) {
        let dirAleatoria = direcoes[Math.floor(Math.random() * direcoes.length)];
        cliente.dx = dirAleatoria.dx;
        cliente.dy = dirAleatoria.dy;
      }

      let proximoX = cliente.x + cliente.dx;
      let proximoY = cliente.y + cliente.dy;

      if (proximoX < 0 || proximoX >= COLS || proximoY < 0 || proximoY >= ROWS || ehPrateleira(proximoX, proximoY)) {
        cliente.dx = -cliente.dx;
        cliente.dy = -cliente.dy;
      } else {
        cliente.x = proximoX;
        cliente.y = proximoY;
      }
    });
    gameState.ultimoMovimentoNPC = tempoAtual;
  }
}

export function loopDoJogo(tempoAtual) {
  if (!gameState.jogoAtivo) return;

  const agora = Date.now();
  const estaPenalizado = agora < gameState.penalidadeAte;

  atualizarEstadoControles(estaPenalizado);

  if (!estaPenalizado && (gameState.joystickVector.x !== 0 || gameState.joystickVector.y !== 0)) {
    let magnitude = Math.hypot(gameState.joystickVector.x, gameState.joystickVector.y);
    let intervaloDinamico = Math.max(80, 160 - (magnitude * 70));

    if (agora - gameState.ultimoMovimentoPlayer > intervaloDinamico) {
      let dx = 0;
      let dy = 0;
      if (Math.abs(gameState.joystickVector.x) > Math.abs(gameState.joystickVector.y)) {
        dx = gameState.joystickVector.x > 0 ? 1 : -1;
      } else {
        dy = gameState.joystickVector.y > 0 ? 1 : -1;
      }
      mover(dx, dy);
      gameState.ultimoMovimentoPlayer = agora;
    }
  }

  atualizarClientes(tempoAtual);
  atualizarEntregador(); 
  desenharTudo();

  requestAnimationFrame(loopDoJogo);
}

export function mover(dx, dy) {
  if (!gameState.jogoAtivo || Date.now() < gameState.penalidadeAte) return;

  let nx = gameState.playerX + dx;
  let ny = gameState.playerY + dy;

  if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
    if (!ehPrateleira(nx, ny)) {
      let clienteColidido = gameState.clientes.find(c => c.x === nx && c.y === ny);
      if (clienteColidido) {
        let agora = Date.now();
        gameState.penalidadeAte = agora + 2000;

        if (navigator.vibrate) navigator.vibrate(200);

        clienteColidido.fala = FALAS_CLIENTES[Math.floor(Math.random() * FALAS_CLIENTES.length)];
        clienteColidido.inicioFala = agora;
        clienteColidido.tempoFalaAte = agora + 2000;
        
        atualizarEstadoControles(true);
      } else {
        gameState.playerX = nx;
        gameState.playerY = ny;

        // Gatilho Passo 1 -> Passo 2 (Chegou no item)
        if (passoTutorialAtivo === 1 && gameState.itemAtualNoMapa && gameState.playerX === gameState.itemAtualNoMapa.x && gameState.playerY === gameState.itemAtualNoMapa.y) {
            passoTutorialAtivo = 2;
            exibirModalPassoTutorial();
        }

        // Gatilho Passo 3 -> Passo 4 (Chegou perto da área de coleta com o item)
        if (passoTutorialAtivo === 3 && gameState.temItemNoCarrinho) {
          let distColetaX = Math.abs(nx - COLETA_POS.x);
          let distColetaY = Math.abs(ny - COLETA_POS.y);
          if (distColetaX <= 1.5 && distColetaY <= 1.0) {
            passoTutorialAtivo = 4;
            exibirModalPassoTutorial();
          }
        }
      }
    }
  }
}

export function executarAcao() {
  if (!gameState.jogoAtivo || Date.now() < gameState.penalidadeAte) return;

  // 1. Coleta do item no mapa
  if (!gameState.temItemNoCarrinho && gameState.itemAtualNoMapa) {
    if (gameState.playerX === gameState.itemAtualNoMapa.x && gameState.playerY === gameState.itemAtualNoMapa.y) {
      gameState.temItemNoCarrinho = true;
      gameState.itemColetadoAtual = gameState.itemAtualNoMapa.info;
      tocarSom('pegarItem');

      // Transição Passo 2 -> Passo 3 (Item coletado, agora exibe modal para ir ao checkout)
      if (passoTutorialAtivo === 2) {
        passoTutorialAtivo = 3; 
        exibirModalPassoTutorial();
      }

      return;
    }
  }

  // 2. Entrega do item na Área de Coleta
  if (gameState.temItemNoCarrinho && gameState.itemColetadoAtual) {
    let distanciaX = Math.abs(gameState.playerX - COLETA_POS.x);
    let distanciaY = Math.abs(gameState.playerY - COLETA_POS.y);
    
    if (distanciaX <= 1.5 && distanciaY <= 1.0) {
      let itemNaLista = gameState.listaPedido.find(i => 
        !i.entregue && (
          (i.produto && gameState.itemColetadoAtual.produto && i.produto === gameState.itemColetadoAtual.produto) ||
          (i.nome && gameState.itemColetadoAtual.nome && i.nome === gameState.itemColetadoAtual.nome) ||
          (i.id && gameState.itemColetadoAtual.id && i.id === gameState.itemColetadoAtual.id) ||
          (i.icone && gameState.itemColetadoAtual.icone && i.icone === gameState.itemColetadoAtual.icone)
        )
      );

      if (itemNaLista) {
        itemNaLista.entregue = true;
        gameState.entreguesCount++;
        tocarSom('soltarColeta');

        // Transição Passo 4 -> Passo 5 (Item solto na fita, exibe confetes e parabéns)
        if (passoTutorialAtivo === 4) {
            passoTutorialAtivo = 5; 
            exibirModalPassoTutorial();
        }

      } else {
        let primeiroPendente = gameState.listaPedido.find(i => !i.entregue);
        if (primeiroPendente) {
          primeiroPendente.entregue = true;
          gameState.entreguesCount++;
          tocarSom('soltarColeta');
        }
      }

      gameState.temItemNoCarrinho = false;
      gameState.itemColetadoAtual = null;

      atualizarInterfaceLista();

      if (gameState.entreguesCount < gameState.listaPedido.length) {
        gerarProximoItemNoMapa();
      } else {
        gameState.itemAtualNoMapa = null;
      }
    }
  }
}

function calcularMoedasGanhas() {
  let totalItens = gameState.listaPedido.length;
  let entreguesEfetivos = Math.min(gameState.entreguesCount, totalItens);
  let percentual = Math.round((entreguesEfetivos / totalItens) * 100);
  let moedas = 0;

  if (percentual === 100) moedas = totalItens * 5;
  else if (percentual >= 76) moedas = totalItens * 4;
  else if (percentual >= 50) moedas = totalItens * 3;
  else if (percentual >= 20) moedas = totalItens * 2;
  else if (percentual >= 1) moedas = totalItens * 1;

  return { moedas, percentual };
}

function finalizarRodadaPorTempoEsgotado() {
  gameState.jogoAtivo = false;
  clearInterval(gameState.timerInterval);
  gameState.pedidosConcluidosCount++;
  atualizarEstadoControles(false);

  tocarSom('pedidoFinalizado');

  let resultado = calcularMoedasGanhas();
  gameState.moedasTotais += resultado.moedas;

  let titulo = resultado.percentual === 100 ? "🎉 Pedido Concluído com Sucesso!" : "⏰ Fim do Turno!";
  mostrarModalVitoria(titulo, resultado);
}
