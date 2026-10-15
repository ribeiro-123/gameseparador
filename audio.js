// audio.js

// Mapeamento dos sons do jogo (podem ser links diretos ou arquivos locais)
const efeitosSonoros = {
  pegarItem: new Audio("assets/sounds/trim.mp3"),
  soltarColeta: new Audio("assets/sounds/trim.mp3"),
  motoChegando: new Audio("assets/sounds/moto.mp3"),
  pedidoFinalizado: new Audio("assets/sounds/aplauses.mp3")
};

// Ajusta volume padrão e permite tocar sem travar se o usuário clicar rápido
export function tocarSom(tipo) {
  let som = efeitosSonoros[tipo];
  if (som) {
    som.currentTime = 0; // Reinicia o som caso já esteja tocando
    som.volume = 0.6;    // Volume de 0 a 1
    som.play().catch(error => {
      // Navegadores bloqueiam autoplay se o usuário não tiver interagido com a tela ainda
      console.log("Áudio aguardando interação do usuário:", error);
    });
  }
}
