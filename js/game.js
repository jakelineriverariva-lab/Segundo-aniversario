const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TEXTO_FINAL = {
  titulo: '¡Feliz segundo aniversario!',
  linea1: 'Gracias por todos los momentos juntos',
  linea2: 'Te amo mucho Andres <3'
};

let jugador;
let enemigos = [];

const Juego = {
  estado: 'jugando', // jugando | ganaste | gameover
  puntos: 0,
  corazones: 0,
  vidas: 3,
  camX: 0,
  tiempo: 0,
  timerMuerte: 0,
  particulas: [],

  nuevaPartida() {
    this.puntos = 0;
    this.corazones = 0;
    this.vidas = 3;
    this.reiniciarNivel();
  },

  reiniciarNivel() {
    Nivel.cargar();
    jugador = new Jugador(2 * TILE, 11 * TILE);
    enemigos = Nivel.spawnsEnemigos.map(([c, r]) => new Enemigo(c * TILE, r * TILE));
    this.camX = 0;
    this.timerMuerte = 0;
    this.particulas = [];
    this.estado = 'jugando';
  },

  // ----- Partículas -----
  polvo(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.particulas.push({
        tipo: 'polvo', x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 1.5,
        vida: 20, max: 20
      });
    }
  },

  brotarCorazones(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particulas.push({
        tipo: 'corazon', x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.5 - Math.random() * 1.5,
        vida: 40, max: 40
      });
    }
  },

  actualizarParticulas() {
    for (const p of this.particulas) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.tipo === 'corazon') p.vy += 0.03;
      p.vida--;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);
  }
};

