import Player from './Entities/Player.js';
import Pet from './Entities/Pet.js';
import CannonBall from './Entities/CannonBall.js';
import Pirate from './Entities/Pirate.js';
import UI from './UI.js';
import { SkillTree } from './SkillTree.js';
import Chest from './Entities/Chest.js';
import Rock from './Entities/Rock.js';
import Crab from './Entities/Crab.js';
import { FloatingText } from './Entities/FloatingText.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Resize canvas to full window
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = {
            keys: {},
            mouse: { x: 0, y: 0 },
            rockHitCooldown: false
        };
        this.setupInput();

        this.state = 'START'; // START, PLAYING, SHOP, GAMEOVER
        this.lastTime = 0;

        this.player = null;
        this.entities = [];
        this.particles = [];
        this.texts = [];
        this.gold = 0; // Persistent Gold
        this.energy = 30;
        this.maxEnergy = 30;
        this.shake = 0;

        // Persistent Upgrades
        this.stats = {
            speed: 250,
            damage: 50,
            swingCooldown: 0.01,
            range: 80,
            arc: 0,
            cannonLevel: 0, // New Stat
            petLevel: 0     // New Stat
        };

        // Configuration
        this.energyDecayRate = 1.0;

        this.ui = new UI(this);
        this.skillTree = new SkillTree(this);

        this.assets = {
            player: new Image(),
            chest: new Image(),
            rock: new Image(),
            crab: new Image(),
            sand: new Image()
        };
        this.assetsLoaded = 0;
        this.totalAssets = 10;
        this.bgPattern = null;
        this.cannonTimer = 0;
        this.hitStopDuration = 0;

        this.loadAssets();
    }

    hitStop(duration) {
        this.hitStopDuration = duration;
    }

    loadAssets() {
        // Helper to load and process
        const load = (name, src) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                if (name === 'sand') {
                    // Sand doesn't need transparency
                    this.assets[name] = img;
                    this.assetsLoaded++;
                    if (this.assetsLoaded === this.totalAssets) console.log("All assets loaded");
                } else {
                    // Apply transparency filter
                    import('./RenderUtils.js').then(({ createTransparentSprite }) => {
                        this.assets[name] = createTransparentSprite(img);
                        this.assetsLoaded++;
                        if (this.assetsLoaded === this.totalAssets) {
                            console.log("All assets loaded & processed");
                        }
                    });
                }
            };
        };

        load('player', './sprites/player.png');
        load('chest', './sprites/chest.png');
        load('rock', './sprites/rock.png');
        load('crab', './sprites/crab.png');
        load('sand', './sprites/sand.png');
        load('cannonball', './sprites/cannonball.png');
        load('carrot', './sprites/carrot.png');
        load('parrot', './sprites/parrot.png');
        load('pirate', './sprites/pirate.png');
        load('pistol', './sprites/pistol.png');
        load('water', './sprites/water.png');
        load('pirate_rider', './sprites/pirate_rider.png');
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;

        // Keep island correct
        if (this.islandVertices && this.islandVertices.length > 0) {
            this.generateIsland();
        }
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            if (e.code === 'KeyW' || e.key === 'w') this.input.keys['w'] = true;
            if (e.code === 'KeyA' || e.key === 'a') this.input.keys['a'] = true;
            if (e.code === 'KeyS' || e.key === 's') this.input.keys['s'] = true;
            if (e.code === 'KeyD' || e.key === 'd') this.input.keys['d'] = true;
            this.input.keys[e.key.toLowerCase()] = true; // Fallback for others
        });
        window.addEventListener('keyup', e => {
            if (e.code === 'KeyW' || e.key === 'w') this.input.keys['w'] = false;
            if (e.code === 'KeyA' || e.key === 'a') this.input.keys['a'] = false;
            if (e.code === 'KeyS' || e.key === 's') this.input.keys['s'] = false;
            if (e.code === 'KeyD' || e.key === 'd') this.input.keys['d'] = false;
            this.input.keys[e.key.toLowerCase()] = false;
        });
        window.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.input.mouse.x = e.clientX - rect.left;
            this.input.mouse.y = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', () => {
            this.input.fire = true;
        });
        window.addEventListener('mouseup', () => {
            this.input.fire = false;
        });

        const startMouse = () => this.startGame('MOUSE');
        const startWasd = () => this.startGame('WASD');

        const btnMouse = document.getElementById('start-game-btn-mouse');
        if (btnMouse) btnMouse.addEventListener('click', startMouse);

        const btnWasd = document.getElementById('start-game-btn-wasd');
        if (btnWasd) btnWasd.addEventListener('click', startWasd);

        const nextRunBtn = document.getElementById('next-run-btn');
        if (nextRunBtn) nextRunBtn.addEventListener('click', startMouse); // Default to Mouse for next run? Or keep last?
        // Let's default next run to 'MOUSE' for now, or we could track last mode.
        // For simplicity: MOUSE.
    }

    startGame(mode = 'MOUSE') {
        console.log("Starting Game... Mode:", mode);
        this.controlMode = mode;
        this.state = 'PLAYING';
        this.energy = this.maxEnergy;
        this.player = new Player(this);
        this.entities = [];
        this.particles = [];
        this.texts = []; // Reset texts too
        this.shake = 0;

        // Generate Island Shape
        this.generateIsland();

        // Reset Pet
        if (this.stats.petLevel > 0) {
            const type = (this.stats.petLevel === 2) ? 'parrot' : 'carrot';
            this.pet = new Pet(this, type);
        } else {
            this.pet = null;
        }

        // Read Options
        const rockToggle = document.getElementById('rock-toggle');
        this.rocksEnabled = rockToggle ? rockToggle.checked : true;

        console.log(`Spawned ${this.entities.length} entities. Rocks Enabled: ${this.rocksEnabled}`);

        // Static Spawning - Immediate
        // Chests
        for (let i = 0; i < 7; i++) this.spawnEntity('chest');
        // Rocks
        if (this.rocksEnabled) {
            for (let i = 0; i < 5; i++) this.spawnEntity('rock');
        }
        // Crabs
        for (let i = 0; i < 0; i++) this.spawnEntity('crab');
        // Pirates (Few)
        for (let i = 0; i < 3; i++) this.spawnEntity('pirate');

        console.log(`Spawned ${this.entities.length} entities.`);
        this.ui.showHUD();
    }

    generateIsland() {
        const points = 32;
        // Widescreen support: Different X and Y base radii
        const baseRadiusX = this.canvas.width * 0.45; // 45% of width
        const baseRadiusY = this.canvas.height * 0.45; // 45% of height

        const variance = 100;

        this.islandVertices = [];
        let noiseValues = [];

        // 1. Generate Random Noise
        for (let i = 0; i < points; i++) {
            noiseValues.push((Math.random() - 0.5) * variance);
        }

        // 2. Smooth Noise (Box Blur)
        const smoothedNoise = [];
        for (let i = 0; i < points; i++) {
            const prev = noiseValues[(i - 1 + points) % points];
            const curr = noiseValues[i];
            const next = noiseValues[(i + 1) % points];
            smoothedNoise.push((prev + curr + next) / 3);
        }

        // 3. Create Vertices (Elliptical)
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const noise = smoothedNoise[i];

            // Apply noise to base ellipse dimensions
            const rX = baseRadiusX + noise;
            const rY = baseRadiusY + noise;

            const vx = this.canvas.width / 2 + Math.cos(angle) * rX;
            const vy = this.canvas.height / 2 + Math.sin(angle) * rY;

            // Calculate actual distance from center for collision logic
            const dx = vx - this.canvas.width / 2;
            const dy = vy - this.canvas.height / 2;
            const realDist = Math.sqrt(dx * dx + dy * dy);

            this.islandVertices.push({
                x: vx,
                y: vy,
                r: realDist, // Crucial: Store actual distance so checkBounds works
                angle: angle
            });
        }
        this.islandCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    }

    start() {
        requestAnimationFrame(t => this.loop(t));
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        if (this.state === 'PLAYING') {
            // Hit Stop Logic
            if (this.hitStopDuration > 0) {
                this.hitStopDuration -= dt;
                return; // Freeze!
            }

            // Energy Decay
            this.energy -= this.energyDecayRate * dt;
            if (this.energy <= 0) {
                this.energy = 0;
                this.state = 'SHOP';
                this.gameOver();
            }

            // Screen Shake Decay
            if (this.shake > 0) {
                this.shake -= dt * 30;
                if (this.shake < 0) this.shake = 0;
            }

            if (this.player) {
                this.player.update(dt);
                this.checkBounds(this.player);
            }
            if (this.pet) this.pet.update(dt);

            // Update entities
            this.entities.forEach(ent => {
                ent.update(dt);
                if (ent.type === 'Crab' || ent.type === 'Pirate') {
                    this.checkBounds(ent);
                }
            });
            this.particles.forEach(p => p.update(dt));
            this.texts.forEach(t => t.update(dt));

            // Cleanup dead
            this.entities = this.entities.filter(e => !e.markedForDeletion);
            this.particles = this.particles.filter(p => !p.markedForDeletion);
            this.texts = this.texts.filter(t => !t.markedForDeletion);

            // Cannon Logic
            if (this.stats.cannonLevel > 0) {
                this.cannonTimer += dt;
                if (this.cannonTimer >= 5.0) { // Every 5 seconds
                    this.cannonTimer = 0;
                    this.fireCannons();
                }
            }

            // Respawn Logic
            if (this.entities.length < 20) {
                const r = Math.random();
                if (r < 0.4) this.spawnEntity('chest');
                else this.spawnEntity('pirate'); // M O R E   P I R A T E S
            }
        }
    }

    checkBounds(entity) {
        if (!this.islandVertices || this.islandVertices.length === 0) return;

        const dx = entity.x - this.islandCenter.x;
        const dy = entity.y - this.islandCenter.y;
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        const dist = Math.sqrt(dx * dx + dy * dy);

        // Find sector
        const points = this.islandVertices.length;
        const sectorAngle = (Math.PI * 2) / points;

        let index = Math.floor(angle / sectorAngle);
        // Robust Modulo (handles negative or overflow)
        index = (index % points + points) % points;

        const nextIndex = (index + 1) % points;

        const v1 = this.islandVertices[index];
        const v2 = this.islandVertices[nextIndex];

        let maxDist = 0;

        if (v1 && v2) {
            // Exact Ray-Segment Intersection
            const v1x = v1.x - this.islandCenter.x;
            const v1y = v1.y - this.islandCenter.y;
            const v2x = v2.x - this.islandCenter.x;
            const v2y = v2.y - this.islandCenter.y;

            const nx = v1y - v2y;
            const ny = v2x - v1x;
            const distConstant = nx * v1x + ny * v1y;

            const rx = Math.cos(angle);
            const ry = Math.sin(angle);
            const denom = nx * rx + ny * ry;

            if (Math.abs(denom) > 0.001) {
                maxDist = distConstant / denom;
            } else {
                maxDist = v1.r;
            }
        } else {
            // Fallback Safety: Simple Ellipse Clamp if vertices fail
            const rx = this.canvas.width * 0.4;
            const ry = this.canvas.height * 0.4;
            const a = rx; const b = ry;
            maxDist = (a * b) / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2));
        }

        const buffer = 45; // Tuned buffer (was 80, too aggressive)
        if (dist > maxDist - buffer) {
            // Hard Clamp
            const limit = maxDist - buffer;
            entity.x = this.islandCenter.x + Math.cos(angle) * limit;
            entity.y = this.islandCenter.y + Math.sin(angle) * limit;
        }
    }

    gameOver() {
        console.log("Game Over - Opening Shop");
        this.ui.showShop();
        this.skillTree.init();
    }

    draw() {
        this.ctx.save();

        // Apply Shake
        if (this.shake > 0) {
            const dx = (Math.random() - 0.5) * this.shake;
            const dy = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(dx, dy);
        }

        // Draw Water Background
        if (this.assets.water && this.assets.water.complete && this.assets.water.naturalWidth !== 0) {
            if (!this.waterPattern) {
                this.waterPattern = this.ctx.createPattern(this.assets.water, 'repeat');
            }
            this.ctx.fillStyle = this.waterPattern;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#4da6ff'; // Fallback
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Island
        if (this.islandVertices && this.islandVertices.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.islandVertices[0].x, this.islandVertices[0].y);
            for (let i = 1; i < this.islandVertices.length; i++) {
                this.ctx.lineTo(this.islandVertices[i].x, this.islandVertices[i].y);
            }
            this.ctx.closePath();

            // Foam Effect (Behind Sand)
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 40; // Thick foam
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
            this.ctx.restore();

            // Sand Texture Fill
            if (this.assets.sand && this.assets.sand.complete && this.assets.sand.naturalWidth !== 0) {
                if (!this.bgPattern) {
                    this.bgPattern = this.ctx.createPattern(this.assets.sand, 'repeat');
                }
                this.ctx.fillStyle = this.bgPattern;
            } else {
                this.ctx.fillStyle = '#e0cda7'; // Fallback
            }

            this.ctx.fill();

            // Shoreline Outline
            this.ctx.strokeStyle = '#d0b080';
            this.ctx.lineWidth = 10;
            this.ctx.stroke();

            // --- DEBUG: VISUALIZE PHYSICS BOUNDARY ---
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;

            // Raytrace the boundary at 100 steps
            for (let a = 0; a < Math.PI * 2; a += 0.1) {
                // REPLICATE CHECKBOUNDS MATH EXACTLY
                let angle = a;
                const points = this.islandVertices.length;
                const sectorAngle = (Math.PI * 2) / points;
                let index = Math.floor(angle / sectorAngle);
                index = (index % points + points) % points;
                const nextIndex = (index + 1) % points;
                const v1 = this.islandVertices[index];
                const v2 = this.islandVertices[nextIndex];

                let maxDist = 0;
                if (v1 && v2) {
                    const v1x = v1.x - this.islandCenter.x;
                    const v1y = v1.y - this.islandCenter.y;
                    const v2x = v2.x - this.islandCenter.x;
                    const v2y = v2.y - this.islandCenter.y;
                    const nx = v1y - v2y;
                    const ny = v2x - v1x;
                    const distConstant = nx * v1x + ny * v1y;
                    const rx = Math.cos(angle);
                    const ry = Math.sin(angle);
                    const denom = nx * rx + ny * ry;
                    if (Math.abs(denom) > 0.001) maxDist = distConstant / denom;
                    else maxDist = v1.r;
                }

                const limit = maxDist - 80;
                const lx = this.islandCenter.x + Math.cos(angle) * limit;
                const ly = this.islandCenter.y + Math.sin(angle) * limit;

                if (a === 0) this.ctx.moveTo(lx, ly);
                else this.ctx.lineTo(lx, ly);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            // -----------------------------------------
        }

        if (this.state === 'PLAYING') {
            // Sort by Y for depth
            const allRenderables = [...this.entities];
            if (this.player) allRenderables.push(this.player);
            if (this.pet) allRenderables.push(this.pet);

            allRenderables.sort((a, b) => a.y - b.y);

            allRenderables.forEach(r => r.draw(this.ctx));
            this.particles.forEach(p => p.draw(this.ctx));
            this.texts.forEach(t => t.draw(this.ctx));
        }

        this.ctx.restore();

        this.ui.update();
    }
    spawnEntity(type) {
        if (!this.islandVertices) return;

        // Polar Random Spawn
        const angle = Math.random() * Math.PI * 2;
        // Find radius limit at this angle
        const points = this.islandVertices.length;
        const sectorAngle = (Math.PI * 2) / points;
        // Robust Modulo (handles negative or overflow)
        index = (index % points + points) % points;

        const nextIndex = (index + 1) % points;
        const r1 = this.islandVertices[index].r;
        const r2 = this.islandVertices[nextIndex].r;
        const t = (angle - (index * sectorAngle)) / sectorAngle;
        const maxR = r1 + (r2 - r1) * t;

        // Random dist from 0 to maxR - padding
        // Pad by 60 to spawn safely inside
        const safeR = Math.max(0, maxR - 60);
        const dist = Math.sqrt(Math.random()) * safeR;

        const x = this.islandCenter.x + Math.cos(angle) * dist;
        const y = this.islandCenter.y + Math.sin(angle) * dist;

        if (type === 'chest') this.entities.push(new Chest(this, x, y));
        if (type === 'rock') this.entities.push(new Rock(this, x, y));
        if (type === 'crab') this.entities.push(new Crab(this, x, y));
        if (type === 'pirate') this.entities.push(new Pirate(this, x, y));
    }

    fireCannons() {
        const count = this.stats.cannonLevel * 1;
        for (let i = 0; i < count; i++) {
            // Random target on island
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 300; // Close to center roughly
            const tx = this.islandCenter.x + Math.cos(angle) * dist;
            const ty = this.islandCenter.y + Math.sin(angle) * dist;

            setTimeout(() => {
                this.entities.push(new CannonBall(this, tx, ty));
            }, i * 200);
        }

        this.texts.push(new FloatingText("CANNON BARRAGE!", this.player.x, this.player.y - 100, '#ff4400', 30));
    }
}
