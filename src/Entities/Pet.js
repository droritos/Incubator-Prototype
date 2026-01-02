import { drawSprite, drawHealthBar } from '../RenderUtils.js';

export default class Pet {
    constructor(game, type) {
        this.game = game;
        this.type = type; // 'carrot' or 'parrot'

        // Start near player
        this.x = game.player.x;
        this.y = game.player.y;
        this.width = 40;
        this.height = 40;

        this.target = null;
        this.state = 'idle'; // idle, chase, attack, return
        this.timer = 0;

        // Stats
        if (this.type === 'carrot') {
            this.damage = 25;
            this.speed = 150;
            this.range = 30; // Melee
            this.attackCooldown = 1.0;
        } else {
            this.damage = 40;
            this.speed = 200;
            this.range = 250; // Ranged
            this.attackCooldown = 0.8;
            this.facingX = 1;
        }

        this.cooldownTimer = 0;
    }

    upgrade() {
        this.type = 'parrot';
        this.damage = 40;
        this.speed = 200;
        this.range = 250;
        this.attackCooldown = 0.8;
        // Particles
        import('./Particle.js').then(({ spawnParticles }) => {
            spawnParticles(this.game, this.x, this.y, '#00ffcc', 20, 'burst');
        });
    }

    update(dt) {
        this.cooldownTimer -= dt;

        // Find Target if none
        if (!this.target || this.target.markedForDeletion || this.target.hp <= 0) {
            this.target = this.findNearestEnemy();
            if (!this.target) {
                // Return to player
                this.moveTo(this.game.player.x, this.game.player.y - 50, dt);
                return;
            }
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Update Facing (Visual)
        if (dx > 0) this.facingX = 1;
        if (dx < 0) this.facingX = -1;

        if (dist <= this.range) {
            // Attack!
            if (this.cooldownTimer <= 0) {
                this.attack(this.target);
                this.cooldownTimer = this.attackCooldown;
            }
        } else {
            // Chase
            this.moveTo(this.target.x, this.target.y, dt);

            // Carrot Hop Effect
            if (this.type === 'carrot') {
                this.timer += dt * 10;
                this.y += Math.sin(this.timer) * 0.5; // Bobbing
            }
        }
    }

    moveTo(tx, ty, dt) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    findNearestEnemy() {
        let nearest = null;
        let minDist = 9999;

        this.game.entities.forEach(ent => {
            if (ent.type === 'Chest' || ent.type === 'Crab' || ent.type === 'Rock') {
                if (ent.hp > 0) {
                    const d = Math.hypot(ent.x - this.x, ent.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        nearest = ent;
                    }
                }
            }
        });
        return nearest;
    }

    attack(target) {
        if (this.type === 'carrot') {
            // Melee BONK
            target.takeDamage(this.damage);

            // Visual Bump
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            this.x += dx * 0.2;
            this.y += dy * 0.2;

            import('./FloatingText.js').then(({ FloatingText }) => {
                this.game.texts.push(new FloatingText(this.damage, target.x, target.y - 20, '#ffa500', 16));
            });

        } else {
            // Parrot Shoot logic... wait, need projectile? 
            // For now, instant hit "peck" or "squawk" range attack
            target.takeDamage(this.damage);

            // Visual Line
            // We can draw a line in the draw function if we track "just attacked" state
            // Or spawn a simple particle projectile. Let's do instant hit for now, simplicity for incremental.
            import('./Particle.js').then(({ spawnParticles }) => {
                spawnParticles(this.game, target.x, target.y, '#ff0000', 3, 'spark');
            });
            import('./FloatingText.js').then(({ FloatingText }) => {
                this.game.texts.push(new FloatingText(this.damage, target.x, target.y - 20, '#00ccff', 18));
            });
        }
    }

    draw(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height / 2 - 5, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        let sprite = (this.type === 'carrot') ? this.game.assets.carrot : this.game.assets.parrot;

        if (sprite) {
            // Use our nice flipX logic
            // Draw slightly above Y because anchor is center
            // Add bobbing for Parrot flying
            let yOffset = 0;
            if (this.type === 'parrot') {
                yOffset = Math.sin(Date.now() / 200) * 10 - 20; // Fly above ground
            }

            drawSprite(ctx, sprite, this.x, this.y + yOffset, this.width, this.height, 0, this.facingX || 1);
        } else {
            // Fallback
            ctx.fillStyle = (this.type === 'carrot') ? 'orange' : 'red';
            ctx.fillRect(this.x - 10, this.y - 20, 20, 40);
        }
    }
}
