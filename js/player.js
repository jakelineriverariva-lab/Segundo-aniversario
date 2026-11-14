class Jugador {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 26;
    this.h = 30;
    this.vx = 0;
    this.vy = 0;
    this.enSuelo = false;
    this.estabaEnSuelo = false;
    this.dir = 1;
    this.vivo = true;
    this.saltoSoltado = true;
  }

  actualizar() {
    // Animación de muerte: solo cae
    if (!this.vivo) {
      this.vy += GRAVEDAD;
      this.y += this.vy;
      return;
    }

    const izq = keys.ArrowLeft || keys.KeyA;
    const der = keys.ArrowRight || keys.KeyD;
    const salto = keys.Space || keys.ArrowUp || keys.KeyW;
    const correr = keys.ShiftLeft || keys.ShiftRight;
    const vMax = correr ? 5.5 : 3.5;

    // Movimiento horizontal con aceleración y fricción
    if (izq && !der) { this.vx -= 0.5; this.dir = -1; }
    else if (der && !izq) { this.vx += 0.5; this.dir = 1; }
    else {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
    this.vx = Math.max(-vMax, Math.min(vMax, this.vx));

    // Salto (mantén presionado para saltar más alto)
    if (salto && this.enSuelo && this.saltoSoltado) {
      this.vy = -13;
      this.saltoSoltado = false;
      Juego.polvo(this.x + this.w / 2, this.y + this.h, 5);
    }
    if (!salto) {
      this.saltoSoltado = true;
      if (this.vy < -4) this.vy = -4;
    }

    // Gravedad y colisiones
    this.vy = Math.min(this.vy + GRAVEDAD, 12);
    const vyAntes = this.vy;
    const res = moverEntidad(this, (c, r) => Nivel.golpear(c, r));
    if (res.choqueX) this.vx = 0;

    // Polvo al aterrizar y al correr
    if (this.enSuelo && !this.estabaEnSuelo && vyAntes > 3) {
      Juego.polvo(this.x + this.w / 2, this.y + this.h, 6);
    }
    if (this.enSuelo && Math.abs(this.vx) > 4 && Juego.tiempo % 8 === 0) {
      Juego.polvo(this.x + this.w / 2 - this.dir * 8, this.y + this.h, 2);
    }
    this.estabaEnSuelo = this.enSuelo;

    // No puede retroceder más allá de la cámara
    if (this.x < Juego.camX) {
      this.x = Juego.camX;
      this.vx = 0;
    }
  }

  morir(porCaida) {
    if (!this.vivo) return;
    this.vivo = false;
    this.vx = 0;
    this.vy = porCaida ? 0 : -11;
  }

  dibujar(ctx, camX) {
    // Elegir la pose según lo que está haciendo
    let spr = SPR.jugador.idle;
    let rebote = 0;
    if (!this.vivo || !this.enSuelo) {
      spr = SPR.jugador.salto;
    } else if (Math.abs(this.vx) > 0.5) {
      const ciclo = [SPR.jugador.camina1, SPR.jugador.idle, SPR.jugador.camina2, SPR.jugador.idle];
      spr = ciclo[Math.floor(Juego.tiempo / 6) % 4];
      rebote = Math.floor(Juego.tiempo / 6) % 2 === 0 ? -1 : 0; // pequeño saltito al caminar
    } else {
      // Respiración suave cuando está quieto
      rebote = Math.floor(Juego.tiempo / 30) % 2 === 0 ? 0 : 1;
    }

    // Sombra en el suelo
    if (this.vivo && this.enSuelo) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(Math.round(this.x - camX) - 1, Math.round(this.y + this.h) - 2, this.w + 2, 3);
    }

    // El sprite mide 32x32 y el cuerpo 26x30: se centra y se alinea a los pies
    const x = Math.round(this.x - camX) - 3;
    const y = Math.round(this.y) + this.h - spr.height + rebote;
    Sprites.dibujar(ctx, spr, x, y, this.dir < 0);
  }
}