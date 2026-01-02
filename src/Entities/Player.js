import { drawSprite, drawBlockyRect } from '../RenderUtils.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.x = game.canvas.width / 2;
        this.y = game.canvas.height / 2;
        this.width = 64;
        this.height = 64;

        this.speed = game.stats.speed;
        this.color = '#ff4d4d';

        // Combat
        this.swingTimer = 0;
        this.swingCooldown = Math.max(0.2, game.stats.swingCooldown);
        this.isSwinging = false;
        this.swingDuration = 0.2;
        this.swordAngle = 0;

        // Visuals
        this.swingDirection = 1; // 1 (right->left) or -1 (left->right) relative to aim
        this.facingX = 1; // 1 or -1
    }

    update(dt) {
        // Aim Logic
        const mdX = this.game.input.mouse.x - this.x;
        const mdY = this.game.input.mouse.y - this.y;
        this.swordAngle = Math.atan2(mdY, mdX);

        // Movement
        let dx = 0;
        let dy = 0;

        if (this.game.input.keys['w']) dy -= 1;
        if (this.game.input.keys['s']) dy += 1;
        if (this.game.input.keys['a']) dx -= 1;
        if (this.game.input.keys['d']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            // Update Facing Direction based on movement
            if (dx > 0) this.facingX = 1;
            if (dx < 0) this.facingX = -1;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        this.x = Math.max(0, Math.min(this.game.canvas.width, this.x));
        this.y = Math.max(0, Math.min(this.game.canvas.height, this.y));

        this.swingCooldown = Math.max(0.1, this.game.stats.swingCooldown); // Cap minimum cooldown

        if (!this.isSwinging) {
            this.swingTimer += dt;
            if (this.swingTimer >= this.swingCooldown) {
                this.startSwing();
            }
        } else {
            this.swingTimer += dt;
            if (this.swingTimer >= this.swingDuration) {
                this.isSwinging = false;
                this.swingTimer = 0;
            } else {
                this.checkCollisions();
            }
        }
    }

    startSwing() {
        this.isSwinging = true;
        this.swingTimer = 0;
        this.swingDirection *= -1; // Alternate direction
    }

    checkCollisions() {
        const reach = 50 + this.game.stats.range;
        const arc = (Math.PI / 3) + (this.game.stats.arc * Math.PI / 180);

        this.game.entities.forEach(ent => {
            const dx = ent.x - this.x;
            const dy = ent.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < reach) {
                const angleToEnt = Math.atan2(dy, dx);
                let angleDiff = angleToEnt - this.swordAngle;

                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < arc / 2) {
                    // HIT!
                    if (ent.type === 'Chest') {
                        if (ent.hp > 0 && !ent.invulnerable) {
                            ent.takeDamage(this.game.stats.damage);

                            // Float Text
                            import('./FloatingText.js').then(({ FloatingText }) => {
                                this.game.texts.push(new FloatingText(this.game.stats.damage, ent.x, ent.y - 20, '#fff', 20));
                            });

                            ent.invulnerable = true;
                            setTimeout(() => ent.invulnerable = false, 200);
                        }
                    } else if (ent.type === 'Rock') {
                        if (!this.game.input.rockHitCooldown) {
                            this.game.energy -= 10;
                            this.game.shake = 10;

                            import('./Particle.js').then(({ spawnParticles }) => {
                                spawnParticles(this.game, ent.x, ent.y, '#ffffff', 5, 'spark');
                            });

                            // Float Text
                            import('./FloatingText.js').then(({ FloatingText }) => {
                                this.game.texts.push(new FloatingText("-10 Energy", this.x, this.y - 40, '#ff4d4d', 16));
                            });

                            this.game.input.rockHitCooldown = true;
                            setTimeout(() => this.game.input.rockHitCooldown = false, 500);
                        }
                    } else if (ent.type === 'Crab') {
                        if (ent.hp > 0 && !ent.invulnerable) {
                            const dmg = this.game.stats.damage;
                            ent.takeDamage(dmg);
                            import('./FloatingText.js').then(({ FloatingText }) => {
                                this.game.texts.push(new FloatingText(dmg, ent.x, ent.y - 20, '#fff', 20));
                            });

                            ent.invulnerable = true;
                            setTimeout(() => ent.invulnerable = false, 250); // 0.25s i-frame
                        }
                    }
                }
            }
        });
    }

    draw(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        const reach = 50 + this.game.stats.range;
        const arc = (Math.PI / 3) + (this.game.stats.arc * Math.PI / 180);

        // Draw Aim Cone
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, reach, this.swordAngle - arc / 2, this.swordAngle + arc / 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Sprite (Frozen Rotation, just flip X)
        if (this.game.assets && this.game.assets.player) {
            // Draw sprite upright ("angle" 0), scaled by facingX
            // Adjust offset to keep centered
            drawSprite(ctx, this.game.assets.player, this.x, this.y, this.width, this.height, 0, this.facingX);
        } else {
            drawBlockyRect(ctx, this.x, this.y, 30, 50, this.color);
        }

        // Sword
        ctx.save();
        ctx.translate(this.x, this.y);

        let displayAngle = this.swordAngle;

        if (this.isSwinging) {
            const progress = this.swingTimer / this.swingDuration;
            // Alternating Swing Logic
            // If direction is 1: Start at -arc/2, go to arc/2
            // If direction is -1: Start at arc/2, go to -arc/2
            let start = -arc / 2;
            let end = arc / 2;

            if (this.swingDirection === -1) {
                start = arc / 2;
                end = -arc / 2;
            }

            const offset = start + (end - start) * progress;
            displayAngle += offset;
        } else {
            // Idle position depends on last swing direction? Or just keep it at one side?
            // Usually keeping it at readable "ready" pos is good. Let's say right side.
            displayAngle += (arc / 2) * this.swingDirection;
        }

        ctx.rotate(displayAngle);
        ctx.translate(20, 0); // Offset from body

        // Draw Blade
        ctx.fillStyle = '#C0C0C0';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 5;
        ctx.fillRect(0, -2, reach - 20, 6); // Adjust length
        ctx.shadowBlur = 0;

        // Handle
        ctx.fillStyle = '#654321';
        ctx.fillRect(-5, -3, 15, 6);
        ctx.fillStyle = '#ffd700'; // Gold guard
        ctx.fillRect(-5, -6, 4, 12);

        // Trail
        if (this.isSwinging) {
            const progress = this.swingTimer / this.swingDuration;
            ctx.beginPath();
            // Draw arc in direction of swing
            // If swinging "forward" (negative to positive angle relative to aim), draw arc
            const startAng = (this.swingDirection === 1) ? -arc / 2 : arc / 2;
            const endAng = (this.swingDirection === 1) ? (-arc / 2 + arc * progress) : (arc / 2 - arc * progress);

            // Simple line trail for now
            ctx.moveTo(-20, 0);
            ctx.lineTo(reach - 20, 0);

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - progress})`;
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        ctx.restore();
    }
}
