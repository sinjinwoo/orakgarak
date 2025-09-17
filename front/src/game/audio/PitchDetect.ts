// @ts-ignore
const freqTable = require("./notes.json");

export class PitchDetect {
    micStream: MediaStream | null = null;
    notesArray: any = null;
    audioContext: AudioContext | null = null;
    sourceAudioNode: MediaStreamAudioSourceNode | null = null;
    analyserAudioNode: AnalyserNode | null = null;
    baseFreq = 440;
    lastGoodNote: any = null;
    isMicrophoneInUse = false;
    isInitialized = false;
    pitchDetectionActive = false;

    constructor () {
        if (this.isAudioContextSupported()) {
            this.audioContext = new AudioContext();
            this.notesArray = freqTable[this.baseFreq.toString()];
            this.isInitialized = true;
        } else {
            console.warn("AudioContext is not supported in this browser");
        }
    }

    isAudioContextSupported () {
        return window.AudioContext != null;
    }

    isGetUserMediaSupported () {
        navigator.getUserMedia = (navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia);
        return ((navigator.mediaDevices != null && navigator.mediaDevices.getUserMedia != null) ||
                 navigator.getUserMedia != null);
    }

    getY (height) {
        let notes = this.notesArray;
        if (this.lastGoodNote && notes) {
            let noteIndex = notes.indexOf(this.lastGoodNote);
            if (noteIndex !== -1) {
                // 음정에 따른 정확한 위치 매핑
                // 낮은 음정(인덱스 0) = 화면 하단(height)
                // 높은 음정(인덱스 마지막) = 화면 상단(0)
                let normalizedIndex = noteIndex / (notes.length - 1);
                let pos = height - (normalizedIndex * height);

                // 최소/최대 위치 제한 (화면 경계에서 벗어나지 않도록)
                pos = Math.max(50, Math.min(height - 50, pos));

                return pos;
            }
        }
        return height / 2;
    }

    findFundamentalFreq (buffer: Uint8Array, sampleRate: number) {
        // 개선된 자동상관 분석을 사용하여 기본 주파수 찾기
        let n = Math.min(buffer.length - 2000, 2048); // 버퍼 크기 확인
        let bestK = -1;
        let bestR = 0;

        // 최적화된 주파수 범위 검색 (60Hz ~ 500Hz)
        let minK = Math.floor(sampleRate / 500);  // 최대 500Hz
        let maxK = Math.floor(sampleRate / 60);   // 최소 60Hz

        for (let k = Math.max(8, minK); k <= Math.min(maxK, n); k++) {
            let sum = 0;
            let count = 0;

            for (let i = 0; i < n - k; i++) {
                let val1 = (buffer[i] - 128) / 128;
                let val2 = (buffer[i + k] - 128) / 128;
                sum += val1 * val2;
                count++;
            }

            if (count > 0) {
                let r = sum / count;

                if (r > bestR) {
                    bestR = r;
                    bestK = k;
                }

                // 더 낮은 임계값으로 조기 종료
                if (r > 0.7) {
                    break;
                }
            }
        }

        // 더 낮은 임계값으로 민감도 증가
        if (bestR > 0.001 && bestK > 0) {
            return sampleRate / bestK;
        } else {
            return -1;
        }
    }

    findClosestNote (freq: number, notes) {
        // Use binary search to find the closest note
        let low = -1;
        let high = notes.length;
        while (high - low > 1) {
            let pivot = Math.round((low + high) / 2);
            if (notes[pivot].frequency <= freq) {
                low = pivot;
            } else {
                high = pivot;
            }
        }

        if (Math.abs(notes[high].frequency - freq) <= Math.abs(notes[low].frequency - freq)) {
            // notes[high] is closer to the frequency we found
            return notes[high];
        }

        return notes[low];
    }

    findCentsOffPitch (freq, refFreq) {
        // We need to find how far freq is from this.baseFreq in cents
        let log2 = 0.6931471805599453; // Math.log(2)
        let multiplicativeFactor = freq / refFreq;

        // We use Math.floor to get the integer part and ignore decimals
        let cents = Math.floor(1200 * (Math.log(multiplicativeFactor) / log2));
        return cents;
    }

