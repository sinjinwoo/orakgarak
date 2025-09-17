import * as Phaser from "phaser";
import {Fighter} from "../sprites/Fighter";
import {Plasma} from "../sprites/Plasma";
import {PitchDetect} from "../audio/PitchDetect";
import {Sky, Background, Foreground} from "../sprites/Background";
import {setResponsiveWidth} from "../utils";

export class GameState extends Phaser.State {
    fighter: Fighter;
    plasmas: Phaser.Group;
    obstacles: Phaser.Group;
    background;
    pitchDetect: PitchDetect;
    pitchScores: { [key: string]: number } = {}; // 음역대별 점수 추적
    scoreDisplayBox: Phaser.Graphics; // 점수 표시 박스
    scoreTexts: Phaser.Text[] = []; // 점수 텍스트들

    create () {
        this.pitchDetect = new PitchDetect();
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // 전역 변수로 pitchScores 설정 (Fighter에서 접근 가능하도록)
        (window as any).pitchScores = this.pitchScores;

        // 마이크 권한 요청 및 피치 감지 시작
        this.initializeMicrophone();
        if (process.env.NODE_ENV === "development") {
            this.game.time.advancedTiming = true;
        }

        this.background = {
            sky: new Sky({game: this.game}),
            background: new Background({game: this.game}),
            foreground: new Foreground({game: this.game})
        };
        this.game.add.existing(this.background.sky);
        this.game.add.existing(this.background.background);
        this.game.add.existing(this.background.foreground);

        this.plasmas = this.game.add.group();
        this.plasmas.createMultiple(100, "plasma");
        this.plasmas.setAll("anchor.x", 0.5);
        this.plasmas.setAll("anchor.y", 0.5);
        this.plasmas.setAll("outOfBoundsKill", true);
        this.plasmas.setAll("checkWorldBounds", true);
        this.game.physics.enable(this.plasmas, Phaser.Physics.ARCADE);

        this.obstacles = this.game.add.group();
        this.obstacles.createMultiple(20, "obstacle");
        this.obstacles.setAll("anchor.x", 0.2);
        this.obstacles.setAll("anchor.y", 0.2);
        this.obstacles.setAll("outOfBoundsKill", true);
        this.obstacles.setAll("checkWorldBounds", true);
        this.game.physics.enable(this.obstacles, Phaser.Physics.ARCADE);


        this.fighter = new Fighter({game: this.game, x: 120, y: Number(process.env.HEIGHT) / 2, name: "Pilot",
        asset: "fighter", tx: 50, ty: 50});
        this.game.add.existing(this.fighter);
        
        // Fighter를 전역 변수로 설정 (GameOver에서 접근 가능하도록)
        (window as any).fighter = this.fighter;

        this.game.physics.enable(this.fighter, Phaser.Physics.ARCADE);
        this.fighter.checkWorldBounds = true;
        this.fighter.body.collideWorldBounds = true;
        this.fighter.body.bounce.setTo(0.3, 0.3);


        // 마이크 안내 메시지 추가
        this.createMicrophoneInstructions();

        // 음역대별 점수 표시 박스 생성
        this.createScoreDisplayBox();
    }

