export const SKILL_TREE_DATA = [
    {
        id: 'root',
        name: 'Pirate Basics',
        description: 'The start of your journey.',
        cost: 0,
        x: 270, y: 40,
        effect: {},
        purchased: true,
        parent: null
    },
    // --- OFFENSE BRANCH (Right) ---
    {
        id: 'damage_1',
        name: 'Sharp Blade',
        description: '+25 Damage',
        cost: 100,
        x: 370, y: 100,
        effect: { damage: 25 },
        purchased: false,
        parent: 'root'
    },
    {
        id: 'speed_attack_1',
        name: 'Berserker',
        description: '+20% Atk Speed',
        cost: 250,
        x: 470, y: 100,
        effect: { swingCooldown: -0.2 },
        purchased: false,
        parent: 'damage_1'
    },
    {
        id: 'crit_1',
        name: 'Lucky Strike',
        description: '10% Crit Chance',
        cost: 300,
        x: 570, y: 100,
        effect: { critChance: 0.1 },
        purchased: false,
        parent: 'speed_attack_1'
    },
    {
        id: 'crit_2',
        name: 'Gambler',
        description: '+15% Crit Chance',
        cost: 600,
        x: 670, y: 100,
        effect: { critChance: 0.15 },
        purchased: false,
        parent: 'crit_1'
    },
    {
        id: 'arc_1',
        name: 'Wild Swing',
        description: 'Wider Swing Arc',
        cost: 300,
        x: 370, y: 180,
        effect: { arc: 30 },
        purchased: false,
        parent: 'damage_1'
    },
    {
        id: 'knockback_1',
        name: 'Heavy Hand',
        description: 'Add Knockback',
        cost: 400,
        x: 370, y: 260,
        effect: { knockback: 200 }, // Impulse force
        purchased: false,
        parent: 'arc_1'
    },
    {
        id: 'knockback_2',
        name: 'Titan Force',
        description: 'Massive Knockback',
        cost: 800,
        x: 370, y: 340,
        effect: { knockback: 300 },
        purchased: false,
        parent: 'knockback_1'
    },

    // --- DEFENSE / UTILITY BRANCH (Center/Left) ---
    {
        id: 'speed_1',
        name: 'Peg Leg Polish',
        description: '+10% Movement Speed',
        cost: 50,
        x: 170, y: 100,
        effect: { speed: 25 },
        purchased: false,
        parent: 'root'
    },
    {
        id: 'cooldown_1',
        name: 'Quick Hands',
        description: '-10% Swing Cooldown',
        cost: 150,
        x: 170, y: 180,
        effect: { swingCooldown: -0.1 },
        purchased: false,
        parent: 'speed_1'
    },
    {
        id: 'range_1',
        name: 'Long Reach',
        description: '+20% Sword Range',
        cost: 200,
        x: 70, y: 180,
        effect: { range: 10 },
        purchased: false,
        parent: 'speed_1'
    },
    {
        id: 'thorns_1',
        name: 'Spiked Vest',
        description: 'Reflect 5 Damage',
        cost: 350,
        x: 270, y: 180, // Center
        effect: { thorns: 5 },
        purchased: false,
        parent: 'root'
    },
    {
        id: 'thorns_2',
        name: 'Cactus Hug',
        description: 'Reflect 10 Damage',
        cost: 700,
        x: 270, y: 260,
        effect: { thorns: 10 },
        purchased: false,
        parent: 'thorns_1'
    },

    // --- SPECIALS / PETS (Bottom) ---
    {
        id: 'pet_1',
        name: 'New Friend',
        description: 'Unlock Carrot Pet',
        cost: 400,
        x: 170, y: 260,
        effect: { petLevel: 1 },
        purchased: false,
        parent: 'cooldown_1'
    },
    {
        id: 'pet_2',
        name: 'Best Friend',
        description: 'Evolve to Parrot',
        cost: 1000,
        x: 170, y: 340,
        effect: { petLevel: 1 },
        purchased: false,
        parent: 'pet_1'
    },

    // --- ECONOMY (Far Left) ---
    {
        id: 'cannon_1',
        name: 'Ship Support',
        description: 'Auto-fire Cannons',
        cost: 500,
        x: 70, y: 100,
        effect: { cannonLevel: 1 },
        purchased: false,
        parent: 'speed_1'
    },
    {
        id: 'gold_1',
        name: 'Gold Rush',
        description: '+20% Gold Drops',
        cost: 400,
        x: 70, y: 20, // High up left
        effect: { goldMultiplier: 0.2 },
        purchased: false,
        parent: 'cannon_1'
    },
    {
        id: 'gold_2',
        name: 'Treasure Hunter',
        description: '+30% Gold Drops',
        cost: 800,
        x: -20, y: 20, // Far left
        effect: { goldMultiplier: 0.3 },
        purchased: false,
        parent: 'gold_1'
    }
];

