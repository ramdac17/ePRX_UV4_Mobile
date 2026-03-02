const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const CYBER_THEME = {
  background: '#050505',
  card: 'rgba(20, 20, 20, 0.8)',
  primary: '#d4ff00', // Cyan
  accent: '#FF00FF',  // Magenta
  text: '#FFFFFF',
  textMuted: '#888888',
  border: 'rgba(0, 240, 255, 0.3)',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};