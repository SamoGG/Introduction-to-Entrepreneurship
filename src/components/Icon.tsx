import type { SVGProps } from 'react';

export type IconName =
  | 'list'
  | 'clock'
  | 'lock'
  | 'sparkle'
  | 'arrow-right'
  | 'arrow-left'
  | 'external'
  | 'check'
  | 'help'
  | 'minus'
  | 'alert'
  | 'chevron-down'
  | 'download'
  | 'retake';

type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function Icon({ name, className = '', ...props }: IconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    focusable: false,
    'aria-hidden': true,
    className: `icon ${className}`.trim(),
    ...props,
  };

  switch (name) {
    case 'list':
      return <svg {...common}><path d="M8 6h11M8 12h11M8 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="5.5" y="10" width="13" height="10" rx="2" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /></svg>;
    case 'sparkle':
      return <svg {...common}><path d="M12 3l1.4 4.2L17.5 9l-4.1 1.8L12 15l-1.4-4.2L6.5 9l4.1-1.8L12 3Z" /><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM5.5 13l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7Z" /></svg>;
    case 'arrow-right':
      return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
    case 'arrow-left':
      return <svg {...common}><path d="M19 12H5M10 7l-5 5 5 5" /></svg>;
    case 'external':
      return <svg {...common}><path d="M8 16 16 8M10 8h6v6" /></svg>;
    case 'check':
      return <svg {...common}><path d="m5 12.5 4.2 4.2L19 7" /></svg>;
    case 'help':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.8 2c-1 .7-1.6 1.2-1.6 2.4M12 17h.01" /></svg>;
    case 'minus':
      return <svg {...common}><path d="M6 12h12" /></svg>;
    case 'alert':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>;
    case 'chevron-down':
      return <svg {...common}><path d="m7 9.5 5 5 5-5" /></svg>;
    case 'download':
      return <svg {...common}><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></svg>;
    case 'retake':
      return <svg {...common}><path d="M3 10a9 9 0 1 1 2.7 8.4M3 4v6h6" /></svg>;
  }
}

export function FlagIcon({ language, className = '' }: { language: 'en' | 'el'; className?: string }) {
  if (language === 'el') {
    return <svg className={`flag-icon ${className}`.trim()} viewBox="0 0 27 18" aria-hidden="true" focusable="false">
      <rect width="27" height="18" rx="1.5" fill="#fff" />
      {[0, 4, 8, 12, 16].map(y => <rect key={y} y={y} width="27" height="2" fill="#0d5eaf" />)}
      <rect width="10" height="10" fill="#0d5eaf" />
      <rect x="4" width="2" height="10" fill="#fff" />
      <rect y="4" width="10" height="2" fill="#fff" />
      <rect x=".5" y=".5" width="26" height="17" rx="1" fill="none" stroke="currentColor" strokeOpacity=".2" />
    </svg>;
  }

  return <svg className={`flag-icon ${className}`.trim()} viewBox="0 0 27 18" aria-hidden="true" focusable="false">
    <rect width="27" height="18" rx="1.5" fill="#21468b" />
    <path d="M0 0 27 18M27 0 0 18" stroke="#fff" strokeWidth="4" />
    <path d="M0 0 27 18M27 0 0 18" stroke="#cf142b" strokeWidth="1.5" />
    <path d="M13.5 0v18M0 9h27" stroke="#fff" strokeWidth="6" />
    <path d="M13.5 0v18M0 9h27" stroke="#cf142b" strokeWidth="3.2" />
    <rect x=".5" y=".5" width="26" height="17" rx="1" fill="none" stroke="#000" strokeOpacity=".18" />
  </svg>;
}
