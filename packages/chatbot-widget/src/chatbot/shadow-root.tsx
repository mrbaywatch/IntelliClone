'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

interface ShadowRootProps {
  children: React.ReactNode;
  styles?: string;
}

export function ShadowRoot({ children, styles }: ShadowRootProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useLayoutEffect(() => {
    if (hostRef.current && !hostRef.current.shadowRoot) {
      const shadow = hostRef.current.attachShadow({ mode: 'open' });
      setShadowRoot(shadow);
    }
  }, []);

  return (
    <div
      ref={hostRef}
      style={{
        display: 'contents',
      }}
    >
      {shadowRoot &&
        createPortal(
          <>
            {styles && <style>{styles}</style>}
            {children}
          </>,
          shadowRoot,
        )}
    </div>
  );
}
