import { drawSprite, drawHealthBar } from '../RenderUtils.js';
import { spawnParticles } from './Particle.js';

export default class Chest {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.maxHp = 150;
        this.hp = this.maxHp;
        this.markedForDeletion = false;
        this.invulnerable = false;
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Hit effect
        spawnParticles(this.game, this.x, this.y, '#8b4513', 3, 'splinter');

        if (this.hp <= 0) {
            this.markedForDeletion = true;
            this.game.gold += 10;
            // Death effect
            spawnParticles(this.game, this.x, this.y, '#8b4513', 10, 'splinter');
            spawnParticles(this.game, this.x, this.y, '#ffd700', 5, 'coin');
        }
    }

    update(dt) {
        // Static
    }

    draw(ctx) {
        drawSprite(ctx, this.game.assets.chest, this.x, this.y, this.width, this.height);
        drawHealthBar(ctx, this.x, this.y, this.width, this.hp, this.maxHp);
    }
}