    update() {
        try {
            // 마이크 피치 감지로만 전투기 움직임 제어
            if (this.pitchDetect && this.pitchDetect.pitchDetectionActive && this.pitchDetect.lastGoodNote && this.fighter && this.fighter.alive) {
                const targetY = this.pitchDetect.getY(Number(process.env.HEIGHT));
                const maxSpeed = 400;
                const tolerance = 15;
                const distance = targetY - this.fighter.y;

                if (Math.abs(distance) > tolerance) {
                    const speedFactor = Math.min(Math.abs(distance) / 100, 1);
                    const moveSpeed = maxSpeed * speedFactor;

                    if (distance > 0) {
                        this.fighter.body.velocity.y = moveSpeed;
                        this.fighter.angle = Math.min(speedFactor * 20, 20);
                    } else {
                        this.fighter.body.velocity.y = -moveSpeed;
                        this.fighter.angle = Math.max(-speedFactor * 20, -20);
                    }
                } else {
                    this.fighter.body.velocity.y *= 0.8;
                    this.fighter.angle *= 0.9;

                    if (Math.abs(this.fighter.body.velocity.y) < 5) {
                        this.fighter.body.velocity.y = 0;
                    }
                    if (Math.abs(this.fighter.angle) < 1) {
                        this.fighter.angle = 0;
                    }
                }

                this.fighter.updatePitchInfo(this.pitchDetect.lastGoodNote.note, targetY);
            } else if (this.pitchDetect && this.pitchDetect.pitchDetectionActive && this.fighter && this.fighter.alive) {
                // 피치 감지가 활성화되어 있지만 lastGoodNote가 없는 경우
                // 이전 속도를 유지하면서 점진적으로 감속
                this.fighter.body.velocity.y *= 0.95;
                this.fighter.angle *= 0.95;

                if (Math.abs(this.fighter.body.velocity.y) < 2) {
                    this.fighter.body.velocity.y = 0;
                }
                if (Math.abs(this.fighter.angle) < 0.5) {
                    this.fighter.angle = 0;
                }

                this.fighter.updatePitchInfo("피치 감지 중...", this.fighter.y);
            } else {
                // 마이크가 비활성화된 경우에만 중앙으로 이동
                const centerY = Number(process.env.HEIGHT) / 2;
                const maxSpeed = 200;
                const tolerance = 40;
                const distance = centerY - this.fighter.y;

                if (Math.abs(distance) > tolerance) {
                    const speedFactor = Math.min(Math.abs(distance) / 150, 1);
                    const moveSpeed = maxSpeed * speedFactor;

                    if (distance > 0) {
                        this.fighter.body.velocity.y = moveSpeed;
                        this.fighter.angle = Math.min(speedFactor * 15, 15);
                    } else {
                        this.fighter.body.velocity.y = -moveSpeed;
                        this.fighter.angle = Math.max(-speedFactor * 15, -15);
                    }
                } else {
                    this.fighter.body.velocity.y *= 0.7;
                    this.fighter.angle *= 0.8;

                    if (Math.abs(this.fighter.body.velocity.y) < 3) {
                        this.fighter.body.velocity.y = 0;
                    }
                    if (Math.abs(this.fighter.angle) < 0.5) {
                        this.fighter.angle = 0;
                    }
                }

                this.fighter.updatePitchInfo("No Pitch", centerY);
            }
        } catch (error) {
            console.warn("Game update error:", error);
        }

        try {
            // 50개 음역대에 맞춰 아이템 생성 빈도 증가
            if (Math.random() < 0.04) { // 기존 0.02에서 0.04로 증가
                this.createPlasma();
            } else if (Math.random() < 0.1) { // 테스트용으로 높은 확률로 설정
                this.createObstacle();
            }
        } catch (error) {
            console.warn("Item creation error:", error);
        }

        this.game.physics.arcade.overlap(this.fighter, this.plasmas, this.plasmaCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter, this.obstacles, this.obstacleCollision, null, this);
    }

    createPlasma () {
        try {
            let plasma = this.plasmas.getFirstExists(false);
            if (plasma) {
                plasma.destY = null;

                // 50개 음역대 중 랜덤하게 선택하여 정확한 위치에 아이템 생성
                const pitchInfo = this.getRandomPitchInfo();
                plasma.reset(Number(process.env.WIDTH) + plasma.width / 2 - 1, pitchInfo.y);

                // 아이템 크기를 음역대 줄에 맞게 축소
                plasma.scale.setTo(0.15); // 기존 0.05에서 0.15로 증가 (3배)

                // 음역대 정보 저장
                plasma.pitchInfo = pitchInfo.pitch;
                plasma.pitchName = pitchInfo.pitchName;

                // 펄스 애니메이션을 위한 변수 초기화
                plasma.pulseTime = 0;
                plasma.baseScale = 0.15;

                plasma.update = () => {
                    if (plasma && plasma.alive) {
                        // 회전 대신 펄스(크기 변화) 애니메이션
                        plasma.pulseTime += 0.1;
                        const pulseScale = plasma.baseScale + Math.sin(plasma.pulseTime) * 0.05;
                        plasma.scale.setTo(pulseScale);

                        plasma.x -= 2;
                        // 음역대 줄을 벗어나지 않도록 제한된 움직임
                        plasma.y += (Math.random() - 0.5) * 1; // 움직임 범위도 축소
                    }
                };
            }
        } catch (error) {
            console.warn("Plasma creation error:", error);
        }
    }

