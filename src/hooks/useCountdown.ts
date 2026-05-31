import { useState, useEffect } from 'react';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDate: Date | string | null): CountdownResult {
  const target = targetDate ? new Date(targetDate) : null;

  const calculate = (): CountdownResult => {
    if (!target) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: '' };
    }
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: 'Game time!' };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    const formatted = parts.join(' ');

    return { days, hours, minutes, seconds, isExpired: false, formatted };
  };

  const [result, setResult] = useState<CountdownResult>(calculate);

  useEffect(() => {
    if (!target || target.getTime() <= Date.now()) return;
    const id = setInterval(() => setResult(calculate()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return result;
}
