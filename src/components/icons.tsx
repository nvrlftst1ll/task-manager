// ============================================================
// [START: Набор инлайн-SVG-иконок]
// Небольшие иконки в стиле Lucide (stroke 2, round caps).
// Держим их инлайн, чтобы не тянуть зависимость в бандл.
// ============================================================
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

export function IconPlus({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSearch({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconX({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconMinus({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconSquare({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <rect width="14" height="14" x="5" y="5" rx="2" />
    </svg>
  );
}

export function IconRestore({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <rect width="12" height="12" x="9" y="9" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconTrash({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconPencil({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  );
}

export function IconCalendar({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconRotateCcw({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

export function IconCheck({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconSun({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function IconMoon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function IconMonitor({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function IconDownload({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </svg>
  );
}

export function IconArrowLeft({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function IconBell({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconKeyboard({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
    </svg>
  );
}

export function IconDatabase({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  );
}
// ============================================================
// [END: Набор инлайн-SVG-иконок]
// ============================================================
