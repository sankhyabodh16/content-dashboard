export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Exo 2"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: { red: '#E83232' },
        surface: {
          base: '#04040A',
          page: '#0D0D0D',
          card: '#141414',
          secondary: '#1C1C1C',
          input: '#242424',
        },
        border: { DEFAULT: '#2E2E2E' },
        text: {
          primary: '#EDEDED',
          accent: '#A6A6A6',
          muted: '#999999',
          subtle: '#666666',
          white: '#FFFFFF',
        },
        status: {
          positive: '#00E69D',
          warning: '#FFB224',
          destructive: '#FF3B7A',
          orange: '#FF8C00',
        },
        platform: {
          youtube: '#FF0000',
          reddit: '#FF4500',
          instagram: '#E1306C',
          'instagram-purple': '#833AB4',
          'instagram-red': '#FD1D1D',
          linkedin: '#0A66C2',
          twitter: '#CCCCCC',
        },
      },
    },
  },
  plugins: [],
}
