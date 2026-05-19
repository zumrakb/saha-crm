import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SMART_PDF_DARK } from './theme';

interface EmptyStateProps {
  title: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <View className="items-center py-6">
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: SMART_PDF_DARK.accentSurface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Ionicons name="document-text-outline" size={24} color={SMART_PDF_DARK.accent} />
      </View>
      <Text
        className="text-[15px] font-semibold"
        style={{ color: SMART_PDF_DARK.text }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          className="mt-1.5 text-center text-[13px] leading-[20px]"
          style={{ color: SMART_PDF_DARK.muted, maxWidth: 260 }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
};

export default EmptyState;
