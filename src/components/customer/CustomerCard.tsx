import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  lastActivity,
  onPress,
}) => {
  const { t } = useTranslation();
  const lastActionLabel = lastActivity
    ? `${t('customerCard.lastActionLabel')}: ${lastActivity.type}`
    : t('customerCard.noActivity');
  const lastActionNote = lastActivity?.note?.trim() ?? '';
  const lastActionDate = lastActivity ? formatDate(lastActivity.date) : '';
  const displayTitle = customer.companyName || customer.customerName;
  const displaySubtitle = customer.companyName ? customer.customerName : customer.phone;
  const initials = getInitials(displayTitle);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      className="rounded-[24px] px-4 py-4"
      style={surfaceStyles.card}
    >
      <View className="flex-col gap-3">
        <View className="flex-row items-start gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: SMART_PDF_DARK.accentSurface }}
          >
            <Text
              className="text-[14px] font-semibold tracking-[-0.2px]"
              style={{ color: SMART_PDF_DARK.accent }}
            >
              {initials || 'C'}
            </Text>
          </View>

          <View className="min-w-0 flex-1">
            <Text
              className="text-[15px] font-semibold leading-5 tracking-[-0.3px]"
              style={{ color: SMART_PDF_DARK.text }}
              numberOfLines={2}
            >
              {displayTitle}
            </Text>
            {displaySubtitle ? (
              <Text
                className="mt-0.5 text-[12px] leading-5"
                style={{ color: SMART_PDF_DARK.muted }}
                numberOfLines={1}
              >
                {displaySubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {customer.phone ? (
            <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: SMART_PDF_DARK.surfaceAlt }}>
              <Ionicons name="call-outline" size={13} color={SMART_PDF_DARK.muted} />
              <Text className="text-[11px]" style={{ color: SMART_PDF_DARK.muted }} numberOfLines={1}>
                {customer.phone}
              </Text>
            </View>
          ) : null}
          {customer.email ? (
            <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5" style={{ backgroundColor: SMART_PDF_DARK.surfaceAlt }}>
              <Ionicons name="mail-outline" size={13} color={SMART_PDF_DARK.muted} />
              <Text className="max-w-[180px] text-[11px]" style={{ color: SMART_PDF_DARK.muted }} numberOfLines={1}>
                {customer.email}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between gap-4">
          <View className="min-w-0 flex-1 gap-0.5">
            <Text
              className="text-[12px] leading-5"
              style={{ color: SMART_PDF_DARK.muted }}
              numberOfLines={1}
            >
              {lastActionLabel}
            </Text>
            {lastActionNote ? (
              <Text
                className="text-[12px] leading-5"
                style={{ color: SMART_PDF_DARK.text }}
                numberOfLines={1}
              >
                {lastActionNote}
              </Text>
            ) : null}
          </View>

          {lastActionDate ? (
            <Text
              className="text-[11px] leading-5"
              style={{ color: SMART_PDF_DARK.muted }}
              numberOfLines={1}
            >
              {lastActionDate}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CustomerCard;
