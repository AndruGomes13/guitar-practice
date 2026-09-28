/**
 * Synthesizes a plucked string with the Karplus–Strong algorithm.
 *
 * The loop is a delay line followed by a two-point average (which damps high
 * harmonics, like a real string). A delay line only comes in whole samples, so
 * a first-order all-pass filter adds the fractional part; without it, high
 * notes come out noticeably sharp.
 */
export function synthesizePluck(
  frequency: number,
  sampleRate: number,
  seconds: number,
  random: () => number = Math.random,
): Float32Array {
  const length = Math.floor(sampleRate * seconds);
  const out = new Float32Array(length);

  // With this ring-buffer layout the loop delay is (n - 0.5) samples from the
  // delay line and average, plus d from the all-pass. Solve n + d = period + 0.5.
  const target = sampleRate / frequency + 0.5;
  let n = Math.floor(target);
  let d = target - n;
  if (d < 0.2) {
    // The all-pass is best behaved with its delay between ~0.2 and ~1.2 samples.
    n -= 1;
    d += 1;
  }
  const c = (1 - d) / (1 + d);

  // Excite the string with a slightly low-passed noise burst (less harsh than raw noise).
  const ring = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    prev = 0.5 * prev + 0.5 * (random() * 2 - 1);
    ring[i] = prev;
  }

  let idx = 0;
  let allpassIn = 0;
  let allpassOut = 0;
  for (let i = 0; i < length; i++) {
    const next = idx + 1 === n ? 0 : idx + 1;
    const value = ring[idx];
    out[i] = value;
    const averaged = 0.996 * 0.5 * (value + ring[next]);
    allpassOut = c * averaged + allpassIn - c * allpassOut;
    allpassIn = averaged;
    ring[idx] = allpassOut;
    idx = next;
  }
  return out;
}
