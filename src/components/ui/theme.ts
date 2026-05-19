import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type StatusBarStyle } from 'react-native';

const THEME_PREFERENCE_STORAGE_KEY = 'app-theme-preference';

export type AppThemePreference = 'light' | 'dark';

export const darkModeColors = {
  accent: '#7C6EFA',
  accentMuted: '#9D93FB',
  accentSurface: '#1E1B3A',
  background: '#0B0B0F',
  surface: '#141418',
  surfaceAlt: '#1C1C23',
  surfaceMuted: '#222229',
  input: '#1C1C23',
  text: '#F0F0F8',
  muted: '#8585A0',
  divider: '#2A2A38',
  overlay: 'rgba(11, 11, 15, 0.95)',
  backdrop: 'rgba(0, 0, 0, 0.72)',
  iconButton: '#1C1C23',
  danger: '#F05C6A',
  dangerSurface: '#2D1419',
  success: '#22D3A0',
  successSurface: '#0F2D24',
  secondary: '#9D93FB',
  secondarySurface: '#1A1830',
  secondaryText: '#C4BFFD',
  tertiarySurface: '#2D1A18',
  tertiaryText: '#FFD9D3',
  shadow: '#000000',
  statusBar: 'light-content' as StatusBarStyle,
};

export const lightModeColors = {
  accent: '#5B4EE8',
  accentMuted: '#7B6FED',
  accentSurface: '#EEECFD',
  background: '#F5F5FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEDF5',
  surfaceMuted: '#E8E8F2',
  input: '#FFFFFF',
  text: '#18181E',
  muted: '#70708A',
  divider: '#E2E2EE',
  overlay: 'rgba(245, 245, 250, 0.96)',
  backdrop: 'rgba(0, 0, 10, 0.22)',
  iconButton: '#EDEDF5',
  danger: '#D4253A',
  dangerSurface: '#FDEDEF',
  success: '#0DB080',
  successSurface: '#E8F9F4',
  secondary: '#7B6FED',
  secondarySurface: '#EEECFD',
  secondaryText: '#5B4EE8',
  tertiarySurface: '#FEF0EE',
  tertiaryText: '#C0392B',
  shadow: '#8080A8',
  statusBar: 'dark-content' as StatusBarStyle,
};

type AppColors = typeof darkModeColors;

export const CONTROL_SIZES = {
  button: 44,
  buttonCompact: 40,
  input: 52,
  search: 46,
  textAreaMin: 112,
} as const;

export const FLOATING_TAB_BAR = {
  height: 76,
  offset: 18,
  widthPercent: '84%',
  contentPaddingBottom: 142,
} as const;

export const FEEDBACK_COLORS = {
  errorText: '#FB7185',
  errorTextLight: '#D4253A',
} as const;

export const TEXT_INPUT_CLASSNAME = 'rounded-[22px] px-4 py-3 text-[15px]';

function buildShadows(colors: AppColors) {
  const isDark = colors.statusBar === 'light-content';

  return {
    soft: {
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.40 : 0.06,
      shadowRadius: isDark ? 18 : 10,
      shadowOffset: {
        width: 0,
        height: isDark ? 8 : 3,
      },
      elevation: isDark ? 4 : 2,
    },
    softAlt: {
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.30 : 0.05,
      shadowRadius: isDark ? 14 : 8,
      shadowOffset: {
        width: 0,
        height: isDark ? 6 : 2,
      },
      elevation: isDark ? 3 : 1,
    },
    floatingCompact: {
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.50 : 0.10,
      shadowRadius: isDark ? 24 : 16,
      shadowOffset: {
        width: 0,
        height: isDark ? 10 : 4,
      },
      elevation: isDark ? 6 : 4,
    },
    modalSheet: {
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.60 : 0.10,
      shadowRadius: isDark ? 36 : 24,
      shadowOffset: {
        width: 0,
        height: isDark ? -12 : -4,
      },
      elevation: isDark ? 12 : 6,
    },
    modalSheetStrong: {
      shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.75 : 0.14,
      shadowRadius: isDark ? 56 : 32,
      shadowOffset: {
        width: 0,
        height: isDark ? -16 : -6,
      },
      elevation: isDark ? 24 : 10,
    },
  };
}

let activeColors: AppColors = darkModeColors;
let activeShadows = buildShadows(darkModeColors);

function setResolvedTheme(colors: AppColors) {
  activeColors = colors;
  activeShadows = buildShadows(colors);
}

