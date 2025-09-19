import * as Phaser from "phaser";

export class Sky extends Phaser.TileSprite {
    constructor ({game}) {
        super(game, 0, 0, 1280, 800, "sky");
    }
}

export class Background extends Phaser.TileSprite {
    constructor ({game}) {
        super(game, 0, 0, 1280, 800, "background");
    }

    update () {
        this.tilePosition.x -= 1;
    }
}

export class Foreground extends Phaser.TileSprite {
    constructor ({game}) {
        super(game, 0, 0, 1280, 800, "foreground");
    }

    update () {
        this.tilePosition.x -= 5;
    }
}