export class SkillTree {
    constructor(game) {
        this.game = game;
        this.nodes = JSON.parse(JSON.stringify(SKILL_TREE_DATA)); // Deep copy
        this.container = document.getElementById('shop-items');
        this.svgContainer = null;
    }

    init() {
        console.log("SkillTree init called. Nodes:", this.nodes);
        if (!this.container) {
            console.error("Shop container not found!");
            return;
        }

        const goldEl = document.getElementById('shop-gold-amount');
        if (goldEl) goldEl.innerText = this.game.gold;

        this.render();
    }

    render() {
        this.container.innerHTML = '';

        // Create SVG layer for lines
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svgContainer.style.position = 'absolute';
        this.svgContainer.style.top = '0';
        this.svgContainer.style.left = '0';
        this.svgContainer.style.width = '100%';
        this.svgContainer.style.height = '100%';
        this.svgContainer.style.pointerEvents = 'none';
        this.svgContainer.style.zIndex = '0'; // Behind nodes
        this.svgContainer.style.overflow = 'visible'; // Allow lines outside?
        this.container.appendChild(this.svgContainer);

        this.nodes.forEach(node => {
            // Draw Line to parent
            if (node.parent) {
                const parent = this.nodes.find(n => n.id === node.parent);
                if (parent) {
                    this.drawLine(parent.x, parent.y, node.x, node.y, node.purchased);
                }
            }

            // Draw Node
            const el = document.createElement('div');
            el.className = `skill-node ${node.purchased ? 'purchased' : 'locked'}`;
            el.style.left = `${node.x}px`;
            el.style.top = `${node.y}px`;

            // Tooltip data
            el.setAttribute('data-desc', `${node.description}`);

            // Check if purchaseable
            const parent = this.nodes.find(n => n.id === node.parent);
            const canBuy = !node.purchased && (node.parent === 'root' || (parent && parent.purchased));

            if (canBuy) el.classList.add('available');

            el.innerHTML = `
                <div class="name">${node.name}</div>
                <div class="cost">${node.cost}G</div>
            `;

            el.addEventListener('click', () => this.buy(node));

            this.container.appendChild(el);
        });
    }

    drawLine(x1, y1, x2, y2, active) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const offset = 30; // Center of 60px node
        line.setAttribute("x1", x1 + offset);
        line.setAttribute("y1", y1 + offset);
        line.setAttribute("x2", x2 + offset);
        line.setAttribute("y2", y2 + offset);
        line.setAttribute("stroke", active ? "#5d4037" : "#ccc");
        line.setAttribute("stroke-width", "4");
        line.setAttribute("stroke-dasharray", active ? "none" : "5,5");
        this.svgContainer.appendChild(line);
    }

    buy(node) {
        if (node.purchased) return;

        const parent = this.nodes.find(n => n.id === node.parent);
        if (node.parent !== null && !parent.purchased) return;

        if (this.game.gold >= node.cost) {
            this.game.gold -= node.cost;
            node.purchased = true;
            this.applyUpgrade(node.effect);

            const goldEl = document.getElementById('shop-gold-amount');
            if (goldEl) goldEl.innerText = this.game.gold;

            this.render();
            this.game.ui.update();
        } else {
            const el = document.querySelector(`.skill-node[style*="left: ${node.x}px"][style*="top: ${node.y}px"]`);
            if (el) {
                el.classList.add('shake');
                setTimeout(() => el.classList.remove('shake'), 500);
            }
        }
    }

    applyUpgrade(effect) {
        const stats = this.game.stats;
        // Basic
        if (effect.speed) stats.speed += effect.speed;
        if (effect.damage) stats.damage += effect.damage;
        if (effect.swingCooldown) stats.swingCooldown += effect.swingCooldown;
        if (effect.range) stats.range += effect.range;
        if (effect.arc) stats.arc += effect.arc;

        // Advanced
        if (effect.cannonLevel) stats.cannonLevel += effect.cannonLevel;
        if (effect.petLevel) stats.petLevel += effect.petLevel;
        if (effect.knockback) stats.knockback += effect.knockback;
        if (effect.critChance) stats.critChance += effect.critChance;
        if (effect.goldMultiplier) stats.goldMultiplier += effect.goldMultiplier;
        if (effect.thorns) stats.thorns += effect.thorns;
    }
}
