import { drawSprite, drawHealthBar } from '../RenderUtils.js';

export default class Crab {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.markedForDeletion = false;

        this.maxHp = 100;
        this.hp = this.maxHp;

        this.speed = 50;
        this.dirX = Math.random() > 0.5 ? 1 : -1;
        this.dirY = Math.random() > 0.5 ? 1 : -1;

        this.changeDirTimer = 0;
        this.invulnerable = false; // Prevent multi-hits
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
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
        }
    }

    draw(ctx) {
        // Rotate to face direction
        const angle = Math.atan2(this.dirY, this.dirX) - Math.PI / 2;
        drawSprite(ctx, this.game.assets.crab, this.x, this.y, this.width, this.height, angle);
        drawHealthBar(ctx, this.x, this.y, this.width, this.hp, this.maxHp);
    }
}