    createObstacle () {
        try {
            let obstacle = this.obstacles.getFirstExists(false);
            console.log("Creating obstacle, available:", !!obstacle, "total obstacles:", this.obstacles.children.length);
            if (obstacle) {
                obstacle.destY = null;
                const startX = Number(process.env.WIDTH) + 50;
                const startY = Math.random() * Number(process.env.HEIGHT);
                console.log("Resetting obstacle to:", startX, startY);
                obstacle.reset(startX, startY);
                obstacle.scale.setTo(0.3); // 적당한 크기로 조정

                // 간단한 이동만 적용 (디버깅용)
                obstacle.update = () => {
                    if (obstacle && obstacle.alive) {
                        // 기본 회전 애니메이션으로 되돌림 (안정성 확인용)
                        obstacle.angle += 3;
                        obstacle.x -= 1;

                        // 디버깅: obstacle이 살아있는지 확인
                        if (Math.random() < 0.001) { // 매우 낮은 확률로 로그 출력
                            console.log("Obstacle alive at:", obstacle.x, obstacle.y, "alive:", obstacle.alive);
                        }
                    }
                };
            }
        } catch (error) {
            console.warn("Obstacle creation error:", error);
        }
    }


    plasmaCollision (fighter: Fighter, plasma) {
        fighter.score += 1000;
        fighter.updateText();

        // 음역대별 점수 추가
        if (plasma.pitchName) {
            this.addPitchScore(plasma.pitchName, 1000);
        }

        plasma.kill();
    }

    obstacleCollision (fighter: Fighter, obstacle) {
        // HP를 50씩 감소 (2번 부딪히면 게임 오버)
        fighter.hitpoints -= 50;
        console.log(`🚀 장애물 충돌! HP: ${fighter.hitpoints}`);
        
        // HP에 따른 투명도 조정 (100 -> 1.0, 50 -> 0.5, 0 -> 0.0)
        fighter.alpha = fighter.hitpoints / 100;
        obstacle.kill();
        
        // HP가 0 이하가 되면 게임 오버 처리
        if (fighter.hitpoints <= 0) {
            console.log("🎮 Game Over! Player died.");
            
            // 게임 오버 상태로 전환
            (window as any).isGameOver = true;
            (window as any).gameState = { gameOver: true };
            
            // 커스텀 이벤트 발생
            const gameOverEvent = new CustomEvent('gameOver', {
                detail: {
                    score: fighter.score,
                    hitpoints: fighter.hitpoints,
                    pitchScores: this.pitchScores
                }
            });
            
            console.log('🎮 게임 오버 이벤트 발생:', gameOverEvent.detail);
            window.dispatchEvent(gameOverEvent);
            document.dispatchEvent(gameOverEvent);
            
            // 잠시 후 게임 오버 상태로 전환 (이벤트가 처리될 시간을 줌)
            setTimeout(() => {
                console.log('🎮 GameOver 상태로 전환');
                this.game.state.start("GameOver");
            }, 100);
        }
        
        fighter.updateText();
    }


    initializeMicrophone () {
        // 마이크 초기화 및 피치 감지 시작
        try {
            this.pitchDetect.turnOnMicrophone();
            console.log("마이크 초기화 완료");
        } catch (error) {
            console.warn("마이크 초기화 실패:", error);
            this.showMicrophoneError();
        }
    }

    showMicrophoneError () {
        // 마이크 오류 메시지 표시
        let errorText = this.game.add.text(Number(process.env.WIDTH) / 2, 200,
            "❌ 마이크 접근 실패\n\n" +
            "브라우저에서 마이크 권한을 허용해주세요.\n" +
            "페이지를 새로고침하고 다시 시도해주세요.", {
            font: "16px Arial",
            fill: "#ff0000",
            align: "center",
            stroke: "#000000",
            strokeThickness: 2
        });
        errorText.anchor.setTo(0.5, 0.5);
    }

    createMicrophoneInstructions () {
        // 마이크 사용 안내 메시지
        let instructionText = this.game.add.text(Number(process.env.WIDTH) / 2, 100,
            "🎤 마이크로 음성을 내어 전투기를 조종하세요!\n\n" +
            "낮은 음 → 아래로 이동\n" +
            "높은 음 → 위로 이동\n\n" +
            "마이크 권한을 허용해주세요.", {
            font: "18px Arial",
            fill: "#ffffff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 2
        });
        instructionText.anchor.setTo(0.5, 0.5);

        // 5초 후에 안내 메시지 페이드아웃
        this.game.time.events.add(5000, () => {
            this.game.add.tween(instructionText).to({alpha: 0}, 1000, Phaser.Easing.Linear.None, true);
        });
    }

    createScoreDisplayBox () {
        // 점수 표시 박스 생성
        this.scoreDisplayBox = this.game.add.graphics(0, 0);
        this.updateScoreDisplay();
    }

