'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

export type Value = string | number;

interface Props {
  value: Value;
  trend?: boolean;
  duration?: number;
  delay?: number;
}

export default function NumberFlow({
  value,
  trend = true,
  duration = 0.4,
  delay = 0,
}: Props) {
  const prevValue = useRef<Value>(value);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(Number(prevValue.current), Number(value), {
      duration,
      delay,
      onUpdate(value) {
        node.textContent = Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      },
    });

    prevValue.current = value;

    return () => controls.stop();
  }, [value, duration, delay]);

  return <span ref={nodeRef} />;
} 