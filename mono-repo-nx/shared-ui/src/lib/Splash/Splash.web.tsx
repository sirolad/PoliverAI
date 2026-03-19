import React, { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const POLIVERAI_SPLASH_DOTLOTTIE_URL =
  'https://lottie.host/60d101b5-d7e9-4e51-8c0c-2624f51e642a/sGDt58V29f.lottie';

interface SplashProps {
  onFinish?: () => void;
  source?: unknown;
  duration?: number;
  delayMs?: number;
  durationMs?: number;
}

export const Splash: React.FC<SplashProps> = ({ onFinish, duration = 4000, delayMs, durationMs }) => {
  useEffect(() => {
    const ms =
      typeof durationMs === 'number'
        ? durationMs
        : typeof delayMs === 'number'
          ? delayMs
          : duration;
    const timer = setTimeout(() => {
      onFinish?.();
    }, ms);

    return () => clearTimeout(timer);
  }, [delayMs, duration, durationMs, onFinish]);

  return (
    <div style={webOverlayStyle}>
      <div style={webInnerStyle}>
        <DotLottieReact
          src={POLIVERAI_SPLASH_DOTLOTTIE_URL}
          autoplay
          style={webPlayerStyle}
        />
      </div>
    </div>
  );
};

const webOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(255,255,255,0.92)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  pointerEvents: 'none',
};

const webInnerStyle: React.CSSProperties = {
  width: 'min(360px, 70vw)',
  height: 'min(360px, 70vw)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const webPlayerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  filter: 'drop-shadow(0 20px 45px rgba(15, 23, 42, 0.08))',
};

export default Splash;
