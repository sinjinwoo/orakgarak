import * as Phaser from "phaser";

export class Plasma extends Phaser.Sprite {
    constructor ({game, x, y}) {
        super(game, x, y, "plasma");

        this.anchor.setTo(0.5);
        this.scale.setTo(0.2);
    }

    update () {
        // 회전 애니메이션 제거 - Game.ts에서 펄스 애니메이션으로 대체됨
    }
}

/* export class Plasma extends Phaser.TileSprite {
 *     constructor ({game, x, y}) {
 *         super(game, x, y, 32, 32, "plasma");
 *
 *         this.animations.add("animate");
 *         this.animations.play("animate", 6, true);
 *     }
 * }*/
