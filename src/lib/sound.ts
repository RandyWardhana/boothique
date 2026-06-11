/** Tiny WebAudio sound effects for the booth — beeps and a shutter click. */

let context: AudioContext | null = null;

function audioContext(): AudioContext {
  if (!context) {
    const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.12): void {
  try {
    const ctx = audioContext();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(gain, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(env);
    env.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* audio unavailable — silently ignore */
  }
}

export type SoundEffect = 'beep' | 'beepHigh' | 'shutter';

export const sound: Record<SoundEffect, () => void> = {
  beep: () => tone(880, 0.12, 'sine', 0.1),
  beepHigh: () => tone(1318, 0.18, 'sine', 0.12),
  shutter: () => {
    try {
      const ctx = audioContext();
      const len = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const env = ctx.createGain();
      env.gain.value = 0.25;
      src.connect(env);
      env.connect(ctx.destination);
      src.start();
      tone(220, 0.05, 'square', 0.05);
    } catch {
      /* audio unavailable — silently ignore */
    }
  },
};
