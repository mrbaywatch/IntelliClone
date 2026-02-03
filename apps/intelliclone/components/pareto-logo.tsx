'use client';

interface ParetoLogoProps {
  className?: string;
  color?: string;
}

export function ParetoLogo({ className = "w-10 h-10", color = "currentColor" }: ParetoLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Swooping curve on the left */}
      <path
        d="M 15 95 
           C 15 95, 5 70, 5 50
           C 5 25, 20 8, 45 8
           L 45 20
           C 28 20, 18 32, 18 50
           C 18 68, 15 85, 15 95
           Z"
        fill={color}
      />
      {/* P letter body */}
      <path
        d="M 40 8
           L 40 95
           L 52 95
           L 52 58
           L 65 58
           C 85 58, 95 48, 95 33
           C 95 18, 85 8, 65 8
           L 40 8
           Z
           M 52 20
           L 62 20
           C 75 20, 82 25, 82 33
           C 82 41, 75 46, 62 46
           L 52 46
           L 52 20
           Z"
        fill={color}
      />
    </svg>
  );
}

export function ParetoLogoSimple({ className = "w-10 h-10", color = "white" }: ParetoLogoProps) {
  return (
    <svg 
      viewBox="0 0 60 80" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified Pareto-style P */}
      {/* Left swooping curve */}
      <path
        d="M 8 75 
           Q 2 50, 8 25
           Q 14 5, 35 5
           L 35 15
           Q 20 15, 15 28
           Q 10 45, 12 75
           Z"
        fill={color}
      />
      {/* P stem and bowl */}
      <path
        d="M 28 5
           L 28 75
           L 38 75
           L 38 42
           L 45 42
           Q 58 42, 58 24
           Q 58 5, 45 5
           L 28 5
           Z
           M 38 15
           L 43 15
           Q 48 15, 48 24
           Q 48 32, 43 32
           L 38 32
           Z"
        fill={color}
      />
    </svg>
  );
}
