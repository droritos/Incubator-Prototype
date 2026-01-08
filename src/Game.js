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
        this.energy = 50;
        this.maxEnergy = 50;
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
        this.totalAssets = 9;
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
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
        for (let i = 0; i < 15; i++) this.spawnEntity('chest');
        // Rocks
        if (this.rocksEnabled) {
            for (let i = 0; i < 15; i++) this.spawnEntity('rock');
        }
        // Crabs
        for (let i = 0; i < 10; i++) this.spawnEntity('crab');
        // Pirates (Few)
        for (let i = 0; i < 5; i++) this.spawnEntity('pirate');

        console.log(`Spawned ${this.entities.length} entities.`);
        this.ui.showHUD();
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

            if (this.player) this.player.update(dt);
            if (this.pet) this.pet.update(dt);

            // Update entities
            this.entities.forEach(ent => ent.update(dt));
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
                if (r < 0.3) this.spawnEntity('chest');
                else if (r < 0.7) this.spawnEntity('crab');
                else this.spawnEntity('pirate');
            }
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

        // Draw Background
        if (this.assets.sand && this.assets.sand.complete && this.assets.sand.naturalWidth !== 0) {
            if (!this.bgPattern) {
                this.bgPattern = this.ctx.createPattern(this.assets.sand, 'repeat');
            }
            this.ctx.fillStyle = this.bgPattern;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#e0cda7'; // Fallback Sand
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = Math.random() * (this.canvas.height - 100) + 50;
        if (type === 'chest') this.entities.push(new Chest(this, x, y));
        if (type === 'rock') this.entities.push(new Rock(this, x, y));
        if (type === 'crab') this.entities.push(new Crab(this, x, y));
        if (type === 'pirate') this.entities.push(new Pirate(this, x, y));
    }

    fireCannons() {
        const count = this.stats.cannonLevel * 1;
        for (let i = 0; i < count; i++) {
            const tx = this.player.x + (Math.random() - 0.5) * 600;
            const ty = this.player.y + (Math.random() - 0.5) * 600;

            setTimeout(() => {
                this.entities.push(new CannonBall(this, tx, ty));
            }, i * 200);
        }

        this.texts.push(new FloatingText("CANNON BARRAGE!", this.player.x, this.player.y - 100, '#ff4400', 30));
    }
}
