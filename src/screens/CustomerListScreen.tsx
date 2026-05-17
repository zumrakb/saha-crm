import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import CustomerCard from '../components/customer/CustomerCard';
import CustomerSearchBar from '../components/customer/CustomerSearchBar';
import AppButton from '../components/ui/AppButton';
import AppScreen from '../components/ui/AppScreen';
import AppTopBar, {
  AvatarCircle,
  BrandWordmark,
} from '../components/ui/AppTopBar';
import EmptyState from '../components/ui/EmptyState';
import SurfaceCard from '../components/ui/SurfaceCard';
import { FLOATING_TAB_BAR, SMART_PDF_DARK } from '../components/ui/theme';
import NewCustomerModal from '../modals/NewCustomerModal';
import { useActivityStore } from '../store/activity.store';
import { useCustomerStore } from '../store/customer.store';
import type { CustomerStackParamList } from '../types/navigation';

const CustomerListScreen: React.FC = () => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<StackNavigationProp<CustomerStackParamList>>();
  const customers = useCustomerStore(state => state.customers);
  const isLoading = useCustomerStore(state => state.isLoading);
  const error = useCustomerStore(state => state.error);
  const load = useCustomerStore(state => state.load);
  const getLastByCustomer = useActivityStore(state => state.getLastByCustomer);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const customerCards = useMemo(
    () =>
      customers.map(customer => ({
        customer,
        lastActivity: getLastByCustomer(customer.id),
      })),
    [customers, getLastByCustomer],
  );

  const filteredCustomerCards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');

    if (!normalizedQuery) {
      return customerCards;
    }

    return customerCards.filter(({ customer, lastActivity }) => {
      const searchableText = [
        customer.customerName,
        customer.companyName,
        customer.phone ?? '',
        customer.email ?? '',
        lastActivity?.type ?? '',
        lastActivity?.note ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      return searchableText.includes(normalizedQuery);
    });
  }, [customerCards, searchQuery]);

  const listHeader = (
    <View className="px-5 pb-5 pt-6">
      <View className="flex-col gap-5">
        <AppTopBar
          left={(
            <>
              <AvatarCircle image="profile" size={34} />
              <BrandWordmark label={t('common.customers')} />
            </>
          )}
          right={(
            <AppButton
              label={t('customersScreen.addButton')}
              onPress={() => setIsModalVisible(true)}
              variant="pill"
              compact
              iconName="add"
            />
          )}
        />

        <CustomerSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('customersScreen.searchPlaceholder')}
          onClear={() => setSearchQuery('')}
        />
      </View>
    </View>
  );

  return (
    <AppScreen>
      <NewCustomerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />

      <FlatList
        data={filteredCustomerCards}
        keyExtractor={item => item.customer.id.toString()}
        renderItem={({ item }) => (
          <View className="px-5">
            <CustomerCard
              customer={item.customer}
              lastActivity={item.lastActivity}
              onPress={() =>
                navigation.navigate('CustomerDetail', {
                  customerId: item.customer.id,
                })
              }
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR.contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={isLoading}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={
          <View className="px-5 pt-2">
            {isLoading ? (
              <SurfaceCard tone="soft">
                <View className="flex-col items-center gap-3 py-6">
                  <ActivityIndicator color={SMART_PDF_DARK.accent} />
                  <Text className="text-sm" style={{ color: SMART_PDF_DARK.muted }}>
                    {t('customersScreen.loading')}
                  </Text>
                </View>
              </SurfaceCard>
            ) : error ? (
              <SurfaceCard tone="soft">
                <Text className="text-sm leading-6" style={{ color: SMART_PDF_DARK.muted }}>
                  {error}
                </Text>
              </SurfaceCard>
            ) : (
              <EmptyState
                title={
                  searchQuery.trim()
                    ? t('common.searchNoResults')
                    : t('customersScreen.emptyTitle')
                }
              />
            )}
          </View>
        }
      />
    </AppScreen>
  );
};

export default CustomerListScreen;
