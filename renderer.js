import { COLS, ROWS, COLETA_POS } from './config.js';
import { gameState, ehPrateleira } from './game.js';

let canvas, ctx;

const assets = {
  cart: new Image(),
  checkout: new Image(),
  floor: new Image(),
  moto: new Image(),
  shelves: [new Image(), new Image()],
  customers: [
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image()
  ],
};

let assetsLoaded = {
  cart: false,
  checkout: false,
  floor: false,
  moto: false,
  shelves: [false, false],
  customers: [false, false, false, false, false, false],
};

let allAssetsReady = false;

let imagemItemCache = null;
let urlImagemItemCache = "";

export function initRenderer(c, context) {
  canvas = c;
  ctx = context;
  carregarAssets();
}

function carregarImagem(imagem, caminho, aoCarregar) {
  return new Promise(resolve => {
    imagem.onload = () => {
      aoCarregar();
      resolve();
    };

    imagem.onerror = () => {
      resolve();
    };

    imagem.src = caminho;
  });
}

function carregarAssets() {
  const promessas = [
    carregarImagem(
      assets.cart,
      './assets/cart.png',
      () => {
        assetsLoaded.cart = true;
      }
    ),

    carregarImagem(
      assets.checkout,
      './assets/checkout.png',
      () => {
        assetsLoaded.checkout = true;
      }
    ),

    carregarImagem(
      assets.floor,
      './assets/floor.png',
      () => {
        assetsLoaded.floor = true;
      }
    ),

    carregarImagem(
      assets.moto,
      './assets/moto.png',
      () => {
        assetsLoaded.moto = true;
      }
    ),
  ];

  for (let i = 0; i < assets.shelves.length; i++) {
    promessas.push(
      carregarImagem(
        assets.shelves[i],
        `./assets/shelf-0${i + 1}.png`,
        () => {
          assetsLoaded.shelves[i] = true;
        }
      )
    );
  }

  for (let i = 0; i < assets.customers.length; i++) {
    promessas.push(
      carregarImagem(
        assets.customers[i],
        `./assets/customer-0${i + 1}.png`,
        () => {
          assetsLoaded.customers[i] = true;
        }
      )
    );
  }

  Promise.all(promessas).then(() => {
    allAssetsReady = true;
    desenharTudo();
  });
}

export function redimensionar() {
  if (!canvas) return;

  const larguraPainelLateral = 215;

  canvas.width = Math.max(
    0,
    window.innerWidth - larguraPainelLateral
  );

  canvas.height = window.innerHeight;

  const margemEsquerda = 40;

  const larguraDisponivel = canvas.width * 0.80;
  const alturaDisponivel = canvas.height * 0.78;

  gameState.tileWidth = Math.max(
    15,
    larguraDisponivel / COLS
  );

  gameState.tileHeight = Math.max(
    15,
    alturaDisponivel / ROWS
  );

  gameState.tileSize = Math.min(
    gameState.tileWidth,
    gameState.tileHeight
  );

  gameState.offsetX =
    margemEsquerda +
    (larguraDisponivel - COLS * gameState.tileWidth) / 2;

  gameState.offsetY = 5;
}