    updateScoreDisplay () {
        // 기존 텍스트들 제거
        this.scoreTexts.forEach(text => text.destroy());
        this.scoreTexts = [];

        // 음역대별 점수를 높은 음역대부터 내림차순으로 정렬
        const sortedPitches = Object.keys(this.pitchScores)
            .filter(pitch => this.pitchScores[pitch] > 0)
            .sort((a, b) => {
                // 음역대별 주파수 기준으로 정렬 (높은 음역대부터)
                const freqA = this.getPitchFrequency(a);
                const freqB = this.getPitchFrequency(b);
                return freqB - freqA;
            });

        if (sortedPitches.length === 0) return;

        // 박스 크기 계산
        const boxWidth = 200;
        const boxHeight = Math.max(60, sortedPitches.length * 25 + 20);
        const boxX = Number(process.env.WIDTH) - boxWidth - 20;
        const boxY = 20;

        // 박스 그리기
        this.scoreDisplayBox.clear();
        this.scoreDisplayBox.beginFill(0x000000, 0.7);
        this.scoreDisplayBox.lineStyle(2, 0xffffff, 1);
        this.scoreDisplayBox.drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 10);
        this.scoreDisplayBox.endFill();

        // 제목 텍스트
        const titleText = this.game.add.text(boxX + boxWidth / 2, boxY + 10, "음역대별 점수", {
            font: "14px Arial",
            fill: "#ffff00",
            align: "center",
            stroke: "#000000",
            strokeThickness: 1
        });
        titleText.anchor.setTo(0.5, 0);
        this.scoreTexts.push(titleText);

        // 각 음역대별 점수 표시
        sortedPitches.forEach((pitch, index) => {
            const yPos = boxY + 35 + (index * 25);
            const scoreText = this.game.add.text(boxX + 10, yPos,
                `${pitch}: ${this.pitchScores[pitch].toLocaleString()}점`, {
                font: "12px Arial",
                fill: "#ffffff",
                align: "left",
                stroke: "#000000",
                strokeThickness: 1
            });
            this.scoreTexts.push(scoreText);
        });
    }

    getPitchFrequency (pitch: string): number {
        // 50개 음역대별 주파수 반환 (정렬용)
        const pitchFreqMap: { [key: string]: number } = {
            // 2옥타브
            'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50,
            'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
            // 3옥타브
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00,
            'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            // 4옥타브
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
            'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            // 5옥타브
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
            'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
            // 6옥타브 (일부)
            'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98,
            'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00
        };
        return pitchFreqMap[pitch] || 0;
    }

    addPitchScore (pitch: string, score: number) {
        if (!this.pitchScores[pitch]) {
            this.pitchScores[pitch] = 0;
        }
        this.pitchScores[pitch] += score;
        
        // 전역 변수도 업데이트
        (window as any).pitchScores = this.pitchScores;
        
        this.updateScoreDisplay();
    }

    getRandomPitchInfo () {
        // 50개의 음역대별 위치 정의 (C2부터 A6까지)
        const screenHeight = Number(process.env.HEIGHT);
        const minY = 50;
        const maxY = screenHeight - 50;
        const totalRange = maxY - minY;
        const segmentHeight = totalRange / 49; // 50개 구간이므로 49개 간격

        const pitchPositions = [];

        // C2부터 A6까지 50개 음역대 생성
        const octaves = [2, 3, 4, 5, 6];
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        let index = 0;
        for (const octave of octaves) {
            for (const note of notes) {
                if (index >= 50) break;

                const y = minY + (index * segmentHeight);
                const pitchName = `${note}${octave}`;

                pitchPositions.push({
                    pitch: pitchName,
                    pitchName: pitchName,
                    y: y
                });
                index++;
            }
            if (index >= 50) break;
        }

        // 랜덤하게 음역대 선택
        const randomIndex = Math.floor(Math.random() * pitchPositions.length);
        const selectedPitch = pitchPositions[randomIndex];

        // 음역대 줄에 정확히 맞춰서 아이템 배치 (오프셋 최소화)
        const yOffset = (Math.random() - 0.5) * (segmentHeight * 0.3); // 오프셋을 더 줄임
        return {
            pitch: selectedPitch.pitch,
            pitchName: selectedPitch.pitchName,
            y: Math.max(minY, Math.min(maxY, selectedPitch.y + yOffset))
        };
    }


    render () {
        if (process.env.NODE_ENV === "development") {
            this.game.debug.text(this.game.time.fps.toString(), 2, 14);
        }
    }
}