function solapan(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function actualizar() {
  Juego.tiempo++;
  Juego.actualizarParticulas();
  if (Juego.estado !== 'jugando') return;

  jugador.actualizar();

  if (jugador.vivo) {
    if (jugador.y > ROWS * TILE) jugador.morir(true);
    Nivel.recogerCorazones(jugador);
    if (Nivel.tocaBandera(jugador)) {
      Juego.estado = 'ganaste';
      Juego.puntos += 1000;
      return;
    }
  }

  for (const e of enemigos) {
    // Los enemigos "despiertan" cuando aparecen en pantalla
    if (e.vivo && e.x > Juego.camX + canvas.width + 64) continue;
    e.actualizar();
    if (!e.vivo || !jugador.vivo) continue;

    if (solapan(jugador, e)) {
      const desdeArriba = jugador.vy > 0 && jugador.y + jugador.h - jugador.vy <= e.y + 10;
      if (desdeArriba) {
        e.vivo = false;
        e.aplastado = 30;
        jugador.vy = -8;
        Juego.puntos += 200;
        Juego.polvo(e.x + e.w / 2, e.y + e.h, 6);
      } else {
        jugador.morir(false);
      }
    }
  }
  enemigos = enemigos.filter((e) => e.vivo || e.aplastado > 0);

  // Muerte: espera un momento y reinicia
  if (!jugador.vivo) {
    Juego.timerMuerte++;
    if (Juego.timerMuerte > 100) {
      Juego.vidas--;
      if (Juego.vidas <= 0) Juego.estado = 'gameover';
      else Juego.reiniciarNivel();
    }
  }

  // Cámara (solo avanza hacia la derecha)
  const objetivo = Math.min(jugador.x - 320, COLS * TILE - canvas.width);
  if (objetivo > Juego.camX) Juego.camX = objetivo;
}

// ===================== DIBUJO =====================

function dibujarPalmera(x, base, altura, t) {
  // Montoncito de arena
  ctx.fillStyle = '#e9c680';
  ctx.beginPath();
  ctx.ellipse(x, base, 46, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tronco curvado hecho con bloques
  const seg = Math.floor(altura / 8);
  let tx = x;
  let ty = base;
  for (let i = 0; i < seg; i++) {
    tx = x + Math.round(Math.sin(i * 0.35) * 6);
    ty = base - (i + 1) * 8;
    ctx.fillStyle = i % 2 ? '#8a5a2b' : '#a06a34';
    ctx.fillRect(tx - 4, ty, 8, 8);
  }

  // Hojas que se mecen con el viento
  const vaiven = Math.sin(t / 700 + x * 0.01) * 4;
  ctx.strokeStyle = '#2e9e5b';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const hojas = [[-54, 12], [-36, -6], [0, -22], [36, -6], [54, 12]];
  for (const [dx, dy] of hojas) {
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + dx * 0.5, ty + dy - 22, tx + dx + vaiven, ty + dy + 16);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';

  // Cocos
  ctx.fillStyle = '#6b3f1d';
  ctx.fillRect(tx - 5, ty + 4, 5, 5);
  ctx.fillRect(tx + 1, ty + 5, 5, 5);
}

function dibujarFondo(t) {
  const W = canvas.width;
  const H = canvas.height;
  const HORIZONTE = 250;

  // Cielo
  const cielo = ctx.createLinearGradient(0, 0, 0, HORIZONTE);
  cielo.addColorStop(0, '#3fb4f5');
  cielo.addColorStop(1, '#bdeaff');
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, W, HORIZONTE);

  // Sol con rayos que giran
  const sx = 690;
  const sy = 80;
  ctx.fillStyle = 'rgba(255, 240, 150, 0.25)';
  ctx.beginPath();
  ctx.arc(sx, sy, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe45c';
  ctx.beginPath();
  ctx.arc(sx, sy, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + t / 2500;
    ctx.fillRect(Math.round(sx + Math.cos(a) * 52 - 3), Math.round(sy + Math.sin(a) * 52 - 3), 6, 6);
  }

  // Nubes (se mueven más lento que la cámara: efecto parallax)
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 12; i++) {
    const x = i * 280 - Juego.camX * 0.2 + Math.sin(t / 3000 + i) * 6;
    const y = 40 + (i % 3) * 36;
    if (x < -120 || x > W + 120) continue;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 24, y - 10, 24, 0, Math.PI * 2);
    ctx.arc(x + 52, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gaviotas
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const gx = ((t / 25 + i * 320) % (W + 120)) - 60;
    const gy = 50 + i * 34 + Math.sin(t / 500 + i) * 6;
    const ala = Math.sin(t / 110 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(gx - 9, gy + ala);
    ctx.lineTo(gx, gy);
    ctx.lineTo(gx + 9, gy + ala);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Mar
  const mar = ctx.createLinearGradient(0, HORIZONTE, 0, H);
  mar.addColorStop(0, '#3ccbe0');
  mar.addColorStop(1, '#0b72a8');
  ctx.fillStyle = mar;
  ctx.fillRect(0, HORIZONTE, W, H - HORIZONTE);
  ctx.fillStyle = '#e6fbff';
  ctx.fillRect(0, HORIZONTE, W, 2);

  // Olas animadas
  for (let i = 0; i < 8; i++) {
    const y = HORIZONTE + 14 + i * 26;
    const vel = 0.4 + i * 0.12;
    const off = ((t / 40) * vel + i * 23) % 64;
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.1 + (i % 2) * 0.08) + ')';
    for (let x = -64; x < W + 64; x += 64) {
      ctx.fillRect(Math.round(x + off), y, 30, 3);
    }
  }

  // Palmeras lejanas (parallax)
  for (let i = 0; i < 10; i++) {
    const x = i * 420 + 120 - Juego.camX * 0.4;
    if (x < -90 || x > W + 90) continue;
    dibujarPalmera(Math.round(x), 412, 90 + (i % 3) * 20, t);
  }
}

function dibujarParticulas() {
  for (const p of Juego.particulas) {
    ctx.globalAlpha = Math.max(0, p.vida / p.max);
    if (p.tipo === 'polvo') {
      ctx.fillStyle = '#f2d08a';
      ctx.fillRect(Math.round(p.x - Juego.camX), Math.round(p.y), 4, 4);
    } else {
      ctx.drawImage(SPR.corazonChico, Math.round(p.x - Juego.camX - 9), Math.round(p.y - 8));
    }
  }
  ctx.globalAlpha = 1;
}

function texto(str, x, y) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = '#fff';
  ctx.fillText(str, x, y);
}

function dibujarHUD() {
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  texto('PUNTOS ' + String(Juego.puntos).padStart(6, '0'), 16, 26);
  ctx.drawImage(SPR.corazonChico, 250, 11);
  texto('x' + String(Juego.corazones).padStart(2, '0'), 274, 26);
  texto('VIDAS x' + Juego.vidas, 470, 26);
}

function dibujarMensaje(titulo, subtitulo) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px monospace';
  ctx.fillText(titulo, canvas.width / 2, 220);
  ctx.font = '18px monospace';
  ctx.fillText(subtitulo, canvas.width / 2, 260);
  ctx.textAlign = 'left';
}

