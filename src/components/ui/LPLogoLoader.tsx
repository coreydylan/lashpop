'use client';

import React from 'react';
import Image from 'next/image';

interface LPLogoLoaderProps {
  /** Optional message to display below the logos */
  message?: string;
  /** Size of the LP logo in pixels (height) */
  size?: number;
}

/**
 * LP + Vagaro connecting animation loader.
 * Shows LP logo connecting to Vagaro with animated dots.
 */
export function LPLogoLoader({ message, size = 40 }: LPLogoLoaderProps) {
  // Calculate aspect ratio for LP logo - original is 122.21x157
  const lpAspectRatio = 122.21 / 157;
  // Scale LP down to match Vagaro V height visually
  const lpHeight = size * 0.75;
  const lpWidth = lpHeight * lpAspectRatio;

  // Vagaro logo is roughly square - size to match LP visually
  const vagaroSize = size * 0.85;

  const defaultMessage = "Preparing your booking experience...";

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Logos with connecting animation */}
      <div className="flex items-center justify-center gap-4">
        {/* LP Logo with gradient */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <svg
            width={lpWidth}
            height={lpHeight}
            viewBox="0 0 122.21 157"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="lp-loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%">
                  <animate
                    attributeName="stop-color"
                    values="rgb(205, 168, 158); rgb(189, 136, 120); rgb(212, 175, 117); rgb(205, 168, 158)"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="100%">
                  <animate
                    attributeName="stop-color"
                    values="rgb(189, 136, 120); rgb(212, 175, 117); rgb(205, 168, 158); rgb(189, 136, 120)"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            </defs>
            <g fill="url(#lp-loader-gradient)">
              <path d="M0,127.73V2.66C.96.93,1.1.95,3.02.84c2.02-.12,12.03-.49,12.03,1.38v113.54c0,1.73,10.65,1.95,12.75,2.31,10.91,1.88,20.05,5.34,29.16,11.6,3.66,2.51,6.74,5.77,10.63,7.98,11.61,6.58,23.7,6.74,36.01,2.05,4.95-1.88,8.63-6.92,12.8-1.27,5.59,7.59-.74,9.49-7.24,12.16-19.56,8.04-36.93,6.92-54.19-5.63-12.23-8.89-18.09-13.04-34.25-14.48-5.51-.49-12.62.75-17.64-.07-1.76-.29-2.02-1.63-3.08-2.68Z"/>
              <path d="M52.25,59.43v47.01c0,.79-14.46,2.78-14.16-2.23l.09-100.56c2.19-.86,4.95-1.53,7.27-.83,2.53.76,3.04,5.18,3.72,5.18,1.57,0,6.34-3.74,8.66-4.63,16.9-6.49,34.71,3.27,39.16,20.55,7.1,27.62-19.76,48.97-44.74,35.5ZM66.13,13.61c-4.96.13-13.35,4.71-13.93,9.85-.32,2.86-.28,22.07.48,23.56,2.11,4.16,14.41,4.88,18.64,3.57,20.07-6.17,15.36-37.52-5.2-36.99Z"/>
              <path d="M76.81,87.1c8.64-.96,14.06,8.59,9.86,16.12-2.27,4.07-6.7,4.59-10.98,4.13-11.19-1.22-10.45-18.96,1.12-20.25Z"/>
            </g>
          </svg>
        </div>

        {/* Connecting dots animation - flowing left to right */}
        <div className="flex items-center gap-1.5">
          <span className="lp-connecting-dot" style={{ animationDelay: '0ms' }} />
          <span className="lp-connecting-dot" style={{ animationDelay: '200ms' }} />
          <span className="lp-connecting-dot" style={{ animationDelay: '400ms' }} />
        </div>

        {/* Vagaro Logo with matching colorization */}
        <div
          className="flex-shrink-0 relative flex items-center justify-center"
          style={{
            width: vagaroSize,
            height: vagaroSize,
          }}
        >
          <Image
            src="/lashpop-images/Vagaro_Logo.png"
            alt="Vagaro"
            fill
            className="object-contain lp-vagaro-logo"
          />
        </div>
      </div>

      {/* Loading message with gradient color */}
      <p className="text-sm lp-loader-text text-center max-w-[260px]">
        {message || defaultMessage}
      </p>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes lp-dot-flow {
          0% {
            opacity: 0.2;
            transform: scale(0.6);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0.2;
            transform: scale(0.6);
          }
        }

        .lp-connecting-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(205, 168, 158), rgb(189, 136, 120));
          animation: lp-dot-flow 1.2s ease-in-out infinite;
        }

        .lp-vagaro-logo {
          /* Shift coral/salmon to dusty rose - desaturate and shift hue */
          filter: saturate(0.5) sepia(0.3) hue-rotate(-20deg) brightness(0.9);
        }

        .lp-loader-text {
          color: rgb(165, 130, 118);
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
