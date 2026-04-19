export default function DiamondIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 9l4-5h12l4 5-10 11L2 9z" fill="url(#dg)" />
      <path d="M2 9h20M8 4l4 5 4-5M12 14l-10-5M12 14l10-5" stroke="#b45309" strokeWidth="0.6" strokeLinejoin="round" />
      <defs>
        <linearGradient id="dg" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}
