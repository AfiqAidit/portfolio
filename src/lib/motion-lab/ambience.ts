/**
 * Loop for /demos/motion-lab: public/demos/motion-lab/ambient.mp3 only.
 */

const TRACK = "/demos/motion-lab/ambient.mp3";

export type MotionLabAudio = {
  analyser: AnalyserNode;
  /** Start or resume the loop. Resolves false when the browser blocks autoplay. */
  enable: () => Promise<boolean>;
  disable: () => void;
  dispose: () => void;
};

export function createMotionLabAudio(): MotionLabAudio | null {
  if (typeof window === "undefined") return null;

  const AudioCtx =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  const audio = new Audio(TRACK);
  audio.loop = true;
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";

  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.75;

  const source = ctx.createMediaElementSource(audio);
  source.connect(master);
  master.connect(analyser);
  analyser.connect(ctx.destination);

  let audible = false;
  let disposed = false;

  const fadeTo = (level: number, seconds: number) => {
    if (disposed || ctx.state === "closed") return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(level, now + seconds);
  };

  const keepPlaying = () => {
    if (!audible || disposed || !audio.paused) return;
    void audio.play();
  };

  audio.addEventListener("ended", keepPlaying);

  return {
    analyser,
    async enable() {
      if (disposed) return false;
      audible = true;
      void ctx.resume().catch(() => undefined);
      fadeTo(0.85, 0.35);
      try {
        await audio.play();
        return !disposed;
      } catch {
        return false;
      }
    },
    disable() {
      audible = false;
      fadeTo(0, 0.25);
      window.setTimeout(() => {
        if (!audible) audio.pause();
      }, 280);
    },
    dispose() {
      disposed = true;
      audible = false;
      audio.removeEventListener("ended", keepPlaying);
      audio.pause();
      audio.src = "";
      if (ctx.state === "running") void ctx.close().catch(() => undefined);
    },
  };
}
