export class Particle {
    constructor(game, x, y, color, type = 'splinter') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.markedForDeletion = false;

        // Physics Defaults
        const angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 100 + 50;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0;
        this.friction = 0.95;

        // Type Specifics
        if (type === 'spark') {
            this.vy = -Math.random() * 100 - 50; // Upward burst
            this.gravity = 500;
            this.life = 0.5;
            this.size = Math.random() * 3 + 1;
        } else if (type === 'splinter') {
            this.gravity = 0;
            this.life = 1.0;
            this.size = Math.random() * 4 + 2;
        } else if (type === 'coin') {
            // Coin Logic: Pop up, wait, fly to HUD
            this.state = 'POP'; // POP, WAIT, FLY
            this.timer = 0;
            this.vx = (Math.random() - 0.5) * 300;
            this.vy = (Math.random() - 0.5) * 300 - 200; // Pop UP
            this.gravity = 800;
            this.life = 10.0; // Long life
            this.size = 8;
            this.friction = 0.9;
        } else if (type === 'burst') {
            this.life = 0.4;
            this.size = Math.random() * 10 + 5;
            this.vx *= 2;
            this.vy *= 2;
        } else if (type === 'dust') {
            this.life = 0.5;
            this.size = Math.random() * 8 + 4;
            this.vy = -20; // Float up slightly
            this.vx *= 0.2; // Slow spread
            this.color = `rgba(200, 200, 180, 0.5)`;
        } else {
            this.life = 1.0;
            this.size = Math.random() * 4 + 2;
        }

        this.initialLife = this.life;
    }

    update(dt) {
        if (this.type === 'coin') {
            this.updateCoin(dt);
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += this.gravity * dt;
            this.vx *= this.friction;
            this.vy *= this.friction;

            this.life -= dt;
            if (this.life <= 0) this.markedForDeletion = true;
        }
    }

    updateCoin(dt) {
        if (this.state === 'POP') {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += this.gravity * dt;

            // Bounce floor? (Simple check)
            if (this.y > this.game.player.y + 100 && this.vy > 0) { // Approx ground relative to spawn? No, absolute.
                this.vy *= -0.6;
                this.vx *= 0.8;
            }

            this.timer += dt;
            if (this.timer > 0.5) {
                this.state = 'WAIT';
                this.timer = 0;
            }
        } else if (this.state === 'WAIT') {
            this.timer += dt;
            if (this.timer > 0.2) {
                this.state = 'FLY';
            }
        } else if (this.state === 'FLY') {
            // Fly to Top-Left (20, 20)
            const tx = 40;
            const ty = 40;
            const dx = tx - this.x;
            const dy = ty - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                // Arrived!
                this.markedForDeletion = true;
                this.game.addGold(1); // Add actual gold here
                return;
            }

            // Accelerate towards target
            const speed = 1500;
            this.x += (dx / dist) * speed * dt;
            this.y += (dy / dist) * speed * dt;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.initialLife);
        if (this.type === 'coin') ctx.globalAlpha = 1; // Coins don't fade

        ctx.fillStyle = this.color;

        if (this.type === 'coin') {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#fea';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
            ctx.fill();
            // Shine
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spark' || this.type === 'burst' || this.type === 'dust') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Splinters rotate
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.game.lastTime * 0.01 + this.x); // Random-ish spin
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }

        ctx.restore();
    }
}

export function spawnParticles(game, x, y, color, count, type) {
    for (let i = 0; i < count; i++) {
        game.particles.push(new Particle(game, x, y, color, type));
    }
}
