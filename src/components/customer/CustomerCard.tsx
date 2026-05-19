import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Activity } from '../../constants/activity.types';
import type { Customer } from '../../constants/customer.types';
import { formatDate } from '../../utils/dateUtils';
import { SMART_PDF_DARK, surfaceStyles } from '../ui/theme';

interface CustomerCardProps {
  customer: Customer;
  lastActivity: Activity | null;
  onPress: () => void;
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

const DARK_PALETTES = [
  { bg: '#1E1B3A', fg: '#7C6EFA' },
  { bg: '#0F2D24', fg: '#22D3A0' },
  { bg: '#2D1419', fg: '#F05C6A' },
  { bg: '#2A1A0F', fg: '#FB923C' },
  { bg: '#1E1A2D', fg: '#9D93FB' },
] as const;

const LIGHT_PALETTES = [
  { bg: '#EEECFD', fg: '#5B4EE8' },
  { bg: '#E8F9F4', fg: '#0DB080' },
  { bg: '#FDEDEF', fg: '#D4253A' },
  { bg: '#FEF3E8', fg: '#EA7D24' },
  { bg: '#F4F2FE', fg: '#7B6FED' },
] as const;

function getAvatarPalette(title: string) {
  const isDark = SMART_PDF_DARK.statusBar === 'light-content';
  const idx = (title.charCodeAt(0) || 65) % 5;
  return (isDark ? DARK_PALETTES : LIGHT_PALETTES)[idx];
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  lastActivity,
  onPress,
}) => {
  const { t } = useTranslation();
  const displayTitle = customer.companyName || customer.customerName;
  const displaySubtitle = customer.companyName ? customer.customerName : customer.phone;
  const initials = getInitials(displayTitle);
  const palette = getAvatarPalette(displayTitle);
  const lastActionLabel = lastActivity ? lastActivity.type : t('customerCard.noActivity');
  const lastActionDate = lastActivity ? formatDate(lastActivity.date) : '';
  const hasActivity = Boolean(lastActivity);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[surfaceStyles.card, { borderRadius: 16, padding: 0, overflow: 'hidden' }]}
    >
      {/* Main row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            backgroundColor: palette.bg,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              color: palette.fg,
              fontSize: 15,
              fontWeight: '700',
              letterSpacing: -0.3,
            }}
          >
            {initials || 'C'}
          </Text>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              color: SMART_PDF_DARK.text,
              fontSize: 15,
              fontWeight: '600',
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {displayTitle}
          </Text>
          {displaySubtitle ? (
            <Text
              style={{ color: SMART_PDF_DARK.muted, fontSize: 13 }}
              numberOfLines={1}
            >
              {displaySubtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: SMART_PDF_DARK.divider,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: hasActivity ? SMART_PDF_DARK.accent : SMART_PDF_DARK.muted,
            }}
          />
          <Text
            style={{
              color: hasActivity ? SMART_PDF_DARK.accent : SMART_PDF_DARK.muted,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {lastActionLabel}
          </Text>
        </View>

        {lastActionDate ? (
          <Text style={{ color: SMART_PDF_DARK.muted, fontSize: 12 }}>
            {lastActionDate}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default CustomerCard;
