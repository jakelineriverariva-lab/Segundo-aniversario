const TILE = 32;
const COLS = 100;
const ROWS = 15;
const GRAVEDAD = 0.6;
const SOLIDOS = ['#', 'B', '?', 'U', 'T'];

// Celdas del mapa que toca una entidad (x, y, w, h)
function celdasEn(e) {
  const lista = [];
  const c1 = Math.floor(e.x / TILE);
  const c2 = Math.floor((e.x + e.w - 1) / TILE);
  const r1 = Math.floor(e.y / TILE);
  const r2 = Math.floor((e.y + e.h - 1) / TILE);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) lista.push([c, r]);
  }
  return lista;
}

// Mueve una entidad y resuelve colisiones con los bloques
function moverEntidad(e, alTecho) {
  let choqueX = false;
  let choqueY = false;

  e.x += e.vx;
  for (const [c, r] of celdasEn(e)) {
    if (!Nivel.esSolido(c, r)) continue;
    if (e.vx > 0) e.x = c * TILE - e.w;
    else if (e.vx < 0) e.x = (c + 1) * TILE;
    choqueX = true;
  }

  e.y += e.vy;
  e.enSuelo = false;
  for (const [c, r] of celdasEn(e)) {
    if (!Nivel.esSolido(c, r)) continue;
    if (e.vy > 0) {
      e.y = r * TILE - e.h;
      e.enSuelo = true;
    } else if (e.vy < 0) {
      e.y = (r + 1) * TILE;
      if (alTecho) alTecho(c, r);
    }
    choqueY = true;
  }
  if (choqueY) e.vy = 0;

  return { choqueX, choqueY };
}