function getUiStyleValue(key: string) {
  switch (key) {
    case 'borderless':
      return {
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'badge':
      return {
        backgroundColor: activeColors.accentSurface,
      };
    case 'badgeText':
      return {
        color:
          activeColors.statusBar === 'light-content'
            ? activeColors.accent
            : activeColors.accentMuted,
      };
    case 'mutedSurface':
      return {
        backgroundColor: activeColors.surfaceMuted,
        borderWidth: 0,
        borderColor: 'transparent',
      };
    case 'accentSurface':
      return {
        backgroundColor: activeColors.accentSurface,
      };
    case 'divider':
      return {
        backgroundColor: activeColors.divider,
      };
    case 'inputBase': {
      const isInputDark = activeColors.statusBar === 'light-content';
      return {
        backgroundColor: activeColors.input,
        color: activeColors.text,
        minHeight: CONTROL_SIZES.input,
        paddingTop: 0,
        paddingBottom: 0,
        textAlignVertical: 'center' as const,
        borderWidth: isInputDark ? 0 : 1,
        borderColor: isInputDark ? 'transparent' : activeColors.divider,
      };
    }
    case 'searchContainer': {
      const isSearchDark = activeColors.statusBar === 'light-content';
      return {
        backgroundColor: activeColors.input,
        minHeight: CONTROL_SIZES.search,
        borderWidth: isSearchDark ? 0 : 1,
        borderColor: isSearchDark ? 'transparent' : activeColors.divider,
      };
    }
    case 'textArea': {
      const isTextAreaDark = activeColors.statusBar === 'light-content';
      return {
        backgroundColor: activeColors.input,
        color: activeColors.text,
        minHeight: CONTROL_SIZES.textAreaMin,
        borderWidth: isTextAreaDark ? 0 : 1,
        borderColor: isTextAreaDark ? 'transparent' : activeColors.divider,
      };
    }
    case 'inputError':
      return {
        backgroundColor: activeColors.dangerSurface,
      };
    case 'modalSheet':
      return {
        backgroundColor: activeColors.surface,
        ...activeShadows.modalSheet,
      };
    case 'modalSheetStrong':
      return {
        backgroundColor: activeColors.surface,
        ...activeShadows.modalSheetStrong,
      };
    case 'modalSheetCompact':
      return {
        backgroundColor: activeColors.surface,
        maxHeight: '88%' as const,
        ...activeShadows.modalSheetStrong,
      };
    case 'modalHandle':
      return {
        backgroundColor: activeColors.divider,
      };
    case 'titleText':
      return {
        color: activeColors.text,
      };
    case 'bodyText':
      return {
        color: activeColors.muted,
      };
    case 'errorText':
      return {
        color:
          activeColors.statusBar === 'light-content'
            ? FEEDBACK_COLORS.errorText
            : FEEDBACK_COLORS.errorTextLight,
      };
    default:
      return {};
  }
}

function getSurfaceStyleValue(key: string) {
  const isDark = activeColors.statusBar === 'light-content';
  switch (key) {
    case 'card':
      // dark: color contrast alone is sufficient; light: barely-there shadow separates white from near-white
      return isDark
        ? { backgroundColor: activeColors.surface }
        : { backgroundColor: activeColors.surface, ...activeShadows.soft };
    case 'softCard':
      // surfaceAlt is visually distinct from background in both modes — no decoration needed
      return { backgroundColor: activeColors.surfaceAlt };
    case 'input':
      // dark: input (#1C1C23) is visibly darker than surface (#141418) — no border
      // light: input (#FFF) sits on surface (#FFF) — needs a thin border
      return isDark
        ? { backgroundColor: activeColors.input }
        : { backgroundColor: activeColors.input, borderWidth: 1, borderColor: activeColors.divider };
    default:
      return {};
  }
}

export const SMART_PDF_DARK = new Proxy({} as AppColors, {
  get: (_target, prop) => activeColors[prop as keyof AppColors],
});

export const SHADOWS = new Proxy({} as ReturnType<typeof buildShadows>, {
  get: (_target, prop) => activeShadows[prop as keyof typeof activeShadows],
});

export const uiStyles = new Proxy({} as Record<string, object>, {
  get: (_target, prop) => getUiStyleValue(String(prop)),
});

export const surfaceStyles = new Proxy({} as Record<string, object>, {
  get: (_target, prop) => getSurfaceStyleValue(String(prop)),
});

interface AppThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  preference: AppThemePreference;
  setPreference: (preference: AppThemePreference) => Promise<void>;
  statusBarStyle: StatusBarStyle;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [preference, setPreferenceState] = useState<AppThemePreference>('light');

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)
      .then(value => {
        if (!isMounted) {
          return;
        }

        if (value === 'light' || value === 'dark') {
          setPreferenceState(value);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setPreference = useCallback(async (nextPreference: AppThemePreference) => {
    setPreferenceState(nextPreference);
    await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextPreference);
  }, []);

  const isDark = preference === 'dark';
  const colors = isDark ? darkModeColors : lightModeColors;
  setResolvedTheme(colors);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colors,
      isDark,
      preference,
      setPreference,
      statusBarStyle: colors.statusBar,
    }),
    [colors, isDark, preference, setPreference],
  );

  return React.createElement(AppThemeContext.Provider, { value }, children);
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
