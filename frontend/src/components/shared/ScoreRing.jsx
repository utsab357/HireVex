import React from 'react';
import { motion } from 'framer-motion';

const ScoreRing = ({ score, size = 64, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  let colorClass = 'text-status-success';
  if (score < 70) colorClass = 'text-status-error';
  else if (score < 85) colorClass = 'text-status-warning';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background ring */}
        <circle
          className="text-surface-container-high stroke-current"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
        />
        {/* Progress ring */}
        <motion.circle
          className={`${colorClass} stroke-current`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {/* Score text directly inside */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="font-bold tracking-tight" style={{ fontSize: size * 0.35 }}>
          {score || 0}
        </span>
      </div>
    </div>
  );
};

export default ScoreRing;
