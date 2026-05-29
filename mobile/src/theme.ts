// WagerPals — "Midnight Glass" theme for the mobile app.
// Dark, glassy, neon — mirrors the web design system.
// Import { colors, radius, spacing, glass, gradients } from '../theme'.

export const colors = {
  // Base canvas
  bg: '#07070f',
  bg2: '#0b0b18',
  // Card / glass surfaces (semi-opaque over the dark bg → reads as frosted glass)
  surface: '#12121f',
  surfaceElevated: '#181826',
  surfaceGlass: 'rgba(255,255,255,0.05)',
  surfaceGlassStrong: 'rgba(255,255,255,0.08)',
  // Hairline borders
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  // Text
  text: '#f4f5fb',
  textMuted: '#9a9eb8',
  textFaint: '#6f7390',
  // Brand "ember"
  brand1: '#ff7a3d',
  brand2: '#ff3d81',
  brand3: '#a855f7',
  brand: '#ff3d81',
  // Neon accents
  violet: '#8b7bff',
  cyan: '#38e1ff',
  mint: '#3ee6b0', // yes / win / positive
  rose: '#ff5d7e', // no / loss / danger
  amber: '#ffc23d',
  // Translucent accent fills
  mintFill: 'rgba(62,230,176,0.12)',
  roseFill: 'rgba(255,93,126,0.12)',
  brandFill: 'rgba(255,61,129,0.12)',
  cyanFill: 'rgba(56,225,255,0.12)',
  white: '#ffffff',
} as const;

export const gradients = {
  brand: ['#ff7a3d', '#ff3d81', '#a855f7'] as const, // ember
  cool: ['#38e1ff', '#8b7bff'] as const,
  mint: ['#3ee6b0', '#22d3aa'] as const,
  rose: ['#ff5d7e', '#ff3d81'] as const,
  card: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Reusable style fragments
export const glass = {
  card: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  cardStrong: {
    backgroundColor: colors.surfaceGlassStrong,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
} as const;

// Soft neon shadow (iOS). Pass a color from `colors`.
export const glow = (color: string, opacity = 0.5) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: opacity,
  shadowRadius: 16,
  elevation: 8,
});

// Standard text-input styling for dark glass forms.
export const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: radius.md,
  color: colors.text,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 16,
} as const;

export default { colors, gradients, radius, spacing, glass, glow, inputStyle };
