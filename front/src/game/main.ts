/// <reference path="./@types/phaser.d.ts"/>
import * as Phaser from "phaser";

import {BootState} from "./states/Boot";
import {SplashState} from "./states/Splash";
import {GameState} from "./states/Game";
import {GameOverState} from "./states/GameOver";
import {PitchDetect} from "./audio/PitchDetect";

export class PitchCraftGame extends Phaser.Game {
    constructor (parentElement: HTMLElement) {
        // Canvas 설정에 willReadFrequently 속성 추가
        const gameConfig = {
            width: 1080,
            height: 768,
            renderer: Phaser.CANVAS,
            parent: parentElement,
            state: null,
            canvas: document.createElement("canvas")
        };

        // Canvas에 willReadFrequently 속성 설정
        gameConfig.canvas.setAttribute("willReadFrequently", "true");

        super(gameConfig.width, gameConfig.height, Phaser.CANVAS, parentElement, null);

        this.state.add("Boot", BootState, false);
        this.state.add("Splash", SplashState, false);
        this.state.add("Game", GameState, false);
        this.state.add("GameOver", GameOverState, false);

        this.state.start("Boot");
    }
}
