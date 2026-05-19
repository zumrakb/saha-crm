import React from 'react';
import { Text, View } from 'react-native';
import { SMART_PDF_DARK } from './theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  badge?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  leading,
  trailing,
  badge,
}) => {
  return (
    <View className="flex-col gap-3">
      {leading ? <View className="self-start">{leading}</View> : null}

      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 flex-col gap-1.5">
          <View className="flex-row flex-wrap items-center gap-3">
            <Text
              className="flex-shrink text-[28px] font-bold tracking-[-1px]"
              style={{ color: SMART_PDF_DARK.text }}
            >
              {title}
            </Text>
            {badge}
          </View>

          {subtitle ? (
            <Text
              className="text-[14px] leading-[22px]"
              style={{ color: SMART_PDF_DARK.muted }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {trailing ? <View className="self-start">{trailing}</View> : null}
      </View>
    </View>
  );
};

export default PageHeader;
