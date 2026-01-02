export class FloatingText {
    constructor(text, x, y, color = '#fff', size = 20) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;

        this.life = 1.0; // Seconds
        this.vy = -50; // Float up
        this.markedForDeletion = false;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px monospace`; // Pixel-art style font preference usually
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
