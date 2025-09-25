import * as Phaser from "phaser";
import {easeInOutQuart} from "../utils";

export class Fighter extends Phaser.Sprite {
    rotationSpeed = 0;
    rotationDirection = 0;
    score = 0;
    hitpoints = 100;
    name = "";
    text: Phaser.Text;

    constructor ({game, x, y, name, asset, tx, ty}) {
        super(game, x, y, asset);

        this.anchor.setTo(0.5);
        this.scale.setTo(.12); // 0.08에서 0.12로 증가 (50% 증가)
        this.name = name;

        this.text = this.game.add.text(tx, ty, this.name + "", {
            font: "20px Arial",
            fill: "#ff0044",
            align: "left"
        });
        this.updateText();
    }

    updateRotation (direction?: "up" | "down") {
        // 이 메서드는 이제 Game.ts에서 직접 velocity를 제어하므로
        // 기본적인 회전 애니메이션만 처리
        if (direction === "up") {
            this.rotationSpeed = Math.min(this.rotationSpeed + 0.1, 1);
            this.angle = -easeInOutQuart(this.rotationSpeed) * 20;
        } else if (direction === "down") {
            this.rotationSpeed = Math.min(this.rotationSpeed + 0.1, 1);
            this.angle = easeInOutQuart(this.rotationSpeed) * 20;
        } else {
            // 중립 상태로 복귀
            if (this.rotationSpeed > 0) {
                this.rotationSpeed = Math.max(this.rotationSpeed - 0.1, 0);
                this.angle = this.angle > 0 ?
                    easeInOutQuart(this.rotationSpeed) * 20 :
                    -easeInOutQuart(this.rotationSpeed) * 20;
            } else {
                this.rotationSpeed = 0;
                this.angle = 0;
            }
        }
    }

    updateText () {
        this.text.setText(this.name + "\nScore: " + this.score + "\nHP: " + this.hitpoints);
        
        // HP가 0 이하가 되면 alive 상태만 변경 (게임 오버 이벤트는 Game.ts에서 처리)
        if (this.hitpoints <= 0 && this.alive) {
            console.log('🎮 Fighter HP 0 - alive 상태 변경');
            this.alive = false;
        }
    }

    updatePitchInfo (note: string, targetY: number) {
        // 피치 정보를 표시하는 텍스트 업데이트
        if (this.text) {
            let statusText = "";
            if (note === "No Pitch") {
                statusText = "🎤 마이크로 음성을 내세요";
            } else {
                statusText = "🎵 " + note;
            }

            this.text.setText(this.name + "\nScore: " + this.score + "\nHP: " + this.hitpoints +
                "\n" + statusText + "\nTarget: " + Math.round(targetY));
        }
    }

    update () { }
}
