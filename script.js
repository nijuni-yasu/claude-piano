class ClaudePiano {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.reverbGain = null;
        this.delayGain = null;
        this.activeNotes = new Map();
        this.currentSoundType = 'synth';
        this.isRecording = false;
        this.recordedNotes = [];
        this.recordingStartTime = null;
        this.pressedKeys = new Set();
        
        // キーマッピング
        this.keyMap = {
            'a': { note: 'C4', frequency: 261.63 },
            's': { note: 'D4', frequency: 293.66 },
            'd': { note: 'E4', frequency: 329.63 },
            'f': { note: 'F4', frequency: 349.23 },
            'g': { note: 'G4', frequency: 392.00 },
            'h': { note: 'A4', frequency: 440.00 },
            'j': { note: 'B4', frequency: 493.88 },
            'k': { note: 'C5', frequency: 523.25 },
            'l': { note: 'D5', frequency: 587.33 },
            ';': { note: 'E5', frequency: 659.25 },
            "'": { note: 'F5', frequency: 698.46 },
            '\\': { note: 'G5', frequency: 783.99 }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Web Audio APIの初期化
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.setupAudioNodes();
            this.setupEventListeners();
            this.setupVisualizer();
            
            console.log('Claude Piano initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Claude Piano:', error);
            alert('Audio initialization failed. Please refresh the page.');
        }
    }
    
    setupAudioNodes() {
        // マスターゲインノード
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.audioContext.currentTime);
        
        // リバーブ用のコンボリューションリバーブ
        this.reverbGain = this.audioContext.createGain();
        this.reverbGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        
        // ディレイエフェクト
        this.delayNode = this.audioContext.createDelay(1.0);
        this.delayNode.delayTime.setValueAtTime(0.2, this.audioContext.currentTime);
        this.delayGain = this.audioContext.createGain();
        this.delayGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        
        // エフェクトチェーンの接続
        this.delayNode.connect(this.delayGain);
        this.delayGain.connect(this.delayNode);
        this.delayGain.connect(this.masterGain);
        
        this.masterGain.connect(this.audioContext.destination);
    }
    
    setupEventListeners() {
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // UIコントロール
        document.getElementById('soundType').addEventListener('change', (e) => {
            this.currentSoundType = e.target.value;
        });
        
        document.getElementById('volume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
            document.getElementById('volumeValue').textContent = e.target.value;
        });
        
        document.getElementById('reverb').addEventListener('input', (e) => {
            const reverb = e.target.value / 100;
            this.reverbGain.gain.setValueAtTime(reverb, this.audioContext.currentTime);
        });
        
        document.getElementById('delay').addEventListener('input', (e) => {
            const delay = e.target.value / 100;
            this.delayGain.gain.setValueAtTime(delay, this.audioContext.currentTime);
        });
        
        // 録音コントロール
        document.getElementById('record-btn').addEventListener('click', () => this.toggleRecording());
        document.getElementById('play-btn').addEventListener('click', () => this.playRecording());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopPlayback());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadRecording());
        
        // ピアノキーのクリックイベント
        document.querySelectorAll('.piano-key').forEach(key => {
            key.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const keyChar = key.dataset.key;
                if (!this.pressedKeys.has(keyChar)) {
                    this.playNote(keyChar);
                }
            });
            
            key.addEventListener('mouseup', (e) => {
                e.preventDefault();
                const keyChar = key.dataset.key;
                this.stopNote(keyChar);
            });
            
            key.addEventListener('mouseleave', (e) => {
                const keyChar = key.dataset.key;
                this.stopNote(keyChar);
            });
        });
        
        // ページロード時にオーディオコンテキストを開始
        document.addEventListener('click', () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
    }
    
    setupVisualizer() {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        
        this.canvas = document.getElementById('visualizer-canvas');
        this.canvasCtx = this.canvas.getContext('2d');
        
        this.masterGain.connect(this.analyser);
        
        this.visualize();
    }
    
    visualize() {
        requestAnimationFrame(() => this.visualize());
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        this.canvasCtx.fillStyle = 'rgba(10, 10, 10, 0.2)';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const barWidth = this.canvas.width / bufferLength;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * this.canvas.height * 0.8;
            
            const r = Math.floor(barHeight / this.canvas.height * 255);
            const g = Math.floor(255 - (barHeight / this.canvas.height * 255));
            const b = 255;
            
            this.canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth;
        }
    }
    
    createOscillator(frequency, soundType) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 音色に応じて波形を設定
        switch (soundType) {
            case 'synth':
                oscillator.type = 'sawtooth';
                break;
            case 'pad':
                oscillator.type = 'sine';
                break;
            case 'bass':
                oscillator.type = 'square';
                break;
            case 'arpeggio':
                oscillator.type = 'triangle';
                break;
            case 'fx':
                oscillator.type = 'sawtooth';
                break;
            default:
                oscillator.type = 'sine';
        }
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // エンベロープ（ADSR）
        const attackTime = 0.1;
        const decayTime = 0.1;
        const sustainLevel = 0.6;
        const releaseTime = 0.3;
        
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.8, now + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        gainNode.connect(this.delayNode);
        
        return { oscillator, gainNode };
    }
    
    handleKeyDown(event) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const key = event.key.toLowerCase();
        
        // キーリピートを防ぐ
        if (this.pressedKeys.has(key) || !this.keyMap[key]) {
            return;
        }
        
        event.preventDefault();
        this.playNote(key);
    }
    
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        if (!this.keyMap[key]) {
            return;
        }
        
        event.preventDefault();
        this.stopNote(key);
    }
    
    playNote(key) {
        if (!this.keyMap[key] || this.pressedKeys.has(key)) {
            return;
        }
        
        this.pressedKeys.add(key);
        
        const { frequency } = this.keyMap[key];
        const { oscillator, gainNode } = this.createOscillator(frequency, this.currentSoundType);
        
        this.activeNotes.set(key, { oscillator, gainNode });
        
        // 視覚的フィードバック
        const keyElement = document.querySelector(`[data-key=\"${key}\"]`);
        if (keyElement) {
            keyElement.classList.add('active');
        }
        
        // 録音
        if (this.isRecording) {
            this.recordedNotes.push({
                key,
                frequency,
                timestamp: Date.now() - this.recordingStartTime,
                type: 'start'
            });
        }
        
        oscillator.start();
    }
    
    stopNote(key) {
        if (!this.pressedKeys.has(key)) {
            return;
        }
        
        this.pressedKeys.delete(key);
        
        const noteData = this.activeNotes.get(key);
        if (noteData) {
            const { oscillator, gainNode } = noteData;
            
            // フェードアウト
            const now = this.audioContext.currentTime;
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            oscillator.stop(now + 0.3);
            this.activeNotes.delete(key);
        }
        
        // 視覚的フィードバックを削除
        const keyElement = document.querySelector(`[data-key=\"${key}\"]`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        
        // 録音
        if (this.isRecording) {
            this.recordedNotes.push({
                key,
                timestamp: Date.now() - this.recordingStartTime,
                type: 'stop'
            });
        }
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        this.isRecording = true;
        this.recordedNotes = [];
        this.recordingStartTime = Date.now();
        
        const recordBtn = document.getElementById('record-btn');
        recordBtn.textContent = '録音停止';
        recordBtn.style.background = 'linear-gradient(135deg, #FF0080 0%, #CC0066 100%)';
        
        console.log('Recording started');
    }
    
    stopRecording() {
        this.isRecording = false;
        
        const recordBtn = document.getElementById('record-btn');
        recordBtn.textContent = '演奏録音';
        recordBtn.style.background = 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)';
        
        document.getElementById('play-btn').disabled = false;
        document.getElementById('download-btn').disabled = false;
        
        console.log('Recording stopped. Notes recorded:', this.recordedNotes.length);
    }
    
    playRecording() {
        if (this.recordedNotes.length === 0) {
            alert('録音されたデータがありません。');
            return;
        }
        
        console.log('Playing recording...');
        
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        
        playBtn.disabled = true;
        stopBtn.disabled = false;
        
        this.playbackTimeouts = [];
        
        this.recordedNotes.forEach(note => {
            const timeout = setTimeout(() => {
                if (note.type === 'start') {
                    this.playNote(note.key);
                } else {
                    this.stopNote(note.key);
                }
            }, note.timestamp);
            
            this.playbackTimeouts.push(timeout);
        });
        
        // 再生終了後の処理
        const maxTime = Math.max(...this.recordedNotes.map(n => n.timestamp));
        const endTimeout = setTimeout(() => {
            playBtn.disabled = false;
            stopBtn.disabled = true;
        }, maxTime + 1000);
        
        this.playbackTimeouts.push(endTimeout);
    }
    
    stopPlayback() {
        if (this.playbackTimeouts) {
            this.playbackTimeouts.forEach(timeout => clearTimeout(timeout));
            this.playbackTimeouts = [];
        }
        
        // 全ての音を停止
        this.pressedKeys.forEach(key => this.stopNote(key));
        
        document.getElementById('play-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    }
    
    downloadRecording() {
        if (this.recordedNotes.length === 0) {
            alert('録音されたデータがありません。');
            return;
        }
        
        const data = {
            notes: this.recordedNotes,
            tempo: 120,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `claude-piano-recording-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.claudePiano = new ClaudePiano();
    
    // キャンバスのサイズを設定
    const canvas = document.getElementById('visualizer-canvas');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    });
});