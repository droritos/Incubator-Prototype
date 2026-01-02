export default class UI {
    constructor(game) {
        this.game = game;
        this.hud = document.getElementById('hud');
        this.startScreen = document.getElementById('start-screen');
        this.shopOverlay = document.getElementById('shop-overlay');
        this.goldDisplay = document.getElementById('gold-display');
        this.energyFill = document.getElementById('energy-bar-fill');
    }

    showHUD() {
        this.startScreen.classList.add('hidden');
        this.shopOverlay.classList.add('hidden');
        this.hud.classList.remove('hidden');
    }

    showShop() {
        this.hud.classList.add('hidden');
        this.shopOverlay.classList.remove('hidden');
    }

    update() {
        // Efficient DOM updates
        if (this.game.state === 'PLAYING') {
            this.goldDisplay.textContent = Math.floor(this.game.gold);

            const energyPct = (this.game.energy / this.game.maxEnergy) * 100;
            this.energyFill.style.width = `${Math.max(0, energyPct)}%`;
        }
    }
}
