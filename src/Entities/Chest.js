import { drawSprite, drawHealthBar } from '../RenderUtils.js';

export default class Chest {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = 'Chest';
        this.markedForDeletion = false;

        this.maxHp = 150;
        this.hp = this.maxHp;
        this.invulnerable = false;

        // Juice
        this.flashTimer = 0;
        this.scaleY = 1.0;
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Juice on Hit
        this.flashTimer = 0.1;
        this.scaleY = 0.7; // Squash
        this.game.hitStop(0.05);
        this.game.shake = 5;

        import('./Particle.js').then(({ spawnParticles }) => {
            spawnParticles(this.game, this.x, this.y, '#8B4513', 5, 'splinter'); // Wood chips
        });

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            // this.game.gold += 50; // REMOVED direct add
            const reward = 50;

            // Particles
            import('./Particle.js').then(({ spawnParticles }) => {
                spawnParticles(this.game, this.x, this.y, '#ffd700', 20, 'burst');
                spawnParticles(this.game, this.x, this.y, '#8B4513', 10, 'splinter');

                // Coins
                const coins = spawnParticles(this.game, this.x, this.y, '#ffd700', 10, 'coin');
                coins.forEach(c => c.value = reward / 10);
            });

            // Float Text
            import('./FloatingText.js').then(({ FloatingText }) => {
                this.game.texts.push(new FloatingText("+50G", this.x, this.y - 30, '#ffd700', 30));
            });
        }
    }

    update(dt) {
        // Recovery
        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.scaleY < 1.0) {
            this.scaleY += dt * 5;
            if (this.scaleY > 1.0) this.scaleY = 1.0;
        }
    }

    draw(ctx) {
        const flash = this.flashTimer > 0 ? '#ffffff' : null;
        drawSprite(ctx, this.game.assets.chest, this.x, this.y, this.width, this.height, 0, 1, this.scaleY, 1, flash);
        if (this.hp < this.maxHp) {
            drawHealthBar(ctx, this.x, this.y, this.width, this.hp, this.maxHp);
        }
    }
}
