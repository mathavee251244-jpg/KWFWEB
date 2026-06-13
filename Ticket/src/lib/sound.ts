let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function tone(freq: number, duration: number, volume = 0.25): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {}
}

// Two-tone ding for system / ticket notifications
export function playNotifSound(): void {
  tone(880, 0.12, 0.25);
  setTimeout(() => tone(660, 0.2, 0.2), 110);
}

// Single soft ping for incoming chat messages
export function playChatSound(): void {
  tone(1100, 0.1, 0.18);
  setTimeout(() => tone(880, 0.15, 0.14), 90);
}

// Stronger alert for @mention (overrides mute)
export function playMentionSound(): void {
  tone(1320, 0.1, 0.30);
  setTimeout(() => tone(1100, 0.1, 0.25), 100);
  setTimeout(() => tone(880, 0.18, 0.22), 200);
}
