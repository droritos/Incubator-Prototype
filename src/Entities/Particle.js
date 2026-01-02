export class Particle {
    constructor(game, x, y, color, type = 'splinter') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.markedForDeletion = false;

        // Physics
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        if (type === 'spark') {
            this.vy -= 100; // Sparks fly up
        }

        this.life = 1.0; // Seconds
        this.decay = Math.random() * 2 + 1;

        this.size = Math.random() * 4 + 2;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.vy += 200 * dt; // Gravity

        this.life -= this.decay * dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;

        if (this.type === 'coin') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }

        ctx.restore();
    }
}

export function spawnParticles(game, x, y, color, count, type) {
    for (let i = 0; i < count; i++) {
        game.particles.push(new Particle(game, x, y, color, type));
    }
}
