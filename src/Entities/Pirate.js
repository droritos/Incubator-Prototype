import { drawSprite, drawHealthBar } from '../RenderUtils.js';

export default class Pirate {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 50;  // Slightly larger
        this.height = 50;
        this.type = 'Pirate';
        this.markedForDeletion = false;

        this.maxHp = 250; // Much tankier than Crab (100)
        this.hp = this.maxHp;

        this.speed = 80; // Faster than Crab (50)
        this.dirX = Math.random() > 0.5 ? 1 : -1;
        this.dirY = Math.random() > 0.5 ? 1 : -1;

        this.changeDirTimer = 0;
        this.invulnerable = false;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.markedForDeletion = true;
            this.game.gold += 50; // High reward!

            // Effect
            import('../Entities/FloatingText.js').then(({ FloatingText }) => {
                this.game.texts.push(new FloatingText("+50G", this.x, this.y, '#ffd700', 20));
            });
        }
    }

    update(dt) {
        // Aggressive Chase (Unlike Crab which patrols randomly)
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 400) {
            // Chase logic
            this.dirX = dx > 0 ? 1 : -1;
            this.dirY = dy > 0 ? 1 : -1;

            // Simple direct movement
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else {
            // Patrol if far
            this.changeDirTimer += dt;
            if (this.changeDirTimer > 2.0) {
                this.changeDirTimer = 0;
                this.dirX = Math.random() > 0.5 ? 1 : -1;
                this.dirY = Math.random() > 0.5 ? 1 : -1;
            }
            this.x += this.dirX * (this.speed * 0.5) * dt; // Slower patrol
            this.y += this.dirY * (this.speed * 0.5) * dt;
        }



        // Collision with player
        if (dist < 40) {
            this.game.energy -= 15 * dt; // Reduced damage (was 35).
        }

        // Recovery
        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.scaleY < 1.0) {
            this.scaleY += dt * 5;
            if (this.scaleY > 1.0) this.scaleY = 1.0;
        }
    }

    draw(ctx) {
        // Face player if chasing, else direction
        let facing = this.dirX;
        const flash = this.flashTimer > 0 ? '#ff0000' : null;

        // Draw MOUNT (Crab) underneath
        if (this.game.assets.crab) {
            // Bobbing effect for ride
            const bob = Math.sin(Date.now() / 150) * 3;
            drawSprite(ctx, this.game.assets.crab, this.x, this.y + 10 + bob, this.width * 1.2, this.height * 0.8, 0, facing, 1, 1, flash);
        }

        // Draw RIDER (Pirate) slightly offset up
        drawSprite(ctx, this.game.assets.pirate, this.x, this.y - 10, this.width, this.height, 0, facing, this.scaleY, 1, flash);

        drawHealthBar(ctx, this.x, this.y - 40, this.width, this.hp, this.maxHp);
    }
}
