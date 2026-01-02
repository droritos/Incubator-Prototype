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
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
            this.game.gold += 50; // Dropped gold

            // Particles
            import('./Particle.js').then(({ spawnParticles }) => {
                spawnParticles(this.game, this.x, this.y, '#ffd700', 10, 'burst');
            });

            // Float Text
            import('./FloatingText.js').then(({ FloatingText }) => {
                this.game.texts.push(new FloatingText("+50G", this.x, this.y - 30, '#ffd700', 24));
            });
        }
    }

    update(dt) {
        // Static
    }

    draw(ctx) {
        drawSprite(ctx, this.game.assets.chest, this.x, this.y, this.width, this.height, 0);
        if (this.hp < this.maxHp) {
            drawHealthBar(ctx, this.x, this.y, this.width, this.hp, this.maxHp);
        }
    }
}
