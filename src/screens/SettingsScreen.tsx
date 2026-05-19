import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FileSystem } from 'react-native-file-access';
import Share from 'react-native-share';
import AppButton from '../components/ui/AppButton';
import AppScreen from '../components/ui/AppScreen';
import AppTopBar, {
  AvatarCircle,
  BrandWordmark,
  SearchGlyph,
} from '../components/ui/AppTopBar';
import BottomSheetModal from '../components/ui/BottomSheetModal';
import InlineGlobalSearch from '../components/ui/InlineGlobalSearch';
import SurfaceCard from '../components/ui/SurfaceCard';
import {
  FLOATING_TAB_BAR,
  SMART_PDF_DARK,
  uiStyles,
  useAppTheme,
  type AppThemePreference,
} from '../components/ui/theme';
import {
  exportBackupExcelFile,
  exportBackupJsonFile,
  type BackupExportFile,
} from '../utils/backupUtils';
import { clearDemoData, seedDemoData } from '../utils/demoData';
import {
  getNotificationDebugSummary,
  requestNotificationPermission,
  showTestNotification,
  syncTermReminders,
  type NotificationDebugSummary,
} from '../services/termNotifications';

const APP_VERSION = '0.0.1';

type ExportKind = 'json' | 'excel' | null;

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { preference, setPreference } = useAppTheme();
  const [isDemoBusy, setIsDemoBusy] = useState(false);
  const [isJsonBusy, setIsJsonBusy] = useState(false);
  const [isExcelBusy, setIsExcelBusy] = useState(false);
  const [isNotificationBusy, setIsNotificationBusy] = useState(false);
  const [notificationSummary, setNotificationSummary] =
    useState<NotificationDebugSummary | null>(null);
  const [pendingExport, setPendingExport] = useState<ExportKind>(null);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentLanguage = (i18n.language || 'en').slice(0, 2);
  const languageButtons = [
    {
      code: 'en',
      label: t('languages.english'),
      icon: 'language-outline' as const,
    },
    {
      code: 'tr',
      label: t('languages.turkish'),
      icon: 'globe-outline' as const,
    },
  ];
  const themeButtons: Array<{
    code: AppThemePreference;
    label: string;
    iconName: React.ComponentProps<typeof Ionicons>['name'];
  }> = [
    {
      code: 'light',
      label: t('settingsDashboard.themeOptions.light'),
      iconName: 'sunny-outline',
    },
    {
      code: 'dark',
      label: t('settingsDashboard.themeOptions.dark'),
      iconName: 'moon-outline',
    },
  ];
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');

  const refreshNotificationSummary = useCallback(async () => {
    try {
      const summary = await getNotificationDebugSummary();
      setNotificationSummary(summary);
    } catch {
      setNotificationSummary(null);
    }
  }, []);

  const handleNotificationPermission = useCallback(async () => {
    setIsNotificationBusy(true);

    try {
      const permission = await requestNotificationPermission();
      await refreshNotificationSummary();

      Alert.alert(
        t('settingsDashboard.notifications.permissionResultTitle'),
        t(`settingsDashboard.notifications.permissionStates.${permission}`),
      );
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.notifications.errorTitle'),
        error instanceof Error
          ? error.message
          : t('settingsDashboard.notifications.errorBody'),
      );
    } finally {
      setIsNotificationBusy(false);
    }
  }, [refreshNotificationSummary, t]);

  const handleTestNotification = useCallback(async () => {
    setIsNotificationBusy(true);

    try {
      await showTestNotification();
      await refreshNotificationSummary();

      Alert.alert(
        t('settingsDashboard.notifications.testSuccessTitle'),
        t('settingsDashboard.notifications.testSuccessBody'),
      );
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.notifications.errorTitle'),
        error instanceof Error
          ? error.message
          : t('settingsDashboard.notifications.errorBody'),
      );
    } finally {
      setIsNotificationBusy(false);
    }
  }, [refreshNotificationSummary, t]);

  const handleReminderSync = useCallback(async () => {
    setIsNotificationBusy(true);

    try {
      await syncTermReminders();
      await refreshNotificationSummary();

      Alert.alert(
        t('settingsDashboard.notifications.syncSuccessTitle'),
        t('settingsDashboard.notifications.syncSuccessBody'),
      );
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.notifications.errorTitle'),
        error instanceof Error
          ? error.message
          : t('settingsDashboard.notifications.errorBody'),
      );
    } finally {
      setIsNotificationBusy(false);
    }
  }, [refreshNotificationSummary, t]);

  useEffect(() => {
    refreshNotificationSummary().catch(() => undefined);
  }, [refreshNotificationSummary]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSearchVisible(false);
        setSearchQuery('');
      };
    }, []),
  );

  const deliverFile = useCallback(
    async (file: BackupExportFile) => {
      if (Platform.OS === 'android') {
        await FileSystem.cpExternal(file.path, file.filename, 'downloads');
        Alert.alert(
          t('settingsDashboard.downloadSuccessTitle'),
          t('settingsDashboard.downloadSuccessBody', {
            filename: file.filename,
          }),
        );
        return;
      }

      await Share.open({
        url: `file://${file.path}`,
        type: file.mimeType,
        filename: file.filename,
        failOnCancel: false,
        saveToFiles: true,
        title: file.filename,
      });
    },
    [t],
  );

  const handleJsonDownload = useCallback(async () => {
    setIsJsonBusy(true);

    try {
      const jsonFile = await exportBackupJsonFile();
      await deliverFile(jsonFile);
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.exportErrorTitle'),
        error instanceof Error
          ? error.message
          : t('settingsDashboard.exportErrorBody'),
      );
    } finally {
      setIsJsonBusy(false);
      setPendingExport(null);
    }
  }, [deliverFile, t]);

  const handleExcelExport = useCallback(async () => {
    setIsExcelBusy(true);

    try {
      const excelFile = await exportBackupExcelFile();
      await deliverFile(excelFile);
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.exportExcelErrorTitle'),
        error instanceof Error
          ? error.message
          : t('settingsDashboard.exportExcelErrorBody'),
      );
    } finally {
      setIsExcelBusy(false);
      setPendingExport(null);
    }
  }, [deliverFile, t]);

  const handleConfirmExport = useCallback(() => {
    if (pendingExport === 'json') {
      handleJsonDownload().catch(() => undefined);
      return;
    }

    if (pendingExport === 'excel') {
      handleExcelExport().catch(() => undefined);
    }
  }, [handleExcelExport, handleJsonDownload, pendingExport]);

  const handleSeedDemo = useCallback(() => {
    setIsDemoBusy(true);
    try {
      const result = seedDemoData();
      if (result.alreadyExists) {
        Alert.alert(
          'Demo Veri',
          'Demo veriler zaten yüklü. Önce kaldırıp tekrar ekleyebilirsin.',
        );
      } else {
        Alert.alert(
          'Demo Veri Eklendi',
          `${result.customerCount} müşteri ve ${result.termCount} vade eklendi.`,
        );
      }
    } finally {
      setIsDemoBusy(false);
    }
  }, []);

  const handleClearDemo = useCallback(() => {
    Alert.alert(
      'Demo Verileri Kaldır',
      'Demo olarak eklenen tüm müşteriler ve vadeler silinecek. Kendi eklediğin veriler etkilenmez.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            setIsDemoBusy(true);
            try {
              const count = clearDemoData();
              Alert.alert(
                'Demo Veri Kaldırıldı',
                count > 0
                  ? `${count} demo müşteri ve tüm vadeleri silindi.`
                  : 'Silinecek demo veri bulunamadı.',
              );
            } finally {
              setIsDemoBusy(false);
            }
          },
        },
      ],
    );
  }, []);

  const showThemeSection =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.themeTitle'),
      ...themeButtons.map(button => button.label),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .includes(normalizedSearchQuery);

  const showLanguageSection =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.languageTitle'),
      ...languageButtons.map(button => button.label),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .includes(normalizedSearchQuery);

  const showNotificationSection =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.notifications.title'),
      t('settingsDashboard.notifications.permissionAction'),
      t('settingsDashboard.notifications.syncAction'),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .includes(normalizedSearchQuery);

  const showDataSection =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.dataTitle'),
      t('settingsDashboard.shortJsonAction'),
      t('settingsDashboard.shortExcelAction'),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .includes(normalizedSearchQuery);

  const showAboutAction =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.versionAction'),
      t('settingsDashboard.versionInfoTitle'),
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
      .includes(normalizedSearchQuery);
  const hasSearchResults =
    showThemeSection ||
    showLanguageSection ||
    showNotificationSection ||
    showDataSection ||
    showAboutAction;

  return (
    <AppScreen>
      <BottomSheetModal
        visible={pendingExport !== null}
        onClose={() => setPendingExport(null)}
      >
        <View className="flex-col gap-4">
          <Text
            className="text-[22px] font-semibold tracking-[-0.4px]"
            style={uiStyles.titleText}
          >
            {pendingExport === 'json'
              ? t('settingsDashboard.confirmJsonBody')
              : t('settingsDashboard.confirmExcelBody')}
          </Text>

          <View className="flex-row gap-3">
            <AppButton
              label={t('common.cancel')}
              onPress={() => setPendingExport(null)}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <AppButton
              label={t('settingsDashboard.confirmExportAction')}
              onPress={handleConfirmExport}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={isAboutVisible}
        onClose={() => setIsAboutVisible(false)}
      >
        <View className="flex-col gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 gap-1">
              <Text
                className="text-[20px] font-semibold tracking-[-0.3px]"
                style={uiStyles.titleText}
              >
                {t('settingsDashboard.versionInfoTitle')}
              </Text>
              <Text className="text-sm" style={uiStyles.bodyText}>
                {t('settingsDashboard.versionLabel', { version: APP_VERSION })}
              </Text>
            </View>

            <AppButton
              label={t('common.cancel')}
              onPress={() => setIsAboutVisible(false)}
              variant="pill"
              compact
              iconOnly
              iconName="close"
            />
          </View>
          <Text className="text-[14px] leading-6" style={uiStyles.bodyText}>
            {t('settingsDashboard.aboutPrivacyLineOne')}
          </Text>
          <Text className="text-[14px] leading-6" style={uiStyles.bodyText}>
            {t('settingsDashboard.aboutPrivacyLineTwo')}
          </Text>
          <Text className="text-[14px] leading-6" style={uiStyles.bodyText}>
            {t('settingsDashboard.aboutPrivacyLineThree')}
          </Text>
        </View>
      </BottomSheetModal>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: FLOATING_TAB_BAR.contentPaddingBottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-6 pt-6">
          <View className="flex-col gap-6">
            <View style={{ minHeight: 40, position: 'relative' }}>
              <AppTopBar
                left={
                  <>
                    <AvatarCircle image="profile" size={34} />
                    <BrandWordmark label={t('settingsDashboard.title')} />
                  </>
                }
                right={
                  <SearchGlyph
                    onPress={() => setIsSearchVisible(current => !current)}
                  />
                }
              />

              <InlineGlobalSearch
                visible={isSearchVisible}
                query={searchQuery}
                onChangeText={setSearchQuery}
                onClose={() => setIsSearchVisible(false)}
                placeholder={t('common.pageSearchPlaceholder')}
                showNoResults={
                  Boolean(normalizedSearchQuery) && !hasSearchResults
                }
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  zIndex: 20,
                }}
              />
            </View>

            {showThemeSection ? (
              <SurfaceCard>
                <View className="flex-col gap-4">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="color-palette-outline"
                      size={22}
                      color={SMART_PDF_DARK.accent}
                    />
                    <Text
                      className="text-[18px] font-semibold tracking-[-0.4px]"
                      style={uiStyles.titleText}
                    >
                      {t('settingsDashboard.themeTitle')}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    {themeButtons.map(button => {
                      const isActive = preference === button.code;

                      return (
                        <AppButton
                          key={button.code}
                          label={button.label}
                          onPress={() =>
                            setPreference(button.code).catch(() => undefined)
                          }
                          variant={isActive ? 'soft' : 'secondary'}
                          style={{
                            flex: 1,
                          }}
                          iconName={button.iconName}
                        />
                      );
                    })}
                  </View>
                </View>
              </SurfaceCard>
            ) : null}

            {showLanguageSection ? (
              <SurfaceCard>
                <View className="flex-col gap-4">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="language-outline"
                      size={22}
                      color={SMART_PDF_DARK.secondaryText}
                    />
                    <Text
                      className="text-[18px] font-semibold tracking-[-0.4px]"
                      style={uiStyles.titleText}
                    >
                      {t('settingsDashboard.languageTitle')}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    {languageButtons.map(button => {
                      const isActive = currentLanguage === button.code;

                      return (
                        <AppButton
                          key={button.code}
                          label={button.label}
                          onPress={() =>
                            i18n
                              .changeLanguage(button.code)
                              .catch(() => undefined)
                          }
                          variant={isActive ? 'soft' : 'secondary'}
                          iconName={button.icon}
                          style={{ flex: 1 }}
                        />
                      );
                    })}
                  </View>
                </View>
              </SurfaceCard>
            ) : null}

            {showNotificationSection ? (
              <SurfaceCard>
                <View className="flex-col gap-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name="notifications-outline"
                        size={22}
                        color={SMART_PDF_DARK.accent}
                      />
                      <Text
                        className="text-[18px] font-semibold tracking-[-0.4px]"
                        style={uiStyles.titleText}
                      >
                        {t('settingsDashboard.notifications.title')}
                      </Text>
                    </View>

                    <AppButton
                      label={t(
                        'settingsDashboard.notifications.testInlineAction',
                      )}
                      onPress={() =>
                        handleTestNotification().catch(() => undefined)
                      }
                      variant="pill"
                      compact
                    />
                  </View>

                  {notificationSummary ? (
                    <Text
                      className="text-[13px] leading-5"
                      style={uiStyles.bodyText}
                    >
                      {t('settingsDashboard.notifications.summary', {
                        permission: t(
                          `settingsDashboard.notifications.permissionStates.${notificationSummary.permission}`,
                        ),
                        count: notificationSummary.scheduledCount,
                      })}
                    </Text>
                  ) : null}

                  <View className="flex-row gap-2">
                    <AppButton
                      label={t(
                        'settingsDashboard.notifications.permissionAction',
                      )}
                      onPress={() =>
                        handleNotificationPermission().catch(() => undefined)
                      }
                      disabled={isNotificationBusy}
                      variant="primary"
                      iconName="notifications-outline"
                      style={{ flex: 1 }}
                    />

                    <AppButton
                      label={t('settingsDashboard.notifications.syncAction')}
                      onPress={() =>
                        handleReminderSync().catch(() => undefined)
                      }
                      disabled={isNotificationBusy}
                      variant="secondary"
                      iconName="refresh-outline"
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </SurfaceCard>
            ) : null}

            {showDataSection ? (
              <SurfaceCard>
                <View className="flex-col gap-6">
                  <View className="flex-col gap-4">
                    <Text
                      className="text-[18px] font-semibold tracking-[-0.4px]"
                      style={uiStyles.titleText}
                    >
                      {t('settingsDashboard.dataTitle')}
                    </Text>

                    <View className="flex-row gap-2">
                      <AppButton
                        label={t('settingsDashboard.shortJsonAction')}
                        onPress={() => setPendingExport('json')}
                        disabled={isJsonBusy}
                        variant="secondary"
                        iconName="download-outline"
                        style={{ flex: 1 }}
                      />

                      <AppButton
                        label={t('settingsDashboard.shortExcelAction')}
                        onPress={() => setPendingExport('excel')}
                        disabled={isExcelBusy}
                        variant="soft"
                        iconName="download-outline"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>

                  <View className="flex-col gap-4">
                    <Text
                      className="text-[18px] font-semibold tracking-[-0.4px]"
                      style={uiStyles.titleText}
                    >
                      Demo verileri
                    </Text>

                    <View className="flex-row gap-2">
                      <AppButton
                        label="Demo verileri ekle"
                        onPress={() => handleSeedDemo()}
                        disabled={isDemoBusy}
                        variant="primary"
                        iconName="add-circle-outline"
                        style={{ flex: 1 }}
                      />

                      <AppButton
                        label="Demo verileri kaldır"
                        onPress={() => handleClearDemo()}
                        disabled={isDemoBusy}
                        variant="secondary"
                        iconName="trash-outline"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            ) : null}

            {showAboutAction ? (
              <AppButton
                label={t('settingsDashboard.versionAction')}
                onPress={() => setIsAboutVisible(true)}
                variant="pill"
                iconName="information-circle-outline"
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
};

export default SettingsScreen;
