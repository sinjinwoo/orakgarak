import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 게임 파일들을 수집하여 bundle.js 생성
function buildGameBundle() {
    console.log('🎮 게임 번들 빌드 시작...');
    
    try {
        // Phaser.js 파일 읽기
        const phaserPath = path.join(__dirname, 'public/assets/js/phaser.min.js');
        const phaserContent = fs.readFileSync(phaserPath, 'utf8');
        console.log('✅ Phaser.js 로드 완료');
        
        // 게임 소스 파일들 읽기
        const gameFiles = [
            'src/game/main.ts',
            'src/game/states/Boot.ts',
            'src/game/states/Splash.ts', 
            'src/game/states/Game.ts',
            'src/game/states/GameOver.ts',
            'src/game/sprites/Fighter.ts',
            'src/game/sprites/Plasma.ts',
            'src/game/sprites/Background.ts',
            'src/game/audio/PitchDetect.ts',
            'src/game/utils.ts'
        ];
        
        let gameContent = '';
        
        // 각 게임 파일을 읽어서 트랜스파일 후 합치기 (import/export 제거)
        const stripModuleSyntax = (code) => {
            // 1) import 라인 제거
            let out = code.replace(/^\s*import[^;]*;\s*$/gm, '');
            // 2) export 키워드 제거
            out = out.replace(/\bexport\s+default\s+/g, '');
            out = out.replace(/\bexport\s+(?=class|function|const|let|var|interface|type)/g, '');
            // 3) declare 등 타입 전용 구문 제거
            out = out.replace(/^\s*declare\s+[^;]*;\s*$/gm, '');
            return out;
        };

        // notes.json 로드 (PitchDetect에서 사용)
        const notesJsonPath = path.join(__dirname, 'src/game/audio/notes.json');
        const notesJson = fs.existsSync(notesJsonPath)
            ? JSON.parse(fs.readFileSync(notesJsonPath, 'utf8'))
            : null;

        gameFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const tsSource = fs.readFileSync(filePath, 'utf8');
                // 먼저 import/export 제거 (모듈 구문 제거)
                const stripped = stripModuleSyntax(tsSource);
                // 타입스크립트 트랜스파일 (타입 제거, ES5로 다운레벨)
                let transpiled = ts.transpileModule(stripped, {
                    compilerOptions: {
                        target: ts.ScriptTarget.ES5,
                        module: ts.ModuleKind.None,
                        removeComments: false,
                        isolatedModules: false,
                        noEmitHelpers: false,
                        importHelpers: false
                    }
                }).outputText;

                // require("./notes.json") 대체: JSON을 인라인 삽입
                if (notesJson) {
                    const jsonLiteral = JSON.stringify(notesJson);
                    transpiled = transpiled.replace(/require\(["']\.\/notes\.json["']\)/g, jsonLiteral);
                }

                gameContent += transpiled + '\n\n';
                console.log(`✅ ${file} 트랜스파일 완료`);
            } else {
                console.warn(`⚠️ ${file} 파일을 찾을 수 없습니다.`);
            }
        });
        
        // webfontloader 스크립트 읽기 (전역 WebFont 제공)
        let webfontContent = '';
        const webfontCandidates = [
            path.join(__dirname, 'node_modules/webfontloader/webfontloader.js'),
            path.join(__dirname, 'node_modules/webfontloader/dist/webfontloader.js')
        ];
        for (const p of webfontCandidates) {
            if (fs.existsSync(p)) {
                webfontContent = fs.readFileSync(p, 'utf8');
                console.log('✅ webfontloader 로드 완료:', path.basename(p));
                break;
            }
        }
        if (!webfontContent) {
            // 최소 폴백: active 콜백만 호출하는 더미
            webfontContent = 'window.WebFont={load:function(o){if(o&&o.active)try{o.active()}catch(e){}}};';
            console.warn('⚠️ webfontloader를 찾지 못해 폴백 더미를 사용합니다.');
        }

        // 번들 생성
        const bundleContent = `
// Phaser.js
${phaserContent}

// WebFontLoader
${webfontContent}

// 게임 코드 (전역 스코프 보호)
(function(){
${gameContent}

    // 전역 노출 (React에서 접근 가능하도록)
    if (typeof window !== 'undefined') {
        if (typeof PitchCraftGame !== 'undefined') window.PitchCraftGame = PitchCraftGame;
        if (typeof BootState !== 'undefined') window.BootState = BootState;
        if (typeof SplashState !== 'undefined') window.SplashState = SplashState;
        if (typeof GameState !== 'undefined') window.GameState = GameState;
        if (typeof GameOverState !== 'undefined') window.GameOverState = GameOverState;

        // 다중 실행 가드 플래그와 리셋 함수
        if (typeof window.__PITCHCRAFT_ACTIVE === 'undefined') window.__PITCHCRAFT_ACTIVE = false;
        window.__PITCHCRAFT_RESET = function(){ window.__PITCHCRAFT_ACTIVE = false; };

        // 전역 팩토리: React가 명시적으로 호출할 때만 생성
        window.createPitchCraft = function(mount){
            if (!mount) return;
            if (typeof PitchCraftGame === 'undefined') return;
            if (!window.__PITCHCRAFT_ACTIVE) {
                try {
                    window.__PITCHCRAFT_ACTIVE = true;
                    new PitchCraftGame(mount);
                } catch (e) {
                    console.error('게임 초기화 실패:', e);
                    window.__PITCHCRAFT_ACTIVE = false;
                }
            } else {
                console.warn('이미 활성화되어 있어 새 인스턴스를 생성하지 않습니다.');
            }
        };
    }
})();
`;
        
        // bundle.js 파일로 저장
        const bundlePath = path.join(__dirname, 'public/bundle.js');
        fs.writeFileSync(bundlePath, bundleContent);
        
        console.log('✅ bundle.js 생성 완료!');
        console.log(`📁 위치: ${bundlePath}`);
        console.log(`📊 크기: ${(fs.statSync(bundlePath).size / 1024).toFixed(2)} KB`);
        
    } catch (error) {
        console.error('❌ 빌드 실패:', error);
        process.exit(1);
    }
}

// 빌드 실행
buildGameBundle();
