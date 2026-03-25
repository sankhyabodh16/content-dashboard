// Design tokens — single source of truth for colors, fonts, radii

export const C = {
  bg: {
    base: '#04040A',
    surface: '#141414',
    elevated: '#1C1C1C',
    input: '#242424',
    sidebar: '#0D0D0D',
  },
  border: {
    default: '#2E2E2E',
    hover: '#3a3a3a',
    subtle: '#1C1C1C',
  },
  text: {
    primary: '#EDEDED',
    secondary: '#A6A6A6',
    muted: '#666666',
  },
  accent: {
    red: '#E83232',
    orange: '#FFB224',
    green: '#00E69D',
    yellow: '#FFB224',
  },
} as const

export const F = {
  display: '"Exo 2", sans-serif',
  body: '"IBM Plex Sans", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const

export const R = {
  card: '12px',
  input: '8px',
  pill: '9999px',
  sm: '6px',
  modal: '16px',
} as const

export const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  twitter: '#CCCCCC',
  instagram: '#E1306C',
  reddit: '#FF4500',
}
