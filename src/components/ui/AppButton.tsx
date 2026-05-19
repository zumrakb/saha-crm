import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { GestureResponderEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CONTROL_SIZES, useAppTheme } from './theme';

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'pill';

interface AppButtonProps {
  label: string;
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  variant?: ButtonVariant;
  disabled?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  description?: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  iconColorOverride?: string;
}

const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  compact = false,
  iconOnly = false,
  iconName,
  description,
  fullWidth = false,
  style,
  textStyle,
  activeOpacity = 0.85,
  iconColorOverride,
}) => {
  const { colors } = useAppTheme();
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.surfaceAlt,
    },
    soft: {
      backgroundColor: colors.accentSurface,
    },
    pill: {
      backgroundColor: colors.surfaceAlt,
    },
  };

  const labelColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.text,
    soft: colors.accent,
    pill: colors.text,
  };

  const iconColors: Record<ButtonVariant, string> = {
    primary: '#FFFFFF',
    secondary: colors.muted,
    soft: colors.accent,
    pill: colors.accent,
  };

  const minHeight = compact ? CONTROL_SIZES.buttonCompact : CONTROL_SIZES.button;
  const radiusClassName = iconOnly
    ? 'rounded-full'
    : variant === 'pill'
      ? 'rounded-full px-5'
      : compact
        ? 'rounded-[12px] px-4'
        : 'rounded-[14px] px-5';
  const iconSize = compact ? 16 : 18;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityLabel={label}
      className={`items-center justify-center ${radiusClassName}`}
      style={[
        variantStyles[variant],
        {
          minHeight,
          width: iconOnly ? minHeight : fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <View className="items-center justify-center gap-1.5">
        <View className="flex-row items-center justify-center gap-2.5">
          {iconName ? (
            <Ionicons
              name={iconName}
              size={iconSize}
              color={iconColorOverride ?? iconColors[variant]}
            />
          ) : null}

          {iconOnly ? null : (
            <Text
              className="text-center text-[14px] font-semibold"
              style={[{ color: labelColors[variant] }, textStyle]}
            >
              {label}
            </Text>
          )}
        </View>

        {description && !iconOnly ? (
          <Text
            className="text-center text-sm leading-5"
            style={{ color: colors.muted }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default AppButton;
