import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Calendar, LocaleConfig, type DateData } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TermItem from '../components/term/TermItem';
import AppButton from '../components/ui/AppButton';
import BottomSheetModal from '../components/ui/BottomSheetModal';
import AppScreen from '../components/ui/AppScreen';
import AppTopBar, {
  AvatarCircle,
  BrandWordmark,
  SearchGlyph,
} from '../components/ui/AppTopBar';
import EmptyState from '../components/ui/EmptyState';
import InlineGlobalSearch from '../components/ui/InlineGlobalSearch';
import NewActivityModal from '../modals/NewActivityModal';
import NewTermModal from '../modals/NewTermModal';
import {
  FLOATING_TAB_BAR,
  SMART_PDF_DARK,
  surfaceStyles,
  uiStyles,
  useAppTheme,
} from '../components/ui/theme';
import { isPendingTermStatus } from '../constants/termStatus';
import { getActivityDatesInRange } from '../repositories/activity.repository';
import { useActivityStore } from '../store/activity.store';
import { useCustomerStore } from '../store/customer.store';
import { useTermStore } from '../store/term.store';
import { formatDate, formatISODate, parseISODate, todayISO } from '../utils/dateUtils';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatMonthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

function formatMonthDate(year: number, month: number): string {
  return `${formatMonthKey(year, month)}-01`;
}

function getMonthDayKeys(monthKey: string): string[] {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = parseISODate(formatMonthDate(year, month));
  const monthEnd = new Date(year, month, 0, 12, 0, 0, 0);
  const days: string[] = [];
  const cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    days.push(formatISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getDelayUntilNextDay(): number {
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);

  return Math.max(nextDay.getTime() - now.getTime(), 1000);
}

LocaleConfig.locales.tr = {
  monthNames: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};

LocaleConfig.locales.en = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today',
};

const HomeScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const customers = useCustomerStore(state => state.customers);
  const loadCustomers = useCustomerStore(state => state.load);
  const terms = useTermStore(state => state.terms);
  const loadTerms = useTermStore(state => state.load);
  const isActivitiesLoading = useActivityStore(state => state.isLoading);
  const activeActivityDate = useActivityStore(state => state.activeDate);
  const loadActivitiesByDate = useActivityStore(state => state.loadByDate);

  const [today, setToday] = useState(() => todayISO());
  const locale = (i18n.language || 'en').startsWith('tr') ? 'tr-TR' : 'en-US';
  const calendarLocale = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(() => today.slice(0, 7));
  const [monthActivityDatesByMonth, setMonthActivityDatesByMonth] = useState<Record<string, string[]>>({});
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAgendaVisible, setIsAgendaVisible] = useState(false);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [isTermModalVisible, setIsTermModalVisible] = useState(false);
  const previousTodayRef = useRef(today);
  const isAgendaLoading = isActivitiesLoading || activeActivityDate !== selectedDate;

  const loadDashboardLists = useCallback(() => {
    loadCustomers();
    loadTerms();
  }, [loadCustomers, loadTerms]);

  const refreshMonthActivityDates = useCallback((monthKey: string) => {
    if (Object.prototype.hasOwnProperty.call(monthActivityDatesByMonth, monthKey)) {
      return;
    }

    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = parseISODate(formatMonthDate(year, month));
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 12, 0, 0, 0);
    const nextDates = getActivityDatesInRange(
      formatISODate(monthStart),
      formatISODate(monthEnd),
    );

    setMonthActivityDatesByMonth(current => ({
      ...current,
      [monthKey]: nextDates,
    }));
  }, [monthActivityDatesByMonth]);

  const handleVisibleMonthChange = useCallback((monthData: DateData) => {
    const nextVisibleMonth = formatMonthKey(monthData.year, monthData.month);

    setVisibleMonth(currentMonth => (
      currentMonth === nextVisibleMonth ? currentMonth : nextVisibleMonth
    ));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardLists();
      loadActivitiesByDate(selectedDate);
      refreshMonthActivityDates(visibleMonth);

      return () => {
        setIsSearchVisible(false);
        setSearchQuery('');
      };
    }, [loadActivitiesByDate, loadDashboardLists, refreshMonthActivityDates, selectedDate, visibleMonth]),
  );

  useEffect(() => {
    const timerId = setTimeout(() => {
      setToday(todayISO());
    }, getDelayUntilNextDay());

    return () => clearTimeout(timerId);
  }, [today]);

  useEffect(() => {
    loadDashboardLists();
  }, [loadDashboardLists]);

  useEffect(() => {
    loadActivitiesByDate(selectedDate);
  }, [loadActivitiesByDate, selectedDate]);

  useEffect(() => {
    refreshMonthActivityDates(visibleMonth);
  }, [refreshMonthActivityDates, visibleMonth]);

  useEffect(() => {
    const previousToday = previousTodayRef.current;

    if (selectedDate === previousToday && today !== previousToday) {
      setSelectedDate(today);
      setVisibleMonth(today.slice(0, 7));
    }

    previousTodayRef.current = today;
  }, [selectedDate, today]);

  useEffect(() => {
    LocaleConfig.defaultLocale = calendarLocale;
  }, [calendarLocale]);

  const customerMap = useMemo(
    () => new Map(customers.map(customer => [customer.id, customer])),
    [customers],
  );
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');

  const pendingTerms = useMemo(
    () =>
      [...terms]
        .filter(term => isPendingTermStatus(term.status))
        .sort((left, right) => left.expectedDate.localeCompare(right.expectedDate)),
    [terms],
  );

  const upcomingTerms = useMemo(
    () =>
      pendingTerms
        .filter(term => {
          if (!normalizedSearchQuery) {
            return true;
          }

          const customer = customerMap.get(term.customerId);
          return [
            term.productName,
            term.termDuration,
            customer?.companyName ?? '',
          ]
            .join(' ')
            .toLocaleLowerCase('tr-TR')
            .includes(normalizedSearchQuery);
        })
        .slice(0, 2),
    [customerMap, normalizedSearchQuery, pendingTerms],
  );
  const showSearchNoResults = Boolean(normalizedSearchQuery) && upcomingTerms.length === 0;

  const markedDates = useMemo(() => {
    const monthDates = monthActivityDatesByMonth[visibleMonth] ?? [];
    const isMonthLoaded = Object.prototype.hasOwnProperty.call(monthActivityDatesByMonth, visibleMonth);
    const nextMarkedDates = (isMonthLoaded ? getMonthDayKeys(visibleMonth) : []).reduce<Record<string, {
      marked?: boolean;
      dotColor?: string;
      selected?: boolean;
      selectedColor?: string;
      selectedTextColor?: string;
    }>>((result, date) => {
      result[date] = {};
      return result;
    }, {});

    monthDates.forEach(date => {
      nextMarkedDates[date] = {
        ...nextMarkedDates[date],
        marked: true,
        dotColor: colors.accent,
      };
    });

    if (selectedDate in nextMarkedDates) {
      nextMarkedDates[selectedDate] = {
        ...nextMarkedDates[selectedDate],
        selected: true,
        selectedColor: colors.accent,
        selectedTextColor: '#FFFFFF',
      };
    }

    return nextMarkedDates;
  }, [colors.accent, monthActivityDatesByMonth, selectedDate, visibleMonth]);

  const openAgenda = useCallback((date: string) => {
    setSelectedDate(date);
    loadActivitiesByDate(date);
    setIsAgendaVisible(true);
  }, [loadActivitiesByDate]);

  return (
    <AppScreen>
      <NewActivityModal
        visible={isActivityModalVisible}
        initialDate={selectedDate}
        onClose={() => setIsActivityModalVisible(false)}
      />
      <NewTermModal
        visible={isTermModalVisible}
        initialDate={selectedDate}
        onClose={() => setIsTermModalVisible(false)}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR.contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-6 pt-6">
          <View className="flex-col gap-8">
            <View style={{ minHeight: 40, position: 'relative' }}>
              <AppTopBar
                left={(
                  <>
                    <AvatarCircle image="profile" size={34} />
                    <BrandWordmark />
                  </>
                )}
                right={<SearchGlyph onPress={() => setIsSearchVisible(current => !current)} />}
              />

              <InlineGlobalSearch
                visible={isSearchVisible}
                query={searchQuery}
                onChangeText={setSearchQuery}
                onClose={() => setIsSearchVisible(false)}
                placeholder={t('common.pageSearchPlaceholder')}
                showNoResults={showSearchNoResults}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20 }}
              />
            </View>

            <View style={[surfaceStyles.card, { borderRadius: 20, overflow: 'hidden', padding: 0 }]}>
              <Calendar
                key={`${calendarLocale}-${colors.statusBar}`}
                current={`${visibleMonth}-01`}
                markedDates={markedDates}
                markingType="dot"
                displayLoadingIndicator={!Object.prototype.hasOwnProperty.call(
                  monthActivityDatesByMonth,
                  visibleMonth,
                )}
                enableSwipeMonths
                firstDay={1}
                onDayPress={day => openAgenda(day.dateString)}
                onMonthChange={handleVisibleMonthChange}
                theme={{
                  calendarBackground: SMART_PDF_DARK.surface,
                  textSectionTitleColor: colors.muted,
                  monthTextColor: colors.text,
                  dayTextColor: colors.text,
                  todayTextColor: colors.accent,
                  selectedDayBackgroundColor: colors.accent,
                  selectedDayTextColor: '#FFFFFF',
                  textDisabledColor: SMART_PDF_DARK.muted,
                  arrowColor: colors.muted,
                  indicatorColor: colors.accent,
                  dotColor: colors.accent,
                  selectedDotColor: '#FFFFFF',
                  textMonthFontSize: 21,
                  textMonthFontWeight: '700',
                  textDayFontSize: 16,
                  textDayHeaderFontSize: 13,
                  textDayHeaderFontWeight: '500',
                }}
                style={{ borderWidth: 0, paddingLeft: 4, paddingRight: 4 }}
              />
            </View>

            <View className="flex-col gap-4">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 3,
                      height: 18,
                      borderRadius: 2,
                      backgroundColor: SMART_PDF_DARK.accent,
                    }}
                  />
                  <Text
                    className="text-[18px] font-semibold tracking-[-0.5px]"
                    style={uiStyles.titleText}
                  >
                    {t('homeDashboard.upcomingTermsTitle')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsTermModalVisible(true)}
                  activeOpacity={0.75}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: SMART_PDF_DARK.accentSurface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={18} color={SMART_PDF_DARK.accent} />
                </TouchableOpacity>
              </View>

              {upcomingTerms.length ? (
                <View className="flex-col gap-3">
                  {upcomingTerms.map(term => (
                    <TermItem
                      key={term.id}
                      term={term}
                      companyName={customerMap.get(term.customerId)?.companyName}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title={
                    showSearchNoResults
                      ? t('common.searchNoResults')
                      : t('homeDashboard.upcomingTermsTitle')
                  }
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomSheetModal
        visible={isAgendaVisible}
        onClose={() => setIsAgendaVisible(false)}
      >
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 gap-1">
              <Text
                className="text-[22px] font-semibold tracking-[-0.4px]"
                style={uiStyles.titleText}
              >
                {t('homeDashboard.dayAgendaTitle')}
              </Text>
              <Text className="text-sm" style={uiStyles.bodyText}>
                {formatDate(selectedDate, locale)}
              </Text>
            </View>

            <AppButton
              label={t('common.cancel')}
              onPress={() => setIsAgendaVisible(false)}
              variant="pill"
              compact
              iconOnly
              iconName="close"
            />
          </View>

          <View className="flex-row gap-3">
            <AppButton
              label={t('homeDashboard.addActivity')}
              onPress={() => {
                setIsAgendaVisible(false);
                setIsActivityModalVisible(true);
              }}
              variant="primary"
              iconName="add"
              style={{ flex: 1 }}
            />
            <AppButton
              label={t('homeDashboard.actions.terms')}
              onPress={() => {
                setIsAgendaVisible(false);
                setIsTermModalVisible(true);
              }}
              variant="soft"
              iconName="calendar-outline"
              style={{ flex: 1 }}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {isAgendaLoading ? (
              <Text className="text-sm leading-6" style={uiStyles.bodyText}>
                {t('customerDetail.loadingActivities')}
              </Text>
            ) : useActivityStore.getState().activities.length ? (
              <View className="flex-col gap-3">
                {useActivityStore.getState().activities.map(activity => {
                  const customer = customerMap.get(activity.customerId);

                  return (
                    <TouchableOpacity
                      key={activity.id}
                      onPress={() => {
                        setIsAgendaVisible(false);
                        navigation.navigate('Customers', {
                          screen: 'CustomerDetail',
                          params: { customerId: activity.customerId },
                        } as never);
                      }}
                      activeOpacity={0.82}
                      style={{
                        borderRadius: 14,
                        backgroundColor: SMART_PDF_DARK.surfaceAlt,
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{ flexDirection: 'row' }}>
                        <View
                          style={{
                            width: 3,
                            backgroundColor: SMART_PDF_DARK.accent,
                          }}
                        />
                        <View style={{ flex: 1, padding: 13, gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                              <Text
                                style={{ fontSize: 14, fontWeight: '600', color: SMART_PDF_DARK.text }}
                                numberOfLines={1}
                              >
                                {customer?.customerName ?? t('homeDashboard.unknownCustomer')}
                              </Text>
                              {customer?.companyName ? (
                                <Text
                                  style={{ fontSize: 12, color: SMART_PDF_DARK.muted }}
                                  numberOfLines={1}
                                >
                                  {customer.companyName}
                                </Text>
                              ) : null}
                            </View>
                            <View
                              style={{
                                backgroundColor: SMART_PDF_DARK.accentSurface,
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                flexShrink: 0,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '600',
                                  color: SMART_PDF_DARK.accent,
                                }}
                              >
                                {activity.type}
                              </Text>
                            </View>
                          </View>
                          {activity.note?.trim() ? (
                            <Text
                              style={{ fontSize: 13, color: SMART_PDF_DARK.muted, lineHeight: 18 }}
                              numberOfLines={2}
                            >
                              {activity.note.trim()}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <EmptyState title={t('homeDashboard.emptyAgendaTitle')} />
            )}
          </ScrollView>
        </View>
      </BottomSheetModal>
    </AppScreen>
  );
};

export default HomeScreen;
