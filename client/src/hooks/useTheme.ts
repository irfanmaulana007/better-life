import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    // Background colors
    background: string;
    card: string;
    surface: string;

    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;

    // Brand colors
    primary: string;
    primaryLight: string;

    // Status colors
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;

    // Border and separator
    border: string;
    separator: string;

    // Other
    disabled: string;
    placeholder: string;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#F2F2F7',
    card: '#FFFFFF',
    surface: '#FFFFFF',

    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',

    primary: '#007AFF',
    primaryLight: '#007AFF20',

    success: '#34C759',
    successLight: '#34C75920',
    warning: '#FF9500',
    warningLight: '#FF950020',
    error: '#FF3B30',
    errorLight: '#FF3B3020',

    border: '#E5E5EA',
    separator: '#C6C6C8',

    disabled: '#C7C7CC',
    placeholder: '#C7C7CC',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#000000',
    card: '#1C1C1E',
    surface: '#2C2C2E',

    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#48484A',

    primary: '#0A84FF',
    primaryLight: '#0A84FF30',

    success: '#30D158',
    successLight: '#30D15830',
    warning: '#FF9F0A',
    warningLight: '#FF9F0A30',
    error: '#FF453A',
    errorLight: '#FF453A30',

    border: '#38383A',
    separator: '#48484A',

    disabled: '#48484A',
    placeholder: '#636366',
  },
};

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export { lightTheme, darkTheme };