    detectPitch () {
        try {
            if (!this.analyserAudioNode || !this.notesArray || !this.audioContext || !this.pitchDetectionActive) {
                return;
            }

            let buffer = new Uint8Array(this.analyserAudioNode.fftSize);
            this.analyserAudioNode.getByteTimeDomainData(buffer);

            // 신호 강도 확인
            let signalStrength = this.calculateSignalStrength(buffer);
            if (signalStrength < 0.01) {
                // 신호가 너무 약하면 피치 감지하지 않음
                this.updateNote(null); // lastGoodNote 초기화
                return;
            }

            let fundamentalFreq = this.findFundamentalFreq(buffer, this.audioContext.sampleRate);

            // 최적화된 주파수 범위 (C2부터 A4까지)
            if (fundamentalFreq !== -1 && fundamentalFreq > 60 && fundamentalFreq < 500) {
                let note = this.findClosestNote(fundamentalFreq, this.notesArray);
                if (note) {
                    // 최적화된 음정 범위 (C2부터 A4까지)
                    if (note.frequency >= 64.22 && note.frequency <= 446) {
                        this.updateNote(note);
                        let cents = this.findCentsOffPitch(fundamentalFreq, note.frequency);
                        this.updateCents(cents);

                        // 디버그 정보 출력 (개발 모드에서만)
                        if (process.env.NODE_ENV === "development") {
                            console.log(`피치 감지: ${note.note} (${fundamentalFreq.toFixed(1)}Hz) - ${cents.toFixed(1)}cents`);
                        }
                    } else {
                        // 주파수 범위를 벗어나면 lastGoodNote 초기화
                        this.updateNote(null);
                    }
                } else {
                    // 노트를 찾을 수 없으면 lastGoodNote 초기화
                    this.updateNote(null);
                }
            } else {
                // 피치가 감지되지 않을 때 lastGoodNote 초기화
                this.updateNote(null);
            }
        } catch (error) {
            // 오류 발생 시 lastGoodNote 초기화
            console.warn("Pitch detection error:", error);
            this.updateNote(null);
        }
    }

    calculateSignalStrength (buffer: Uint8Array) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            let val = (buffer[i] - 128) / 128;
            sum += val * val;
        }
        return Math.sqrt(sum / buffer.length);
    }

    streamReceived (stream) {
        try {
            this.micStream = stream;

            // analyser 설정
            this.analyserAudioNode = this.audioContext.createAnalyser();
            this.analyserAudioNode.fftSize = 4096; // 더 높은 해상도
            this.analyserAudioNode.smoothingTimeConstant = 0.8; // 부드러운 변화

            // input 연결
            this.sourceAudioNode = this.audioContext.createMediaStreamSource(this.micStream);
            this.sourceAudioNode.connect(this.analyserAudioNode);

            // 피치 감지 활성화
            this.pitchDetectionActive = true;
            this.isMicrophoneInUse = true;

            // 주기적으로 피치 감지 실행
            this.startPitchDetection();

            console.log("마이크 스트림 연결 완료 - 피치 감지 시작");
        } catch (error) {
            console.warn("Stream processing error:", error);
            this.pitchDetectionActive = false;
        }
    }

    startPitchDetection () {
        if (!this.pitchDetectionActive) return;

        // 최적화된 피치 감지 - 60fps로 제한
        let lastTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        const detectPitchLoop = (currentTime) => {
            if (!this.pitchDetectionActive) return;

            if (currentTime - lastTime >= frameInterval) {
                this.detectPitch();
                lastTime = currentTime;
            }

            requestAnimationFrame(detectPitchLoop);
        };
        requestAnimationFrame(detectPitchLoop);
    }

    turnOffMicrophone () {
        this.pitchDetectionActive = false;

        if (this.sourceAudioNode) {
            if (this.sourceAudioNode.mediaStream) {
                this.sourceAudioNode.mediaStream.getTracks().forEach(track => track.stop());
            }
            this.sourceAudioNode.disconnect();
            this.sourceAudioNode = null;
        }

        this.analyserAudioNode = null;
        this.updateNote(null);
        this.isMicrophoneInUse = false;
        this.micStream = null;

        console.log("마이크 연결 해제 완료");
    }

    turnOnMicrophone () {
        if (!this.isMicrophoneInUse && this.isInitialized) {
            if (this.isGetUserMediaSupported()) {
                const constraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 44100
                    }
                };

                let getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ?
                    navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) :
                    function (constraints) {
                        return new Promise(function (resolve, reject) {
                            navigator.getUserMedia(constraints, resolve, reject);
                        });
                    };

                getUserMedia(constraints)
                    .then(this.streamReceived.bind(this))
                    .catch((error) => {
                        console.warn("마이크 접근 실패:", error);
                        this.pitchDetectionActive = false;
                        throw error;
                    });
            } else {
                console.warn("이 브라우저는 마이크 기능을 지원하지 않습니다.");
                throw new Error("마이크 기능을 지원하지 않는 브라우저입니다.");
            }
        }
    }

    changeBaseFreq (delta) {
        let newBaseFreq = this.baseFreq + delta;
        if (newBaseFreq >= 432 && newBaseFreq <= 446) {
            this.baseFreq = newBaseFreq;
            this.notesArray = freqTable[this.baseFreq.toString()];
            this.updatePitch(this.baseFreq);
        }
    }

    updatePitch (pitch) {
        // console.log("pitch: " + pitch);
        // Do nothing yet
    }

    updateNote (note) {
        this.lastGoodNote = note;
        // console.log("note: " + note);
        // Do nothing yet
    }

    updateCents (cents) {
        // console.log("cents: " + cents);
        // Do nothing yet
    }

    baseFreqChangeHandler (event) {
        this.changeBaseFreq(event.data);
    }
}
