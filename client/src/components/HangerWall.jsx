import { useEffect, useMemo, useRef, useState } from 'react';
import { getTypeImages } from '../lib/productImages';
import { useTheme } from '../context/ThemeContext';

const COLUMNS = 18; // enough to cover very wide screens; extras are clipped
const ROWS = 7; // one block is taller than the hero at every breakpoint

// ---------------------------------------------------------------------------
// Dark theme silhouettes.
// The studio photos sit on pure white (255,255,255). On the light theme a
// multiply blend makes that white vanish. On charcoal there is no blend that
// works for every hanger colour (inverting hides white hangers), so for dark we
// cut each hanger out once per session: alpha = how far a pixel is from white,
// colour = one soft warm-light tone. Result: even, quiet silhouettes of every
// hanger type, small (256px) and cached for the whole visit.
// ---------------------------------------------------------------------------
const SIL_SIZE = 256;
const SIL_RGB = [228, 213, 192];
const SIL_FLOOR = 14; // ignore near-white noise and the faintest studio shadow
const SIL_GAIN = 2.4; // how quickly pale pixels become opaque
let silhouettesPromise = null;

function buildSilhouettes(urls) {
  if (!silhouettesPromise) {
    silhouettesPromise = Promise.all(
      urls.map(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = SIL_SIZE;
        canvas.height = SIL_SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const scale = Math.min(SIL_SIZE / img.naturalWidth, SIL_SIZE / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, SIL_SIZE, SIL_SIZE);
        ctx.drawImage(img, (SIL_SIZE - w) / 2, (SIL_SIZE - h) / 2, w, h);
        const frame = ctx.getImageData(0, 0, SIL_SIZE, SIL_SIZE);
        const px = frame.data;
        for (let i = 0; i < px.length; i += 4) {
          const distance = 255 - Math.min(px[i], px[i + 1], px[i + 2]);
          px[i] = SIL_RGB[0];
          px[i + 1] = SIL_RGB[1];
          px[i + 2] = SIL_RGB[2];
          px[i + 3] = Math.max(0, Math.min(255, (distance - SIL_FLOOR) * SIL_GAIN));
        }
        ctx.putImageData(frame, 0, 0);
        return canvas.toDataURL('image/png');
      })
    ).catch(() => {
      silhouettesPromise = null; // allow a retry on the next dark render
      return null;
    });
  }
  return silhouettesPromise;
}

/**
 * HangerWall — a quiet, full-bleed texture of small hanger photos (one per hanger
 * type) laid out on an invisible grid and drifting slowly downwards forever.
 *
 * Seamless loop: the track holds two identical blocks, each padded by one gap at
 * the bottom so a block's height is exactly ROWS × (tile + gap). Animating the
 * track from -50% to 0 therefore moves it by one full block pitch, and the frame
 * at the end is identical to the frame at the start.
 *
 * Decorative only, so hidden from assistive tech. Stops for reduced-motion users
 * and pauses while scrolled off-screen.
 */
export default function HangerWall() {
  const photos = useMemo(() => getTypeImages(), []);
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [silhouettes, setSilhouettes] = useState(null);
  const ref = useRef(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    if (!dark || silhouettes) return undefined;
    let active = true;
    buildSilhouettes(photos).then((list) => active && list && setSilhouettes(list));
    return () => {
      active = false;
    };
  }, [dark, photos, silhouettes]);

  // Pause the animation while the hero is scrolled out of view (saves battery).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const images = dark ? silhouettes : photos;
  const ready = Boolean(images?.length);

  // Neighbours never repeat: horizontal step 3, vertical step 4 (also across
  // the seam between blocks) for the ~17 hanger types.
  const block = (copy) => (
    <div className="flex justify-center gap-10 pb-10 md:gap-14 md:pb-14">
      {Array.from({ length: COLUMNS }, (_, c) => (
        <div key={c} className="flex shrink-0 flex-col gap-10 md:gap-14">
          {Array.from({ length: ROWS }, (_, r) => (
            <img
              key={`${copy}-${r}`}
              src={images[(c * 3 + r * 4) % images.length]}
              alt=""
              // Eager: only ~17 unique small files, cached after first load.
              // Lazy-loading misfires inside the moving, clipped layer.
              loading="eager"
              decoding="async"
              draggable="false"
              className="h-24 w-24 select-none object-contain saturate-[.8] md:h-32 md:w-32"
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={[
        'pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000',
        // Light: multiply removes the white photo backgrounds.
        // Dark: pre-cut transparent silhouettes, no blending needed.
        dark ? 'opacity-[0.16]' : 'opacity-[0.42] mix-blend-multiply',
        ready ? '' : '!opacity-0',
      ].join(' ')}
    >
      {ready && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 'max-content' }}>
          <div
            className="animate-drift will-change-transform motion-reduce:animate-none"
            style={{ animationPlayState: onScreen ? 'running' : 'paused' }}
          >
            {block('a')}
            {block('b')}
          </div>
        </div>
      )}
    </div>
  );
}
