import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SMART_PDF_DARK } from './theme';

interface AvatarCircleProps {
  label?: string;
  image?: 'profile';
  tone?: 'emerald' | 'sage' | 'neutral';
  size?: number;
}

interface AppTopBarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  label,
  image,
  size = 36,
}) => {
  const bg = SMART_PDF_DARK.accentSurface;
  const fg = SMART_PDF_DARK.accent;
  const radius = Math.max(8, Math.round(size * 0.28));
  const text = image === 'profile' ? 'SC' : (label ?? '');

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: Math.max(11, Math.round(size * 0.33)),
          fontWeight: '700',
          letterSpacing: 0.2,
        }}
      >
        {text}
      </Text>
    </View>
  );
};

export const BrandWordmark: React.FC<{ label?: string }> = ({ label = 'Saha' }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
    <View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: SMART_PDF_DARK.accent,
      }}
    />
    <Text
      style={{
        color: SMART_PDF_DARK.text,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
      }}
    >
      {label}
    </Text>
  </View>
);

export const SearchGlyph: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const content = (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={SMART_PDF_DARK.muted}
      />
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      {content}
    </TouchableOpacity>
  );
};

const AppTopBar: React.FC<AppTopBarProps> = ({ left, center, right }) => {
  return (
    <View className="flex-row items-center justify-between">
      <View className="min-w-[72px] flex-row items-center gap-3">
        {left}
      </View>
      <View className="min-w-0 flex-1 items-center">
        {center}
      </View>
      <View className="min-w-[72px] flex-row items-center justify-end gap-3">
        {right}
      </View>
    </View>
  );
};

export default AppTopBar;
