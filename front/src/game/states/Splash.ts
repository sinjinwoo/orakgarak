import * as Phaser from "phaser";
import {centerGameObjects} from "../utils";

export class SplashState extends Phaser.State {
    loaderBg: Phaser.Sprite;
    loaderBar: Phaser.Sprite;

    preload () {
        this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, "loaderBg");
        this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, "loaderBar");
        centerGameObjects([this.loaderBg, this.loaderBar]);

        this.load.setPreloadSprite(this.loaderBar);

        this.load.image("sky", "/assets/images/background/sky.png");
        this.load.image("background", "/assets/images/background/background.png");
        this.load.image("foreground", "/assets/images/background/foreground.png");
        this.load.image("fighter", "/assets/images/fighter/topdownfighter.png");
        this.load.image("fighter2", "/assets/images/fighter/topdownfighter_normal.png");
        this.load.image("plasma", "/assets/images/ring.png");
        this.load.image("obstacle", "/assets/images/ring2.png");
        this.load.image("forward", "/assets/images/forward.png");
        this.load.image("backward", "/assets/images/backward.png");
    }

    create () {
        this.game.state.start("Game");
    }
}
