import { drawSprite } from '../RenderUtils.js';

export default class CannonBall {
    constructor(game, tx, ty) {
        this.game = game;
        this.tx = tx; // Target X
        this.ty = ty; // Target Y
        this.x = tx;
        this.y = ty - 600; // Start high above
        this.speed = 400;
        this.radius = 20;
        this.damage = 100; // Heavy damage
        this.markedForDeletion = false;

        // Shadow size grows as it falls
        this.shadowScale = 0;
    }

    update(dt) {
        // Fall down
        this.y += this.speed * dt;

        // Update shadow based on height
        const height = this.ty - this.y;
        this.shadowScale = Math.max(0, 1 - (height / 600));

        // Impact
        if (this.y >= this.ty) {
            this.explode();
        }
    }

    explode() {
        this.markedForDeletion = true;
        this.game.shake = 15; // Screen shake

        // Particles
        import('./Particle.js').then(({ spawnParticles }) => {
            spawnParticles(this.game, this.tx, this.ty, '#ff4400', 15, 'burst'); // Fire
            spawnParticles(this.game, this.tx, this.ty, '#555555', 10, 'smoke'); // Smoke
        });

        // AOE Damage
        const range = 100;
        this.game.entities.forEach(ent => {
            const dx = ent.x - this.tx;
            const dy = ent.y - this.ty;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < range) {
                if (ent.takeDamage) { // Check if entity can take damage
                    ent.takeDamage(this.damage);

                    // Float Text
                    import('./FloatingText.js').then(({ FloatingText }) => {
                        this.game.texts.push(new FloatingText(this.damage, ent.x, ent.y - 30, '#ff4400', 25));
                    });
                }
            }
        });
    }

    draw(ctx) {
        // Draw Shadow first
        ctx.save();
        ctx.translate(this.tx, this.ty);
        ctx.scale(this.shadowScale, this.shadowScale);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2); // Ellipse shadow
        ctx.fill();
        ctx.restore();

        // Draw Ball
        if (this.game.assets.cannonball) {
            drawSprite(ctx, this.game.assets.cannonball, this.x, this.y, 40, 40, 0);
        } else {
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
