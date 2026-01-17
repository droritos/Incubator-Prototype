import { drawSprite, drawHealthBar } from '../RenderUtils.js';

export default class Crab {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = 'Crab';
        this.markedForDeletion = false;

        this.maxHp = 100;
        this.hp = this.maxHp;

        this.speed = 50;
        this.dirX = Math.random() > 0.5 ? 1 : -1;
        this.dirY = Math.random() > 0.5 ? 1 : -1;

        this.changeDirTimer = 0;
        this.invulnerable = false; // Prevent multi-hits

        this.flashTimer = 0;
        this.scaleY = 1.0;
    }

    takeDamage(amount) {
        this.hp -= amount;

        this.flashTimer = 0.1;
        this.scaleY = 0.8;
        this.game.hitStop(0.05);
        this.game.shake = 5;

        import('../Entities/Particle.js').then(({ spawnParticles }) => {
            spawnParticles(this.game, this.x, this.y, '#ff0000', 5, 'splinter');
        });

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            import('../Entities/Particle.js').then(({ spawnParticles }) => {
                spawnParticles(this.game, this.x, this.y, '#ff0000', 15, 'burst');
            });
        }
    }

    update(dt) {
        // Patrol
        this.changeDirTimer += dt;
        if (this.changeDirTimer > 2.0) {
            this.changeDirTimer = 0;
            this.dirX = Math.random() > 0.5 ? 1 : -1;
            this.dirY = Math.random() > 0.5 ? 1 : -1;
        }

        this.x += this.dirX * this.speed * dt;
        this.y += this.dirY * this.speed * dt;

        // Bounce bounds
        if (this.x < 0 || this.x > this.game.canvas.width) this.dirX *= -1;
        if (this.y < 0 || this.y > this.game.canvas.height) this.dirY *= -1;

        // Collision with player
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            this.game.energy -= 20 * dt;

            // Thorns (Reflect Damage)
            if (this.game.stats.thorns > 0) {
                this.hp -= this.game.stats.thorns * dt;
                if (this.hp <= 0 && !this.markedForDeletion) {
                    this.takeDamage(999); // Trigger death
                }
            }
        }

        // Recovery
        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.scaleY < 1.0) {
            this.scaleY += dt * 5;
            if (this.scaleY > 1.0) this.scaleY = 1.0;
        }
    }

    draw(ctx) {
        const flash = this.flashTimer > 0 ? '#ff0000' : null;
        const angle = Math.atan2(this.dirY, this.dirX) - Math.PI / 2;
        drawSprite(ctx, this.game.assets.crab, this.x, this.y, this.width, this.height, angle, 1, this.scaleY, 1, flash);
        drawHealthBar(ctx, this.x, this.y, this.width, this.hp, this.maxHp);
    }
}
