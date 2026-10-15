import { gameState, iniciarPartidaReal, prepararNovoPedido } from './game.js';

export function initUI() {
  const btnPronto = document.getElementById("btnSepararPedido") || document.getElementById("btnPronto");
  if (btnPronto) {
    btnPronto.addEventListener("click", () => {
      iniciarPartidaReal();
    });
  }

  // Se houver botões de reiniciar no modal ou tela
  const botoesReiniciar = document.querySelectorAll("#btnReiniciarModal, .btn-reiniciar");
  botoesReiniciar.forEach(btn => {
    btn.addEventListener("click", () => {
      prepararNovoPedido();
    });
  });
}

export function atualizarInterfaceLista() {
  const listaContainer = document.getElementById("listaPedidoContainer");
  if (!listaContainer) return;
  
  listaContainer.innerHTML = "";

  if (!gameState.listaPedido || gameState.listaPedido.length === 0) {
    listaContainer.innerHTML = "<div style='text-align: center; color: #64748b; padding: 8px; font-size: 10px;'>Nenhum pedido ativo</div>";
    return;
  }

  // Renderização limpa, compacta e moderna dos itens na lista
  gameState.listaPedido.forEach(item => {
    let li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.padding = "4px 6px";
    li.style.marginBottom = "3px";
    li.style.borderRadius = "4px";
    li.style.backgroundColor = item.entregue ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.05)";
    li.style.border = "none";
    
    if (item.entregue) {
      li.style.opacity = "0.5";
      li.style.textDecoration = "line-through";
    }

    let esquerda = document.createElement("div");
    esquerda.style.display = "flex";
    esquerda.style.alignItems = "center";
    esquerda.style.gap = "6px";

    let iconeSpan = document.createElement("span");
    iconeSpan.innerText = item.icone || "📦";
    iconeSpan.style.fontSize = "13px";

    let nomeSpan = document.createElement("span");
    nomeSpan.innerText = item.produto || "Produto";
    nomeSpan.style.fontSize = "10px";
    nomeSpan.style.fontWeight = "600";
    nomeSpan.style.color = item.entregue ? "#94a3b8" : "#f8fafc";

    esquerda.appendChild(iconeSpan);
    esquerda.appendChild(nomeSpan);
    li.appendChild(esquerda);

    let statusSpan = document.createElement("span");
    statusSpan.innerText = item.entregue ? "✅" : "⏳";
    statusSpan.style.fontSize = "10px";
    li.appendChild(statusSpan);

    listaContainer.appendChild(li);
  });

  // Sincronizado corretamente com os IDs reais do seu index.html
  const moedasNum = document.getElementById("moedasNum");
  if (moedasNum) moedasNum.innerText = `${gameState.moedasTotais} 🪙`;

  const pedidosConcluidosNum = document.getElementById("pedidosConcluidosNum");
  if (pedidosConcluidosNum) pedidosConcluidosNum.innerText = gameState.pedidosConcluidosCount;
  
  const itensEntreguesText = document.getElementById("itensEntreguesText");
  if (itensEntreguesText) {
    let totalItens = gameState.listaPedido.length;
    itensEntreguesText.innerText = `${gameState.entreguesCount}/${totalItens}`;
  }

  // Atualiza também os campos do modal de vitória, caso existam
  const itensColetadosText = document.getElementById("itensColetadosText");
  if (itensColetadosText) {
    let totalItens = gameState.listaPedido.length;
    itensColetadosText.innerText = `${gameState.entreguesCount}/${totalItens}`;
  }

  const saldoMoedasText = document.getElementById("saldoMoedasText");
  if (saldoMoedasText) saldoMoedasText.innerText = `${gameState.moedasTotais} 🪙`;
}

export function atualizarEstadoControles(penalizado) {
  const alerta = document.getElementById("alertaPenalidade");
  if (alerta) {
    alerta.style.display = penalizado ? "block" : "none";
  }
}

export function mostrarModalVitoria(titulo, resultado) {
  const tituloModal = document.getElementById("tituloModal");
  if (tituloModal) tituloModal.innerText = titulo;

  const moedasGanhasText = document.getElementById("moedasGanhasText");
  if (moedasGanhasText) moedasGanhasText.innerText = `+${resultado.moedas} 🪙`;

  const percentualText = document.getElementById("percentualText");
  if (percentualText) percentualText.innerText = `${resultado.percentual}%`;

  const saldoMoedasText = document.getElementById("saldoMoedasText");
  if (saldoMoedasText) saldoMoedasText.innerText = `${gameState.moedasTotais} 🪙`;

  const modalVitoria = document.getElementById("modalVitoria");
  if (modalVitoria) modalVitoria.style.display = "flex";
}