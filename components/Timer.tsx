
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  initialMinutes: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialMinutes, onTimeUp }) => {
  // Store the target end time in a ref so it persists across re-renders 
  // and doesn't change if the component re-renders for other reasons.
  const endTimeRef = useRef<number>(Date.now() + initialMinutes * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep callback ref up to date
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remainingDistance = Math.max(0, Math.floor((endTimeRef.current - now) / 1000));
      
      setTimeLeft(remainingDistance);

      if (remainingDistance <= 0) {
        if (intervalId) clearInterval(intervalId);
        onTimeUpRef.current();
      }
    };

    // Run immediately to sync
    updateTimer();

    // Standard interval for UI updates. Even if throttled by the browser in the background,
    // the NEXT time it runs, it will calculate the delta correctly using Date.now().
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = timeLeft % 60;
  const isWarning = timeLeft < 120; // 2 minutes warning

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-lg font-mono text-xl font-bold border-2 transition-colors duration-300 ${
      isWarning 
        ? 'bg-red-100 border-red-500 text-red-600 animate-pulse' 
        : 'bg-white border-blue-500 text-blue-600'
    }`}>
      <span className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isWarning ? 'animate-spin-slow' : ''}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
      </span>
    </div>
  );
};

export default Timer;
