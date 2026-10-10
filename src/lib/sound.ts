let ctx: AudioContext | undefined

function audio() {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!C) return undefined
    ctx = new C()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, at: number, dur: number, gain: number, type: OscillatorType = 'sine') {
  const a = audio()
  if (!a) return
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, a.currentTime + at)
  g.gain.setValueAtTime(0, a.currentTime + at)
  g.gain.linearRampToValueAtTime(gain, a.currentTime + at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur)
  o.connect(g).connect(a.destination)
  o.start(a.currentTime + at)
  o.stop(a.currentTime + at + dur + 0.02)
}

export function tick() {
  tone(1800, 0, 0.04, 0.025, 'triangle')
}

export function lockSound() {
  tone(220, 0, 0.09, 0.12, 'square')
  tone(880, 0.06, 0.35, 0.06)
  tone(1320, 0.14, 0.5, 0.045)
}

export function rewardSound() {
  ;[784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.4, 0.04))
}

export function primeAudio() {
  audio()
}
