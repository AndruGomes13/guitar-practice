import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function TriadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5 5.5 17h13z" opacity={0.45} />
      <circle cx="12" cy="5" r="2.6" fill="currentColor" />
      <circle cx="5.5" cy="17" r="2.6" fill="currentColor" />
      <circle cx="18.5" cy="17" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function FretboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
      <path d="M8 6v12M13 6v12M18 6v12" opacity={0.5} />
      <path d="M2.5 10h19M2.5 14h19" opacity={0.5} />
      <circle cx="10.5" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5.5v13l10-6.5z" fill="currentColor" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IntervalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="17" r="2.6" fill="currentColor" />
      <circle cx="18" cy="7" r="2.6" fill="currentColor" />
      <path d="M8.5 15.5c2-4.5 4.5-7 7-7.8" opacity={0.6} />
      <path d="M13.5 6.6l2 1.1-1 2.1" opacity={0.6} />
    </svg>
  );
}

export function ReplayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4.5v4h4" />
    </svg>
  );
}
