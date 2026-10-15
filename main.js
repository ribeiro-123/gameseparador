import { gameState, prepararNovoPedido, iniciarPartidaReal, executarAcao } from './game.js';
import { initRenderer, redimensionar, desenharTudo } from './renderer.js';

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  initRenderer(canvas, ctx);

  document.getElementById("btnJogar").addEventListener("click", iniciarJogo);
  document.getElementById("btnSepararPedido").addEventListener("click", iniciarPartidaReal);

  const btnAcao = document.getElementById("bAcao");
  btnAcao.addEventListener("touchstart", (e) => { e.preventDefault(); executarAcao(); });
  btnAcao.addEventListener("click", executarAcao);

  window.addEventListener("resize", () => {
    redimensionar();
    desenharTudo();
  });

  configurarJoystick();
});

function iniciarJogo() {
  const docEl = document.documentElement;
  if (docEl.requestFullscreen) {
    docEl.requestFullscreen().catch(() => {});
  } else if (docEl.webkitRequestFullscreen) {
    docEl.webkitRequestFullscreen();
  }

  document.getElementById("telaInicial").style.display = "none";
  document.getElementById("telaSplash").style.display = "flex";

  setTimeout(() => {
    document.getElementById("telaSplash").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    
    gameState.pedidosConcluidosCount = 0;
    gameState.moedasTotais = 0;
    
    redimensionar();
    prepararNovoPedido();
  }, 12000);
}

export function atualizarInterfaceLista() {
  const ul = document.getElementById("listaItensUI");
  if (ul) {
    ul.innerHTML = "";
    gameState.listaPedido.forEach(item => {
      const li = document.createElement("li");
      if (item.entregue) li.classList.add("concluido");

      const nomeItem = document.createElement("span");
      nomeItem.textContent = `${item.icone} ${item.nome}`;

      const statusItem = document.createElement("span");
      statusItem.textContent = item.entregue ? "✅" : "";

      li.appendChild(nomeItem);
      li.appendChild(statusItem);
      ul.appendChild(li);
    });
  }

  const qtdItensNum = document.getElementById("qtdItensNum");
  if (qtdItensNum) qtdItensNum.innerText = `${gameState.entreguesCount}/${gameState.listaPedido.length}`;

  const pedidosConcluidosNum = document.getElementById("pedidosConcluidosNum");
  if (pedidosConcluidosNum) pedidosConcluidosNum.innerText = gameState.pedidosConcluidosCount;

  const moedasNum = document.getElementById("moedasNum");
  if (moedasNum) moedasNum.innerText = `${gameState.moedasTotais} 🪙`;
}

export function atualizarEstadoControles(bloquear) {
  const joystick = document.getElementById("joystickBase");
  const action = document.getElementById("actionGroup");

  if (bloquear) {
    joystick.classList.add("controles-bloqueados");
    action.classList.add("controles-bloqueados");
  } else {
    joystick.classList.remove("controles-bloqueados");
    action.classList.remove("controles-bloqueados");
  }
}

export function mostrarModalVitoria(titulo, resultado) {
  document.getElementById("tituloModal").innerText = titulo;
  document.getElementById("itensColetadosText").innerText = `${gameState.entreguesCount}/${gameState.listaPedido.length}`;
  document.getElementById("percentualText").innerText = `${resultado.percentual}%`;
  document.getElementById("moedasGanhasText").innerText = `+${resultado.moedas} 🪙`;
  document.getElementById("saldoMoedasText").innerText = `${gameState.moedasTotais} 🪙`;
  document.getElementById("modalVitoria").style.display = "flex";
  atualizarInterfaceLista();
}

// Expõe globalmente para o onclick do botão HTML do Modal funcionar facilmente
window.prepararNovoPedido = prepararNovoPedido;

function configurarJoystick() {
  const joystickBase = document.getElementById("joystickBase");
  const joystickHandle = document.getElementById("joystickHandle");
  const raioJoystick = 45;
  let joystickAtivo = false;

  joystickBase.addEventListener("touchstart", (e) => {
    e.preventDefault();
    joystickAtivo = true;
  }, {passive: false});

  window.addEventListener("touchmove", (e) => {
    if (!joystickAtivo) return;
    e.preventDefault();

    let touch = e.touches[0];
    let rect = joystickBase.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;

    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;
    let distancia = Math.hypot(deltaX, deltaY);

    if (distancia > raioJoystick) {
      deltaX = (deltaX / distancia) * raioJoystick;
      deltaY = (deltaY / distancia) * raioJoystick;
    }

    joystickHandle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    gameState.joystickVector.x = deltaX / raioJoystick;
    gameState.joystickVector.y = deltaY / raioJoystick;
  }, {passive: false});

  function resetarJoystick() {
    joystickAtivo = false;
    gameState.joystickVector = { x: 0, y: 0 };
    joystickHandle.style.transform = `translate(0px, 0px)`;
  }

  window.addEventListener("touchend", resetarJoystick);
  window.addEventListener("touchcancel", resetarJoystick);
}