function dibujarVictoria() {
  const t = Juego.tiempo;
  const W = canvas.width;

  // Velo rosado
  ctx.fillStyle = 'rgba(255, 105, 150, 0.35)';
  ctx.fillRect(0, 0, W, canvas.height);

  // Lluvia de corazones
  for (let i = 0; i < 28; i++) {
    const x = ((i * 97) % W) + Math.sin(t / 40 + i) * 14;
    const y = ((t * (0.8 + (i % 4) * 0.4) + i * 61) % 560) - 40;
    const spr = i % 3 === 0 ? SPR.corazon : SPR.corazonChico;
    ctx.drawImage(spr, Math.round(x), Math.round(y));
  }

  // Panel con el mensaje
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(70, 130, 660, 230);

  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';

  // Título que "late"
  const escala = 1 + Math.sin(t / 15) * 0.03;
  ctx.save();
  ctx.translate(W / 2, 215);
  ctx.scale(escala, escala);
  ctx.font = 'bold 46px monospace';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#c9184a';
  ctx.strokeText(TEXTO_FINAL.titulo, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillText(TEXTO_FINAL.titulo, 0, 0);
  ctx.restore();
  ctx.lineWidth = 1;

  ctx.font = '20px monospace';
  texto(TEXTO_FINAL.linea1, W / 2, 265);
  ctx.font = 'bold 22px monospace';
  texto(TEXTO_FINAL.linea2, W / 2, 300);
  ctx.font = '14px monospace';
  texto('Corazones: ' + Juego.corazones + '   Puntos: ' + Juego.puntos + '   (R para jugar de nuevo)', W / 2, 340);
  ctx.textAlign = 'left';
}

function dibujar() {
  const t = Juego.tiempo * (1000 / 60);

  dibujarFondo(t);
  Nivel.dibujar(ctx, Juego.camX, t);
  for (const e of enemigos) e.dibujar(ctx, Juego.camX);
  jugador.dibujar(ctx, Juego.camX);
  dibujarParticulas();
  dibujarHUD();

  if (Juego.estado === 'ganaste') {
    dibujarVictoria();
  } else if (Juego.estado === 'gameover') {
    dibujarMensaje('GAME OVER', 'Presiona R para intentarlo otra vez');
  }
}

// Bucle con paso fijo (60 actualizaciones por segundo en cualquier monitor)
let ultimo = null;
let acumulado = 0;
const PASO = 1000 / 60;

function bucle(ahora) {
  if (ultimo === null) ultimo = ahora;
  acumulado += ahora - ultimo;
  ultimo = ahora;
  if (acumulado > 200) acumulado = 200;

  while (acumulado >= PASO) {
    actualizar();
    acumulado -= PASO;
  }
  dibujar();
  requestAnimationFrame(bucle);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') Juego.nuevaPartida();
});

Juego.nuevaPartida();
requestAnimationFrame(bucle);