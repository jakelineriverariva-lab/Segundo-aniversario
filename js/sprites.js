

const PALETA = {
  k: '#1b1b2f', // contorno oscuro
  w: '#ffffff', // blanco
  s: '#ffcf9f', // piel
  S: '#e0a070', // piel sombra
  h: '#f4d35e', // paja del sombrero
  r: '#e63946', // rojo
  y: '#ffd23f', // amarillo
  b: '#1d7fd1', // azul
  n: '#5a3a1e', // marrón
  o: '#ff7a3d', // naranja (cangrejo)
  O: '#c9481b', // naranja oscuro
  p: '#ff5d8f', // rosa (corazón)
  P: '#c9184a'  // rosa oscuro
};

const Sprites = {
  crear(filas, escala) {
    const w = filas[0].length;
    const h = filas.length;
    filas.forEach((f, i) => {
      if (f.length !== w) console.warn('Sprite: la fila ' + i + ' mide ' + f.length + ' y debería medir ' + w);
    });
    const cv = document.createElement('canvas');
    cv.width = w * escala;
    cv.height = h * escala;
    const c = cv.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = filas[y][x];
        if (ch === '.') continue;
        c.fillStyle = PALETA[ch];
        c.fillRect(x * escala, y * escala, escala, escala);
      }
    }
    return cv;
  },

  // Dibuja un sprite; si voltear es true, lo refleja horizontalmente
  dibujar(ctx, cv, x, y, voltear) {
    if (voltear) {
      ctx.save();
      ctx.translate(x + cv.width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(cv, x, y);
    }
  }
};

// ---------- Personaje (16 x 16) ----------
// Chico con sombrero de paja, camisa hawaiana y short azul.
// Solo se dibuja mirando a la derecha; para la izquierda se voltea.
const JUGADOR_CUERPO = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '....khrrrrhk....',
  '..khhhhhhhhhhk..',
  '....kssssssk....',
  '....kssssksk....',
  '....ksssSSsk....',
  '.....kkkkkk.....',
  '..ksrrrrrrrrsk..',
  '..ksrryrrryrsk..',
  '..ksrrrrrrrrsk..',
  '...kbbbbbbbbk...',
  '...kbbbkkbbbk...'
];

// Las dos últimas filas (piernas y sandalias) cambian en cada pose
const JUGADOR_PIES = {
  idle:    ['....kssk..kssk..', '...knnnnk.knnnnk'],
  camina1: ['...kssk....kssk.', '..knnnnk..knnnnk'],
  camina2: ['.....kssssk.....', '....knnnnnnk....'],
  salto:   ['...kssk.....kssk', '..knnnnk...knnnn']
};

// ---------- Cangrejo enemigo (14 x 14) ----------
const CANGREJO_CUERPO = [
  '..oooooooooo..',
  '.oooooooooooo.',
  '.ooOooooooOoo.',
  '.oooooooooooo.',
  '..oooooooooo..',
  '...OOOOOOOO...'
];
const CANGREJO_ARRIBA_A = ['.oo........oo.', '.oOo..ww..oOo.', '.oOo..kk..oOo.', '..oOo.oo.oOo..'];
const CANGREJO_ARRIBA_B = ['......ww......', '......kk......', '..oo..oo..oo..', '.oOo.oooo.oOo.'];
const CANGREJO_PATAS_A = ['..O.O....O.O..', '.O..O....O..O.', '.O.O......O.O.', '..............'];
const CANGREJO_PATAS_B = ['.O.O......O.O.', '..O.O....O.O..', '..O..O....O..O', '..............'];
const FILA_VACIA_14 = '..............';
const CANGREJO_APLASTADO = [
  ...Array(10).fill(FILA_VACIA_14),
  '...oooooooo...',
  '.oooooooooooo.',
  '.oOOoOOOOoOOo.',
  '..O.O....O.O..'
];

// ---------- Corazón (9 x 8) ----------
const CORAZON = [
  '.ppp.ppp.',
  'pwppppppP',
  'ppppppppP',
  'ppppppppP',
  '.pppppPP.',
  '..pppPP..',
  '...ppP...',
  '....P....'
];

// ---------- Se crean todos los sprites una sola vez ----------
const SPR = {
  jugador: {},
  cangrejo: {
    a: Sprites.crear([...CANGREJO_ARRIBA_A, ...CANGREJO_CUERPO, ...CANGREJO_PATAS_A], 2),
    b: Sprites.crear([...CANGREJO_ARRIBA_B, ...CANGREJO_CUERPO, ...CANGREJO_PATAS_B], 2),
    aplastado: Sprites.crear(CANGREJO_APLASTADO, 2)
  },
  corazon: Sprites.crear(CORAZON, 3),      // 27 x 24 px
  corazonChico: Sprites.crear(CORAZON, 2)  // 18 x 16 px
};
for (const pose in JUGADOR_PIES) {
  SPR.jugador[pose] = Sprites.crear([...JUGADOR_CUERPO, ...JUGADOR_PIES[pose]], 2); // 32 x 32 px
}