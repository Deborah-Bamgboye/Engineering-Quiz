
import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialMinutes: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ initialMinutes, onTimeUp }) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const minutesLeft = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;

  const isWarning = seconds < 120; // 2 minutes

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-lg font-mono text-xl font-bold border-2 ${
      isWarning ? 'bg-red-100 border-red-500 text-red-600 animate-pulse' : 'bg-white border-blue-500 text-blue-600'
    }`}>
      {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
    </div>
  );
};

export default Timer;
