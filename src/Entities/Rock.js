import { drawSprite } from '../RenderUtils.js';

export default class Rock {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
    }

    update(dt) { }

    draw(ctx) {
        drawSprite(ctx, this.game.assets.rock, this.x, this.y, this.width, this.height);
    }
}
