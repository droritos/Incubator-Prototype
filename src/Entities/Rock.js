import { drawSprite } from '../RenderUtils.js';

export default class Rock {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = 'Rock';
        this.markedForDeletion = false;
    }

    update(dt) {
        // Static
    }

    draw(ctx) {
        drawSprite(ctx, this.game.assets.rock, this.x, this.y, this.width, this.height, 0);
    }
}
