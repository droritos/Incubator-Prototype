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
                const val = this.value || 1;
                this.game.addGold(val);
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
        if (this.type === 'coin') ctx.globalAlpha = 1;

        if (this.game.assets.particles) {
            const img = this.game.assets.particles;
            // Sheet has 4 items. Coin, Blood, Smoke, Wood
            // Assume 1024x256 or similar ratio (4x1)
            const frameWidth = img.width / 4;
            const frameHeight = img.height;

            let frame = 0;
            let rotate = true;
            let scale = 1.0;

            if (this.type === 'coin') {
                frame = 0;
                this.size = 28; // Much Bigger
                rotate = false;
                // Fake 3D Spin (Flip width)
                const spinSpeed = 10;
                scale = Math.sin(this.game.lastTime * 0.005 * spinSpeed + this.x);
            } else if (this.type === 'blood' || this.type === 'splinter' && this.color === '#cc0000') {
                frame = 1;
                this.size = 20;
                rotate = false; // Liquid shouldn't spin on Z
            } else if (this.type === 'smoke' || this.type === 'dust' || this.type === 'burst' && this.color !== '#cc0000') {
                frame = 2; // Smoke
                this.size = 30; // Bigger clouds
                rotate = true; // Smoke rolling is okay
            } else if (this.type === 'splinter') {
                frame = 3; // Wood
                this.size = 22;
                rotate = true; // Splinters spinning is good
            } else {
                frame = 0;
                scale = 0.5;
            }

            const x = this.x;
            const y = this.y;
            // Apply scale (Coin Flip)
            const w = this.size * Math.abs(scale);
            const h = this.size;

            ctx.translate(x, y);
            if (rotate) ctx.rotate(this.game.lastTime * 0.005 + x);

            // Draw centered
            ctx.drawImage(img, frame * frameWidth, 0, frameWidth, frameHeight, -w / 2, -h / 2, w, h);

        } else {
            // Fallback to primitives if image failed
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export function spawnParticles(game, x, y, color, count, type) {
    const spawned = [];
    for (let i = 0; i < count; i++) {
        const p = new Particle(game, x, y, color, type);
        game.particles.push(p);
        spawned.push(p);
    }
    return spawned;
}
