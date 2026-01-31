/**
 * 程序化音频管理器
 * 使用 Web Audio API 实时合成音效和音乐
 */
export class ProceduralAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3; // 默认音量

        this.currentBgmNodes = [];
        this.isPlaying = false;
        this.currentTheme = null;
    }

    /**
     * 启动音频上下文 (需要用户交互)
     */
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * 播放背景音乐
     * @param {string} theme 'lobby' | 'battle'
     */
    playBgm(theme) {
        if (this.currentTheme === theme && this.isPlaying) return;
        this.stopBgm();
        this.currentTheme = theme;
        this.isPlaying = true;
        this.resume();

        if (theme === 'lobby') {
            this.playLobbyMusic();
        } else if (theme === 'battle') {
            this.playBattleMusic();
        }
    }

    stopBgm() {
        this.currentBgmNodes.forEach(node => {
            try {
                node.stop();
                node.disconnect();
            } catch (e) {}
        });
        this.currentBgmNodes = [];
        this.isPlaying = false;
        this.currentTheme = null;
    }

    /**
     * 播放音效：射击 (Laser Blaster)
     */
    playShoot() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    /**
     * 播放音效：命中 (Impact)
     */
    playHit() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    /**
     * 播放音效：爆炸 (Explosion Noise)
     */
    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        
        // 创建白噪声 buffer
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5s
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
    }

    /**
     * 播放音效：死亡 (Retro Fade)
     */
    playDeath() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.4); // 下滑音

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.4);
    }

    /**
     * 播放音效：胜利 (Victory Jingle)
     */
    playVictory() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
        
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = t + i * 0.15;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }

    /**
     * 大厅音乐：舒缓、空灵的氛围 (Ambient Pad)
     */
    playLobbyMusic() {
        const now = this.ctx.currentTime;
        // 根音循环: C maj7 -> A min7
        const progression = [261.63, 220.00]; // C4, A3
        
        const playChord = (time, freq) => {
            // 创建三个振荡器组成和弦
            [1, 1.25, 1.5].forEach((ratio, i) => { // Major scale approx
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq * ratio;
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.1, time + 2); // 淡入
                gain.gain.exponentialRampToValueAtTime(0.001, time + 8); // 淡出
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start(time);
                osc.stop(time + 8);
                
                this.currentBgmNodes.push(osc);
            });
        };

        // 循环播放
        const loop = () => {
            if (!this.isPlaying || this.currentTheme !== 'lobby') return;
            const t = this.ctx.currentTime;
            playChord(t, progression[0]);
            setTimeout(() => playChord(this.ctx.currentTime, progression[1]), 4000);
            setTimeout(loop, 8000);
        };
        loop();
    }

    /**
     * 战斗音乐：热血激昂、节奏紧凑、史诗感 (Epic Synthwave / Rock)
     */
    playBattleMusic() {
        const bpm = 160; // 提高 BPM
        const beatTime = 60 / bpm;
        
        // 鼓组 (Kick, Snare, Hihat)
        const playDrum = (time, type) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);

            if (type === 'kick') {
                osc.frequency.setValueAtTime(150, time);
                osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
                gain.gain.setValueAtTime(0.6, time); // 0.8 -> 0.6
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            } else if (type === 'snare') {
                osc.type = 'triangle'; // 模拟军鼓的 tone
                osc.frequency.setValueAtTime(200, time);
                gain.gain.setValueAtTime(0.3, time); // 0.4 -> 0.3
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                // 应该加噪音，这里简化
            } else if (type === 'hihat') {
                osc.type = 'square'; // 模拟高频
                osc.frequency.setValueAtTime(8000, time);
                gain.gain.setValueAtTime(0.08, time); // 0.1 -> 0.08
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            }

            osc.start(time);
            osc.stop(time + 0.5);
        };

        // Bassline (Driving 8th notes)
        const playBass = (time, freq) => {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.2); // Pluck effect
            
            gain.gain.setValueAtTime(0.25, time); // 0.4 -> 0.25
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(time);
            osc.stop(time + 0.3);
            this.currentBgmNodes.push(osc);
        };

        // Power Chords (Epic Pad)
        const playChord = (time, notes) => {
            notes.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                
                // 慢一点的 attack，持续长音
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.1, time + 0.1); // 0.15 -> 0.1
                gain.gain.setValueAtTime(0.1, time + beatTime * 15); // 0.15 -> 0.1
                gain.gain.linearRampToValueAtTime(0, time + beatTime * 16);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(time);
                osc.stop(time + beatTime * 16);
                this.currentBgmNodes.push(osc);
            });
        };

        // Arpeggio (Fast 16th notes)
        const playArp = (time, notes) => {
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq * 2; // 高八度
                
                const t = time + i * (beatTime / 4);
                gain.gain.setValueAtTime(0.05, t); // 0.08 -> 0.05
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(t);
                osc.stop(t + 0.15);
                this.currentBgmNodes.push(osc);
            });
        };

        // 编曲循环 (4 小节)
        let bar = 0;
        const progression = [
            [65.41, 98.00, 130.81], // C2 (C power chord)
            [58.27, 87.31, 116.54], // Bb2
            [73.42, 110.00, 146.83], // D2
            [87.31, 130.81, 174.61]  // F2
        ]; // 比较激昂的进行

        const loop = () => {
            if (!this.isPlaying || this.currentTheme !== 'battle') return;
            
            const t = this.ctx.currentTime;
            const currentChord = progression[bar % 4];
            const rootFreq = currentChord[0];

            // 1. Chords (每4小节换一次，或者每小节)
            // 这里每小节换一个和弦
            playChord(t, currentChord);

            // 2. Bass & Drums (每拍)
            for (let i = 0; i < 16; i++) { // 16分音符，4拍
                const stepTime = t + i * (beatTime / 4);
                
                // Kick: 1, 3拍 + 一些切分
                if (i === 0 || i === 8 || i === 14) playDrum(stepTime, 'kick');
                
                // Snare: 2, 4拍
                if (i === 4 || i === 12) playDrum(stepTime, 'snare');
                
                // Hihat: 8分音符
                if (i % 2 === 0) playDrum(stepTime, 'hihat');

                // Bass: 8分音符 driving
                if (i % 2 === 0) playBass(stepTime, rootFreq);
            }

            // 3. Arpeggio
            // 简单的上行琶音
            playArp(t, [rootFreq, rootFreq * 1.5, rootFreq * 2, rootFreq * 2.5]);
            playArp(t + beatTime, [rootFreq, rootFreq * 1.5, rootFreq * 2, rootFreq * 2.5]);
            
            bar++;
            // 这里的 chord 持续时间要和 loop 间隔匹配
            // 上面 playChord 写的持续 16 beat，这里 loop 间隔是 4 beat (1 bar)
            // 所以 chord 会重叠。修正：每小节都触发 chord，持续 1 bar.
            // 修正 chord 持续时间: beatTime * 4
            
            setTimeout(loop, beatTime * 4 * 1000);
        };
        loop();
    }
}

export const audioManager = new ProceduralAudio();
