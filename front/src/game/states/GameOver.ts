import * as Phaser from "phaser";

export class GameOverState extends Phaser.State {
    private score: number = 0;
    private playTime: number = 0;
    private highestPitch: number = 0;
    private lowestPitch: number = 1000;
    private level: number = 1;
    private buttons: Phaser.Group;
    private backgroundGraphics: Phaser.Graphics;
    private particles: Phaser.Group;

    create() {
        console.log('🎮 GameOver 상태 시작');
        
        // 게임 완전 정지
        this.game.paused = true;
        this.game.time.events.pause();
        this.game.world.setBounds(0, 0, 0, 0); // 월드 경계 제거
        
        // 게임 데이터 가져오기
        this.getGameData();
        
        // 사이버펑크 배경 생성
        this.createCyberpunkBackground();
        
        // 파티클 효과 생성
        this.createParticleEffects();
        
        // 메인 컨테이너 생성
        this.createMainContainer();
        
        // 버튼들 생성
        this.createButtons();
        
        // 애니메이션 효과
        this.createAnimations();
        
        // GAME OVER 화면이 표시되자마자 React 모달을 띄우기 위해 이벤트 발생
        this.forceGameOverEvent();
        
        console.log('🎮 GameOver 상태 완료');
    }
    
    forceGameOverEvent() {
        console.log('🎮 GAME OVER 화면 표시 - React 모달을 띄우기 위한 이벤트 발생');
        
        // 전역 변수에서 최신 게임 데이터 가져오기
        const fighter = (window as any).fighter;
        const pitchScores = (window as any).pitchScores || {};
        
        const gameOverEvent = new CustomEvent('gameOver', {
            detail: {
                score: fighter ? fighter.score : this.score,
                hitpoints: 0,
                pitchScores: pitchScores
            }
        });
        
        console.log('🎮 게임 오버 이벤트 상세:', gameOverEvent.detail);
        
        // 여러 방법으로 이벤트 발생
        window.dispatchEvent(gameOverEvent);
        document.dispatchEvent(gameOverEvent);
        
        // 추가적으로 전역 함수 호출 (React 컴포넌트에서 감지할 수 있도록)
        if ((window as any).onGameOver) {
            (window as any).onGameOver(gameOverEvent.detail);
        }
        
        console.log('🎮 게임 오버 이벤트 발생 완료');
    }
    
    getGameData() {
        // 전역 변수에서 게임 데이터 가져오기
        const fighter = (window as any).fighter;
        if (fighter) {
            this.score = fighter.score || 0;
            this.highestPitch = fighter.highestPitch || 0;
            this.lowestPitch = fighter.lowestPitch || 1000;
            this.level = fighter.level || 1;
        }
        
        // 플레이 시간 계산 (대략적)
        this.playTime = Math.floor(this.game.time.totalElapsedSeconds() || 0);
    }
    
    createCyberpunkBackground() {
        // 그라데이션 배경
        this.backgroundGraphics = this.add.graphics(0, 0);
        this.backgroundGraphics.beginFill(0x000000);
        this.backgroundGraphics.drawRect(0, 0, this.world.width, this.world.height);
        this.backgroundGraphics.endFill();
        
        // 네온 그리드 배경
        const gridGraphics = this.add.graphics(0, 0);
        gridGraphics.lineStyle(1, 0x00ff88, 0.3);
        
        for (let x = 0; x < this.world.width; x += 50) {
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, this.world.height);
        }
        
        for (let y = 0; y < this.world.height; y += 50) {
            gridGraphics.moveTo(0, y);
            gridGraphics.lineTo(this.world.width, y);
        }
        
        // 사이버펑크 스타일 테두리
        const borderGraphics = this.add.graphics(0, 0);
        borderGraphics.lineStyle(3, 0x00ff88, 0.8);
        borderGraphics.drawRect(10, 10, this.world.width - 20, this.world.height - 20);
        
