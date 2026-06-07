import { useEffect, useState } from 'react';
import HangerRender from './HangerRender';
import { getProductImage } from '../lib/productImages';

/**
 * ProductImage — renders a local studio product photo inside a consistent
 * "lightbox" stage so every product reads like the same controlled shoot
 * (light niche works in both light & dark themes; the white photo background
 * blends seamlessly via multiply). No distortion (object-contain), uniform
 * padding, lazy loading, blur-up skeleton, fade-in, and an optional hover zoom.
 *
 * Falls back to the shaded vector render only if the folder has no match.
 */
export default function ProductImage({
  product,
  image: imageProp,
  zoom = true,
  rounded = '',
  className = '',
  sizes,
}) {
  const image = imageProp || getProductImage(product);
  const [loaded, setLoaded] = useState(false);

  // Re-trigger the fade-in when the chosen photo changes (e.g. gallery switch).
  useEffect(() => setLoaded(false), [image?.src]);

  return (
    <div className={`studio-stage relative h-full w-full overflow-hidden ${rounded} ${className}`}>
      {/* Blur-up / shimmer placeholder while the photo decodes */}
      {image && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-black/[0.04] to-black/[0.08]" aria-hidden="true" />
      )}

      {image ? (
        <img
          key={image.src}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          src={image.src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          className={[
            'relative h-full w-full select-none object-contain p-[9%]',
            'transition-[opacity,transform] duration-700 ease-out [mix-blend-mode:multiply]',
            loaded ? 'opacity-100' : 'opacity-0',
            zoom ? 'group-hover:scale-[1.06]' : '',
          ].join(' ')}
          draggable="false"
        />
      ) : (
        // Strict fallback: never an external/stock asset — the local vector render.
        <HangerRender
          variant={product?.hanger_style}
          material={product?.material}
          className={`relative h-full w-full p-[8%] ${zoom ? 'transition-transform duration-500 group-hover:scale-[1.06]' : ''}`}
        />
      )}
    </div>
  );
}
