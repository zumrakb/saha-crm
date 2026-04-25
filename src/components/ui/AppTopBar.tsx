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

const toneMap = {
  emerald: '#E4F4EC',
  sage: '#EAF5EF',
  neutral: '#EBF0EB',
} as const;

const textToneMap = {
  emerald: '#4F8D78',
  sage: '#5F8B77',
  neutral: '#5D6762',
} as const;

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  label,
  image,
  tone = 'emerald',
  size = 42,
}) => {
  if (image === 'profile') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: toneMap[tone],
        }}
      >
        <Text
          style={{
            color: textToneMap[tone],
            fontSize: Math.max(13, size * 0.34),
            fontWeight: '700',
          }}
        >
          SC
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: toneMap[tone],
      }}
    >
      <Text
        style={{
          color: textToneMap[tone],
          fontSize: Math.max(14, size * 0.38),
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export const BrandWordmark: React.FC<{ label?: string }> = ({ label = 'Saha CRM' }) => (
  <Text
    style={{
      color: SMART_PDF_DARK.accent,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1.1,
    }}
  >
    {label}
  </Text>
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
        size={22}
        color={SMART_PDF_DARK.accent}
      />
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
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
