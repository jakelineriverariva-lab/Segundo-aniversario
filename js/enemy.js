// Cangrejo enemigo: camina de lado a lado y se aplasta si lo pisas
class Enemigo {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 28;
    this.vx = -0.8;
    this.vy = 0;
    this.enSuelo = false;
    this.vivo = true;
    this.aplastado = 0; // frames que se muestra aplastado
  }

  actualizar() {
    if (!this.vivo) {
      this.aplastado--;
      return;
    }
    this.vy = Math.min(this.vy + GRAVEDAD, 12);
    const res = moverEntidad(this);
    if (res.choqueX) this.vx = -1;

    // Cayó al mar
    if (this.y > ROWS *TILE) {
      this.vivo = false;
      this.aplastado = 0;
    }
  }

  dibujar(ctx, camX) {
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);

    if (!this.vivo) {
      ctx.drawImage(SPR.cangrejo.aplastado, x, y);
      return;
    }

    // Alterna dos cuadros de animación (patas y pinzas)
    const cuadro = Math.floor(Juego.tiempo / 12) % 2 === 0 ? SPR.cangrejo.a : SPR.cangrejo.b;
    ctx.drawImage(cuadro, x, y);
  }
}