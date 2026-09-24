// Color themes. Each theme gives the four main sections their own harmonized color,
// in light and dark variants. Feedback colors (correct/hint/not quite) never change.
import type { SectionId } from '../content/types';

export interface Swatch {
  /** Buttons, progress fills, icons. */
  solid: string;
  /** Tinted backgrounds. */
  soft: string;
  /** Text on the soft background. */
  ink: string;
}

export interface Ramp {
  light: Swatch;
  dark: Swatch;
}

const R = {
  violet: { light: { solid: '#6d5dd3', soft: '#efedfd', ink: '#3f3494' }, dark: { solid: '#a397f5', soft: '#28244a', ink: '#dcd7ff' } },
  teal: { light: { solid: '#0e9480', soft: '#e2f5f0', ink: '#0a5a4d' }, dark: { solid: '#3fcdb0', soft: '#11342e', ink: '#bdf1e4' } },
  coral: { light: { solid: '#df6237', soft: '#fdeee8', ink: '#8a3417' }, dark: { solid: '#f48f69', soft: '#3a221a', ink: '#ffd8c9' } },
  slate: { light: { solid: '#58637a', soft: '#eef0f5', ink: '#2c3345' }, dark: { solid: '#a0a9bd', soft: '#252932', ink: '#dfe4ee' } },
  blue: { light: { solid: '#2f6fdf', soft: '#e7effd', ink: '#1b3f86' }, dark: { solid: '#72a2f7', soft: '#1b2946', ink: '#d2e1ff' } },
  cyan: { light: { solid: '#0b8fae', soft: '#e1f4f9', ink: '#0b4f60' }, dark: { solid: '#46c3e0', soft: '#12343e', ink: '#c3eef9' } },
  indigo: { light: { solid: '#5147e0', soft: '#ecebfd', ink: '#2e2a8a' }, dark: { solid: '#8e88f6', soft: '#24234b', ink: '#dad8ff' } },
  amber: { light: { solid: '#c9820c', soft: '#fcf2df', ink: '#744604' }, dark: { solid: '#f2b64d', soft: '#382c14', ink: '#ffe7ba' } },
  rose: { light: { solid: '#d63c6b', soft: '#fdeaf0', ink: '#85203f' }, dark: { solid: '#f27d9f', soft: '#3b1c27', ink: '#ffd3df' } },
  green: { light: { solid: '#3a8c2c', soft: '#e9f5e4', ink: '#23551a' }, dark: { solid: '#80c96e', soft: '#1d3219', ink: '#d6f1cd' } },
  stone: { light: { solid: '#6c655d', soft: '#f2f0ec', ink: '#3b3631' }, dark: { solid: '#aea79e', soft: '#2a2825', ink: '#e9e5de' } },
} satisfies Record<string, Ramp>;

export interface Theme {
  id: string;
  name: string;
  description: string;
  sections: Record<SectionId, Ramp>;
}

export const THEMES: Theme[] = [
  {
    id: 'periodic',
    name: 'Periodic',
    description: 'Violet, teal, and coral',
    sections: { basics: R.slate, u1: R.violet, u2: R.teal, u3: R.coral },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Blues and deep indigo',
    sections: { basics: R.slate, u1: R.blue, u2: R.cyan, u3: R.indigo },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm amber, coral, and rose',
    sections: { basics: R.stone, u1: R.amber, u2: R.coral, u3: R.rose },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Greens with a touch of gold',
    sections: { basics: R.stone, u1: R.green, u2: R.teal, u3: R.amber },
  },
];

export const DEFAULT_THEME_ID = 'periodic';

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