export function desenharTudo() {
  if (
    !canvas ||
    !ctx ||
    canvas.width === 0 ||
    !allAssetsReady
  ) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const tw = gameState.tileWidth;
  const th = gameState.tileHeight;

  // ==========================================
  // 1. CHÃO DO MERCADO
  // ==========================================

  if (assetsLoaded.floor) {
    const pattern = ctx.createPattern(
      assets.floor,
      'repeat'
    );

    if (pattern) {
      ctx.fillStyle = pattern;

      ctx.fillRect(
        gameState.offsetX,
        gameState.offsetY,
        COLS * tw,
        ROWS * th
      );
    } else {
      ctx.fillStyle = '#181818';

      ctx.fillRect(
        gameState.offsetX,
        gameState.offsetY,
        COLS * tw,
        ROWS * th
      );
    }
  } else {
    ctx.fillStyle = '#181818';

    ctx.fillRect(
      gameState.offsetX,
      gameState.offsetY,
      COLS * tw,
      ROWS * th
    );
  }

  // ==========================================
  // 2. PRATELEIRAS
  // ==========================================

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!ehPrateleira(c, r)) {
        continue;
      }

      const x = gameState.offsetX + c * tw;
      const y = gameState.offsetY + r * th;

      const shelfIndex = c % 2;

      if (assetsLoaded.shelves[shelfIndex]) {
        ctx.drawImage(
          assets.shelves[shelfIndex],
          x,
          y,
          tw,
          th
        );
      } else {
        ctx.fillStyle = '#3e2723';

        ctx.fillRect(
          x + 1,
          y + 1,
          tw - 2,
          th - 2
        );
      }
    }
  }

  // Contorno do mercado
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;

  ctx.strokeRect(
    gameState.offsetX,
    gameState.offsetY,
    COLS * tw,
    ROWS * th
  );

  // ==========================================
  // 3. ÁREA DE COLETA / CHECKOUT
  // ==========================================

  let larguraColetaTiles = 2; 
  let coletaX = gameState.offsetX + (COLETA_POS.x * tw);
  let coletaY = gameState.offsetY + (COLETA_POS.y * th);

  let centroColetaX = coletaX + (tw * larguraColetaTiles) / 2;
  let centroColetaY = coletaY + (th / 2);
  let raioDestaque = Math.max(tw, th) * 0.9;

  // SÓ DESENHA O CÍRCULO DE DESTAQUE SE ESTIVER EXATAMENTE NO PASSO DO TUTORIAL
  if (gameState.destacarCheckout === true) {
    let fatorPulsarColeta = Math.sin(Date.now() / 150) * 0.25 + 0.9;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centroColetaX, centroColetaY, raioDestaque * fatorPulsarColeta, 0, Math.PI * 2);
    
    // Cores super chamativas em tom dourado/amarelo vibrante
    ctx.fillStyle = "rgba(234, 179, 8, 0.35)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(250, 204, 21, 1)";
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // Desenho da Esteira/Checkout em si
  if (assetsLoaded.checkout) {
    ctx.drawImage(assets.checkout, coletaX, coletaY, tw * larguraColetaTiles, th);
  } else {
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(coletaX, coletaY, tw * larguraColetaTiles, th);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.min(tw, th) * 0.25}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("📦 COLETA", centroColetaX, centroColetaY);
  }

  // ==========================================
  // 4. ITEM DISPONÍVEL NO MAPA
  // ==========================================

  if (
    gameState.itemAtualNoMapa &&
    !gameState.temItemNoCarrinho
  ) {
    const item = gameState.itemAtualNoMapa;

    const ix =
      gameState.offsetX + item.x * tw;

    const iy =
      gameState.offsetY + item.y * th;

    const fatorPulsar =
      Math.sin(Date.now() / 250) * 0.15 + 0.85;

    const tamanhoDinamico =
      Math.min(tw, th) * 0.45 * fatorPulsar;

    ctx.shadowColor = '#0bf52a';
    ctx.shadowBlur = 12;

    ctx.beginPath();

    ctx.arc(
      ix + tw / 2,
      iy + th / 2,
      tamanhoDinamico,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#07662b';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (item.info && item.info.url) {
      const urlImagem = item.info.url;

      if (urlImagem !== urlImagemItemCache) {
        urlImagemItemCache = urlImagem;
        imagemItemCache = new Image();

        imagemItemCache.onload = () => {
          desenharTudo();
        };

        imagemItemCache.onerror = () => {
          imagemItemCache = null;
          desenharTudo();
        };

        imagemItemCache.src = urlImagem;
      }

      if (
        imagemItemCache &&
        imagemItemCache.complete &&
        imagemItemCache.naturalWidth > 0
      ) {
        ctx.drawImage(
          imagemItemCache,
          ix,
          iy,
          tw,
          th
        );
      } else {
        desenharEmojiItem(ix, iy, tw, th);
      }
    } else {
      desenharEmojiItem(ix, iy, tw, th);
    }
  }

  // ==========================================
  // 5. CLIENTES
  // ==========================================

  const agora = Date.now();

  gameState.clientes.forEach((cliente, index) => {
    const cx =
      gameState.offsetX + cliente.x * tw;

    const cy =
      gameState.offsetY + cliente.y * th;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';

    ctx.beginPath();

    ctx.arc(
      cx + tw / 2,
      cy + th * 0.75,
      tw * 0.3,
      0,
      Math.PI * 2
    );

    ctx.fill();

    const customerIndex = index % 6;

    if (assetsLoaded.customers[customerIndex]) {
      ctx.drawImage(
        assets.customers[customerIndex],
        cx,
        cy,
        tw,
        th
      );
    } else {
      ctx.font =
        `${Math.min(tw, th) * 0.65}px sans-serif`;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText(
        cliente.icone || '👤',
        cx + tw / 2,
        cy + th / 2
      );
    }

    if (agora < cliente.tempoFalaAte) {
      const tempoRestante =
        (cliente.tempoFalaAte - agora) / 1000;

      const progresso =
        (agora - cliente.inicioFala) / 2000;

      desenharBalaoComCronometroSeguro(
        cx + tw / 2,
        cy - 12,
        cliente.fala,
        tempoRestante,
        progresso
      );
    }
  });

  // ==========================================
  // 6. ENTREGADOR
  // ==========================================

  if (gameState.entregadorAtivo) {
    const xDireitaTela =
      gameState.offsetX + COLS * tw;

    const xEsquerdaTela =
      gameState.offsetX - tw * 3;

    const xColetaCentro =
      gameState.offsetX +
      COLETA_POS.x * tw +
      tw * 0.5;

    let motoScreenX;

    if (gameState.entregadorSentido === 'saindo') {
      motoScreenX =
        xColetaCentro +
        (xEsquerdaTela - xColetaCentro) *
        gameState.entregadorProgressoAnimacao;
    } else {
      const progressoEntrada =
        gameState.entregadorProgressoAnimacao || 0;

      motoScreenX =
        xDireitaTela +
        (xColetaCentro - xDireitaTela) *
        progressoEntrada;
    }

    const motoScreenY =
      gameState.offsetY + ROWS * th + 4;

    if (assetsLoaded.moto) {
      ctx.drawImage(
        assets.moto,
        motoScreenX,
        motoScreenY,
        tw * 1.2,
        th * 1.2
      );
    } else {
      ctx.font =
        `${Math.min(tw, th) * 0.75}px sans-serif`;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillText(
        '🏍️',
        motoScreenX + tw / 2,
        motoScreenY + th / 2
      );
    }

    if (gameState.entregadorFala) {
      desenharBalaoComCronometroSeguro(
        motoScreenX + tw / 2,
        motoScreenY - 10,
        gameState.entregadorFala,
        3.0,
        0
      );
    }
  }

  // ==========================================
  // 7. JOGADOR / CARRINHO
  // ==========================================

  const pScreenX =
    gameState.offsetX + gameState.playerX * tw;

  const pScreenY =
    gameState.offsetY + gameState.playerY * th;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

  ctx.beginPath();

  ctx.arc(
    pScreenX + tw / 2,
    pScreenY + th * 0.75,
    tw * 0.35,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // ==========================================
  // DESTAQUE VERDE EM VOLTA DO PLAYER
  // ==========================================
  ctx.save();
  ctx.beginPath();
  ctx.arc(pScreenX + tw / 2, pScreenY + th / 2, tw * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(34, 186, 197, 0.5)"; // Verde com 0.8 de opacidade
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#1624a3"; // Borda verde um pouco mais escura
  ctx.stroke();
  ctx.restore();

  if (assetsLoaded.cart) {
    const escalaCarrinho = 1;

    const tamanhoCarrinhoW = tw * escalaCarrinho;
    const tamanhoCarrinhoH = th * escalaCarrinho;

    const offsetXCarrinho =
      (tw - tamanhoCarrinhoW) / 2;

    const offsetYCarrinho =
      (th - tamanhoCarrinhoH) / 2;

    ctx.drawImage(
      assets.cart,
      pScreenX + offsetXCarrinho,
      pScreenY + offsetYCarrinho,
      tamanhoCarrinhoW,
      tamanhoCarrinhoH
    );
  } else {
    ctx.fillStyle = '#ffffff';

    ctx.font =
      `bold ${Math.min(tw, th) * 0.75}px sans-serif`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(
      '🛒',
      pScreenX + tw / 2,
      pScreenY + th / 2
    );
  }

  // ==========================================
  // 8. ITEM DENTRO DO CARRINHO
  // ==========================================

  if (
    gameState.temItemNoCarrinho &&
    gameState.itemColetadoAtual
  ) {
    const itemYOffset =
      pScreenY - th * 0.35;

    ctx.beginPath();

    ctx.arc(
      pScreenX + tw / 2,
      itemYOffset + th * 0.15,
      Math.min(tw, th) * 0.32,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font =
      `${Math.min(tw, th) * 0.55}px sans-serif`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(
      gameState.itemColetadoAtual.icone || '📦',
      pScreenX + tw / 2,
      itemYOffset + th * 0.15
    );
  }
}

function desenharEmojiItem(x, y, tw, th) {
  const item = gameState.itemAtualNoMapa;

  if (!item || !item.info) {
    return;
  }

  ctx.font =
    `${Math.min(tw, th) * 0.65}px sans-serif`;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(
    item.info.icone || '📦',
    x + tw / 2,
    y + th / 2
  );
}

function desenharBalaoComCronometroSeguro(
  x,
  y,
  texto,
  tempoRestante,
  progresso
) {
  if (!ctx || !canvas || !texto) {
    return;
  }

  ctx.font = 'bold 13px sans-serif';

  const larguraTexto = ctx.measureText(texto).width;
  const raioCirculo = 12;

  const w = larguraTexto + raioCirculo * 2 + 32;
  const h = 36;

  let bx = x - w / 2;

  const margemSeguranca = 15;
  const larguraMaximaTela = canvas.width;

  if (w >= larguraMaximaTela - margemSeguranca * 2) {
    bx = margemSeguranca;
  } else if (bx < margemSeguranca) {
    bx = margemSeguranca;
  } else if (
    bx + w > larguraMaximaTela - margemSeguranca
  ) {
    bx = larguraMaximaTela - margemSeguranca - w;
  }

  const by = y - h;

  ctx.fillStyle = '#ffffff';

  ctx.beginPath();

  ctx.roundRect(
    bx,
    by,
    w,
    h,
    8
  );

  ctx.fill();

  const setaX = Math.max(
    bx + 12,
    Math.min(x, bx + w - 12)
  );

  ctx.beginPath();

  ctx.moveTo(
    setaX - 6,
    by + h
  );

  ctx.lineTo(
    setaX,
    by + h + 8
  );

  ctx.lineTo(
    setaX + 6,
    by + h
  );

  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;

  ctx.strokeRect(
    bx,
    by,
    w,
    h
  );

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillText(
    texto,
    bx + 12,
    by + 23
  );

  if (progresso > 0) {
    const cxCirculo =
      bx + w - raioCirculo - 10;

    const cyCirculo =
      by + h / 2;

    ctx.beginPath();

    ctx.arc(
      cxCirculo,
      cyCirculo,
      raioCirculo,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    const progressoSeguro = Math.max(
      0,
      Math.min(1, progresso)
    );

    ctx.beginPath();

    ctx.moveTo(
      cxCirculo,
      cyCirculo
    );

    ctx.arc(
      cxCirculo,
      cyCirculo,
      raioCirculo,
      -Math.PI / 2,
      -Math.PI / 2 +
        Math.PI * 2 * (1 - progressoSeguro),
      false
    );

    ctx.lineTo(
      cxCirculo,
      cyCirculo
    );

    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    ctx.fillStyle = '#0f172a';

    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(
      `${Math.max(0, tempoRestante).toFixed(1)}s`,
      cxCirculo,
      cyCirculo
    );
  }
}