const Nivel = {
  grid: [],
  spawnsEnemigos: [],

  cargar() {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
    const poner = (c, r, t) => { g[r][c] = t; };
    const fila = (c1, c2, r, t) => { for (let c = c1; c <= c2; c++) poner(c, r, t); };
    const suelo = (c1, c2) => { fila(c1, c2, 13, '#'); fila(c1, c2, 14, '#'); };
    const rocas = (c, alto) => {
      for (let i = 0; i < alto; i++) { poner(c, 12 - i, 'T'); poner(c + 1, 12 - i, 'T'); }
    };

    // Suelo de arena con dos huecos (el mar)
    suelo(0, 34);
    suelo(38, 62);
    suelo(67, 99);

    // Bloques: 'B' = cajas de madera, '?' = bloques con corazón
    poner(12, 9, '?');
    poner(16, 9, 'B'); poner(17, 9, '?'); poner(18, 9, 'B'); poner(19, 9, '?'); poner(20, 9, 'B');
    fila(48, 50, 9, 'B');
    poner(58, 9, '?');

    // Rocas
    rocas(25, 2);
    rocas(45, 3);
    rocas(55, 3);

    // Corazones sueltos ('o')
    fila(16, 20, 7, 'o');
    poner(35, 10, 'o'); poner(36, 9, 'o'); poner(37, 10, 'o');
    fila(40, 43, 10, 'o');
    poner(64, 9, 'o'); poner(65, 8, 'o');

    // Escalera final
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j <= i; j++) poner(76 + i, 12 - j, 'B');
    }

    // Bandera (meta)
    for (let r = 3; r <= 12; r++) poner(90, r, 'F');

    this.grid = g;
    this.spawnsEnemigos = [[14, 12], [22, 12], [30, 12], [42, 12], [48, 12], [58, 12], [70, 12], [72, 12]];
  },

  tipo(c, r) {
    if (c < 0 || c >= COLS) return '#';
    if (r < 0 || r >= ROWS) return '.';
    return this.grid[r][c];
  },

  esSolido(c, r) {
    return SOLIDOS.includes(this.tipo(c, r));
  },

  // Cabezazo desde abajo: el bloque '?' suelta un corazón
  golpear(c, r) {
    if (this.tipo(c, r) === '?') {
      this.grid[r][c] = 'U';
      Juego.corazones++;
      Juego.puntos += 100;
      Juego.brotarCorazones(c * TILE + TILE / 2, r * TILE - 4);
    }
  },

  recogerCorazones(e) {
    for (const [c, r] of celdasEn(e)) {
      if (this.tipo(c, r) === 'o') {
        this.grid[r][c] = '.';
        Juego.corazones++;
        Juego.puntos += 50;
        Juego.brotarCorazones(c * TILE + TILE / 2, r * TILE + TILE / 2);
      }
    }
  },

  tocaBandera(e) {
    return celdasEn(e).some(([c, r]) => this.tipo(c, r) === 'F');
  },

  dibujar(ctx, camX, t) {
    const c1 = Math.floor(camX / TILE);
    const c2 = Math.min(COLS - 1, c1 + Math.ceil(ctx.canvas.width / TILE) + 1);

    for (let r = 0; r < ROWS; r++) {
      for (let c = c1; c <= c2; c++) {
        const tipo = this.grid[r][c];
        if (tipo === '.') continue;
        const x = Math.round(c * TILE - camX);
        const y = r * TILE;

        switch (tipo) {
          case '#': { // arena
            const hash = (c * 73 + r * 151) % 29;
            ctx.fillStyle = r === 14 ? '#dcb673' : '#e9c680';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#c99a4e';
            ctx.fillRect(x + (hash * 3) % 28, y + 8 + (hash * 5) % 18, 3, 3);
            ctx.fillRect(x + (hash * 7 + 11) % 28, y + 10 + (hash * 11) % 16, 2, 2);
            if (!SOLIDOS.includes(this.tipo(c, r - 1))) {
              ctx.fillStyle = '#fbe7b0';
              ctx.fillRect(x, y, TILE, 6);
              ctx.fillStyle = '#c99a4e';
              ctx.fillRect(x, y + 6, TILE, 2);
            }
            break;
          }
          case 'B': // caja de madera
            ctx.fillStyle = '#c0803f';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#8a5528';
            ctx.fillRect(x, y, TILE, 3);
            ctx.fillRect(x, y + TILE - 3, TILE, 3);
            ctx.fillRect(x, y, 3, TILE);
            ctx.fillRect(x + TILE - 3, y, 3, TILE);
            ctx.strokeStyle = '#8a5528';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 3);
            ctx.lineTo(x + TILE - 3, y + TILE - 3);
            ctx.stroke();
            ctx.lineWidth = 1;
            break;
          case '?': // bloque con corazón
            ctx.fillStyle = Math.floor(t / 300) % 2 ? '#ffb703' : '#ffd166';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = '#9a5b00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
            ctx.lineWidth = 1;
            ctx.fillStyle = '#9a5b00';
            ctx.fillRect(x + 3, y + 3, 3, 3);
            ctx.fillRect(x + TILE - 6, y + 3, 3, 3);
            ctx.fillRect(x + 3, y + TILE - 6, 3, 3);
            ctx.fillRect(x + TILE - 6, y + TILE - 6, 3, 3);
            ctx.drawImage(SPR.corazonChico, x + 7, y + 8);
            break;
          case 'U': // bloque ya usado
            ctx.fillStyle = '#b8a58a';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.strokeStyle = '#7d6b52';
            ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
            break;
          case 'T': // roca
            ctx.fillStyle = '#8d99ae';
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#b7c0d0';
            ctx.fillRect(x + 3, y + 3, 10, 6);
            ctx.fillStyle = '#6b7488';
            ctx.fillRect(x + 16, y + 18, 12, 8);
            ctx.strokeStyle = '#4a5266';
            ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
            break;
          case 'o': { // corazón flotante
            const dy = Math.round(Math.sin(t / 250 + c) * 3);
            const dx = Math.round((TILE - SPR.corazon.width) / 2);
            ctx.drawImage(SPR.corazon, x + dx, y + 4 + dy);
            if (Math.floor(t / 200 + c) % 6 === 0) {
              ctx.fillStyle = '#fff';
              ctx.fillRect(x + 20, y + 6 + dy, 3, 3);
            }
            break;
          }
          case 'F': { // bandera con corazón
            ctx.fillStyle = '#f1f1f1';
            ctx.fillRect(x + 14, y, 4, TILE);
            if (this.tipo(c, r - 1) !== 'F') {
              ctx.fillStyle = '#ffd166';
              ctx.fillRect(x + 12, y - 4, 8, 8);
              const ondea = Math.round(Math.sin(t / 150) * 2);
              ctx.drawImage(SPR.corazon, x + 20, y + 2 + ondea);
            }
            break;
          }
        }
      }
    }
  }
};