        // 네온 글로우 효과
        const glowGraphics = this.add.graphics(0, 0);
        glowGraphics.lineStyle(8, 0x00ff88, 0.2);
        glowGraphics.drawRect(10, 10, this.world.width - 20, this.world.height - 20);
    }
    
    createParticleEffects() {
        this.particles = this.add.group();
        
        // 떠다니는 파티클들
        for (let i = 0; i < 20; i++) {
            const particle = this.add.graphics(0, 0);
            particle.beginFill(0x00ff88, 0.6);
            particle.drawCircle(0, 0, Math.random() * 3 + 1);
            particle.endFill();
            
            particle.x = Math.random() * this.world.width;
            particle.y = Math.random() * this.world.height;
            
            // 랜덤한 움직임
            this.game.add.tween(particle).to({
                x: particle.x + (Math.random() - 0.5) * 200,
                y: particle.y + (Math.random() - 0.5) * 200
            }, 3000 + Math.random() * 2000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
            
            this.particles.add(particle);
        }
    }
    
    createMainContainer() {
        // 메인 컨테이너 배경
        const containerBg = this.add.graphics(this.world.centerX - 300, this.world.centerY - 200);
        containerBg.beginFill(0x000000, 0.9);
        containerBg.lineStyle(2, 0x00ff88, 1);
        containerBg.drawRoundedRect(0, 0, 600, 400, 20);
        containerBg.endFill();
        
        // GAME OVER 타이틀
        const gameOverText = this.add.text(this.world.centerX, this.world.centerY - 120, "GAME OVER", {
            font: "bold 48px Arial",
            fill: "#ff0044",
            align: "center",
            stroke: "#ffffff",
            strokeThickness: 2
        });
        gameOverText.anchor.setTo(0.5, 0.5);
        
        // 네온 글로우 효과
        const glowText = this.add.text(this.world.centerX, this.world.centerY - 120, "GAME OVER", {
            font: "bold 48px Arial",
            fill: "#ff0044",
            align: "center"
        });
        glowText.anchor.setTo(0.5, 0.5);
        glowText.alpha = 0.3;
        
        // 펄스 애니메이션
        this.game.add.tween(glowText).to({alpha: 0.8}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
        
        // 게임 통계 표시
        this.createStatsDisplay();
    }
    
    createStatsDisplay() {
        const statsY = this.world.centerY - 60;
        
        // 점수
        const scoreText = this.add.text(this.world.centerX, statsY, `SCORE: ${this.score.toLocaleString()}`, {
            font: "24px Arial",
            fill: "#00ff88",
            align: "center",
            stroke: "#000000",
            strokeThickness: 1
        });
        scoreText.anchor.setTo(0.5, 0.5);
        
        // 플레이 시간
        const timeText = this.add.text(this.world.centerX, statsY + 30, `TIME: ${this.playTime}s`, {
            font: "20px Arial",
            fill: "#ffffff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 1
        });
        timeText.anchor.setTo(0.5, 0.5);
        
        // 레벨
        const levelText = this.add.text(this.world.centerX, statsY + 60, `LEVEL: ${this.level}`, {
            font: "20px Arial",
            fill: "#ffaa00",
            align: "center",
            stroke: "#000000",
            strokeThickness: 1
        });
        levelText.anchor.setTo(0.5, 0.5);
    }
    
    createButtons() {
        this.buttons = this.add.group();
        
        const buttonY = this.world.centerY + 80;
        const buttonSpacing = 120;
        
        // 다시하기 버튼
        this.createButton(
            this.world.centerX - buttonSpacing,
            buttonY,
            "다시하기",
            "#ffaa00",
            () => this.handleRestart()
        );
        
        // 그만하기 버튼
        this.createButton(
            this.world.centerX,
            buttonY,
            "그만하기",
            "#ff4444",
            () => this.handleExit()
        );
        
        // 다음 테스트 받기 버튼
        this.createButton(
            this.world.centerX + buttonSpacing,
            buttonY,
            "다음 테스트받기",
            "#00ff88",
            () => this.handleNextTest()
        );
    }
    
    createButton(x: number, y: number, text: string, color: string, callback: () => void) {
        // 사이버펑크 버튼 배경
        const buttonBg = this.add.graphics(x - 90, y - 25);
        buttonBg.beginFill(0x1e0a14, 0.9);
        buttonBg.lineStyle(3, color, 1);
        buttonBg.drawRoundedRect(0, 0, 180, 50, 15);
        buttonBg.endFill();
        
        // 사이버펑크 버튼 텍스트
        const buttonText = this.add.text(x, y, text, {
            font: "bold 18px neon, monospace",
            fill: color,
            align: "center",
            stroke: "#000000",
            strokeThickness: 2
        });
        buttonText.anchor.setTo(0.5, 0.5);
        
        // 사이버펑크 호버 효과
        buttonBg.inputEnabled = true;
        buttonBg.events.onInputOver.add(() => {
            buttonBg.clear();
            buttonBg.beginFill(0x2a0f1e, 1);
            buttonBg.lineStyle(4, color, 1);
            buttonBg.drawRoundedRect(0, 0, 180, 50, 15);
            buttonBg.endFill();
            
            buttonText.scale.setTo(1.1);
            buttonText.tint = 0x42FDEB;
        });
        
        buttonBg.events.onInputOut.add(() => {
            buttonBg.clear();
            buttonBg.beginFill(0x1e0a14, 0.9);
            buttonBg.lineStyle(3, color, 1);
            buttonBg.drawRoundedRect(0, 0, 180, 50, 15);
            buttonBg.endFill();
            
            buttonText.scale.setTo(1.0);
            buttonText.tint = 0xffffff;
        });
        
        buttonBg.events.onInputDown.add(callback);
        
        this.buttons.add(buttonBg);
        this.buttons.add(buttonText);
    }
    
    createAnimations() {
        // 전체 컨테이너 페이드인
        this.buttons.alpha = 0;
        this.game.add.tween(this.buttons).to({alpha: 1}, 1000, Phaser.Easing.Quadratic.Out, true);
        
        // 버튼들 순차적으로 나타나기
        this.buttons.children.forEach((button, index) => {
            button.alpha = 0;
            button.scale.setTo(0.5);
            
            this.game.time.events.add(500 + index * 200, () => {
                this.game.add.tween(button).to({
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1
                }, 300, Phaser.Easing.Back.Out, true);
            });
        });
    }
    
    handleNextTest() {
        console.log('다음 테스트 받기 클릭');
        // 커스텀 이벤트 발생
        const nextTestEvent = new CustomEvent('nextTest');
        window.dispatchEvent(nextTestEvent);
        document.dispatchEvent(nextTestEvent);
    }
    
    handleRestart() {
        console.log('다시하기 클릭');
        // 커스텀 이벤트 발생
        const restartEvent = new CustomEvent('restartGame');
        window.dispatchEvent(restartEvent);
        document.dispatchEvent(restartEvent);
    }
    
    handleExit() {
        console.log('그만하기 클릭');
        // 커스텀 이벤트 발생
        const exitEvent = new CustomEvent('exitGame');
        window.dispatchEvent(exitEvent);
        document.dispatchEvent(exitEvent);
    }
}
