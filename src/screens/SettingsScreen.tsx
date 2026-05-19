import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
import {
  FLOATING_TAB_BAR,
  SMART_PDF_DARK,
  surfaceStyles,
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

// ─── Local UI helpers ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.9,
        textTransform: 'uppercase',
        color: SMART_PDF_DARK.muted,
        paddingHorizontal: 4,
      }}
    >
      {children}
    </Text>
  );
}

function IconBox({
  name,
  bg,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  color: string;
}) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Ionicons name={name} size={16} color={color} />
    </View>
  );
}

function RowDivider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: SMART_PDF_DARK.divider,
        marginLeft: 56,
      }}
    />
  );
}

interface SettingRowProps {
  iconBox: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  dangerous?: boolean;
}

function SettingRow({
  iconBox,
  title,
  subtitle,
  right,
  onPress,
  disabled,
  dangerous,
}: SettingRowProps) {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        gap: 12,
        minHeight: 56,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {iconBox}
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '500',
            color: dangerous ? SMART_PDF_DARK.danger : SMART_PDF_DARK.text,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: SMART_PDF_DARK.muted, lineHeight: 17 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (
        onPress
          ? <Ionicons name="chevron-forward" size={15} color={SMART_PDF_DARK.muted} />
          : null
      )}
    </View>
  );

  if (!onPress) {
    return inner;
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.72}>
      {inner}
    </TouchableOpacity>
  );
}

function SettingGroup({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={[
        surfaceStyles.card as object,
        {
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          shadowOpacity: 0,
          elevation: 0,
        },
      ]}
    >
      {children}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

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
    { code: 'en', label: t('languages.english'), icon: 'language-outline' as const },
    { code: 'tr', label: t('languages.turkish'), icon: 'globe-outline' as const },
  ];

  const themeButtons: Array<{
    code: AppThemePreference;
    label: string;
    iconName: React.ComponentProps<typeof Ionicons>['name'];
  }> = [
    { code: 'light', label: t('settingsDashboard.themeOptions.light'), iconName: 'sunny-outline' },
    { code: 'dark', label: t('settingsDashboard.themeOptions.dark'), iconName: 'moon-outline' },
  ];

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const refreshNotificationSummary = useCallback(async () => {
    try {
      setNotificationSummary(await getNotificationDebugSummary());
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
        error instanceof Error ? error.message : t('settingsDashboard.notifications.errorBody'),
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
        error instanceof Error ? error.message : t('settingsDashboard.notifications.errorBody'),
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
        error instanceof Error ? error.message : t('settingsDashboard.notifications.errorBody'),
      );
    } finally {
      setIsNotificationBusy(false);
    }
  }, [refreshNotificationSummary, t]);

  const deliverFile = useCallback(async (file: BackupExportFile) => {
    if (Platform.OS === 'android') {
      await FileSystem.cpExternal(file.path, file.filename, 'downloads');
      Alert.alert(
        t('settingsDashboard.downloadSuccessTitle'),
        t('settingsDashboard.downloadSuccessBody', { filename: file.filename }),
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
  }, [t]);

  const handleJsonDownload = useCallback(async () => {
    setIsJsonBusy(true);
    try {
      await deliverFile(await exportBackupJsonFile());
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.exportErrorTitle'),
        error instanceof Error ? error.message : t('settingsDashboard.exportErrorBody'),
      );
    } finally {
      setIsJsonBusy(false);
      setPendingExport(null);
    }
  }, [deliverFile, t]);

  const handleExcelExport = useCallback(async () => {
    setIsExcelBusy(true);
    try {
      await deliverFile(await exportBackupExcelFile());
    } catch (error) {
      Alert.alert(
        t('settingsDashboard.exportExcelErrorTitle'),
        error instanceof Error ? error.message : t('settingsDashboard.exportExcelErrorBody'),
      );
    } finally {
      setIsExcelBusy(false);
      setPendingExport(null);
    }
  }, [deliverFile, t]);

  const handleConfirmExport = useCallback(() => {
    if (pendingExport === 'json') {
      handleJsonDownload().catch(() => undefined);
    } else if (pendingExport === 'excel') {
      handleExcelExport().catch(() => undefined);
    }
  }, [handleExcelExport, handleJsonDownload, pendingExport]);

  const handleSeedDemo = useCallback(() => {
    setIsDemoBusy(true);
    try {
      const result = seedDemoData();
      if (result.alreadyExists) {
        Alert.alert('Demo Veri', 'Demo veriler zaten yüklü. Önce kaldırıp tekrar ekleyebilirsin.');
      } else {
        Alert.alert('Demo Veri Eklendi', `${result.customerCount} müşteri ve ${result.termCount} vade eklendi.`);
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

  // ─── Search visibility ──────────────────────────────────────────────────────

  const showThemeSection =
    !normalizedSearchQuery ||
    [t('settingsDashboard.themeTitle'), ...themeButtons.map(b => b.label)]
      .join(' ').toLocaleLowerCase('tr-TR').includes(normalizedSearchQuery);

  const showLanguageSection =
    !normalizedSearchQuery ||
    [t('settingsDashboard.languageTitle'), ...languageButtons.map(b => b.label)]
      .join(' ').toLocaleLowerCase('tr-TR').includes(normalizedSearchQuery);

  const showNotificationSection =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.notifications.title'),
      t('settingsDashboard.notifications.permissionAction'),
      t('settingsDashboard.notifications.syncAction'),
    ].join(' ').toLocaleLowerCase('tr-TR').includes(normalizedSearchQuery);

  const showDataSection =
    !normalizedSearchQuery ||
    [
      t('settingsDashboard.dataTitle'),
      t('settingsDashboard.shortJsonAction'),
      t('settingsDashboard.shortExcelAction'),
    ].join(' ').toLocaleLowerCase('tr-TR').includes(normalizedSearchQuery);

  const showAboutAction =
    !normalizedSearchQuery ||
    [t('settingsDashboard.versionAction'), t('settingsDashboard.versionInfoTitle')]
      .join(' ').toLocaleLowerCase('tr-TR').includes(normalizedSearchQuery);

  const hasSearchResults =
    showThemeSection || showLanguageSection || showNotificationSection ||
    showDataSection || showAboutAction;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppScreen>
      {/* Export confirm sheet */}
      <BottomSheetModal
        visible={pendingExport !== null}
        onClose={() => setPendingExport(null)}
      >
        <View style={{ gap: 20 }}>
          <Text
            style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.4, color: SMART_PDF_DARK.text }}
          >
            {pendingExport === 'json'
              ? t('settingsDashboard.confirmJsonBody')
              : t('settingsDashboard.confirmExcelBody')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
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

      {/* About sheet */}
      <BottomSheetModal
        visible={isAboutVisible}
        onClose={() => setIsAboutVisible(false)}
      >
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.3, color: SMART_PDF_DARK.text }}>
                {t('settingsDashboard.versionInfoTitle')}
              </Text>
              <Text style={{ fontSize: 13, color: SMART_PDF_DARK.muted }}>
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
          <Text style={{ fontSize: 14, lineHeight: 22, color: SMART_PDF_DARK.muted }}>
            {t('settingsDashboard.aboutPrivacyLineOne')}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: SMART_PDF_DARK.muted }}>
            {t('settingsDashboard.aboutPrivacyLineTwo')}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: SMART_PDF_DARK.muted }}>
            {t('settingsDashboard.aboutPrivacyLineThree')}
          </Text>
        </View>
      </BottomSheetModal>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR.contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>

          {/* Top bar */}
          <View style={{ minHeight: 40, position: 'relative' }}>
            <AppTopBar
              left={
                <>
                  <AvatarCircle image="profile" size={34} />
                  <BrandWordmark label={t('settingsDashboard.title')} />
                </>
              }
              right={
                <SearchGlyph onPress={() => setIsSearchVisible(c => !c)} />
              }
            />
            <InlineGlobalSearch
              visible={isSearchVisible}
              query={searchQuery}
              onChangeText={setSearchQuery}
              onClose={() => setIsSearchVisible(false)}
              placeholder={t('common.pageSearchPlaceholder')}
              showNoResults={Boolean(normalizedSearchQuery) && !hasSearchResults}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20 }}
            />
          </View>

          {/* App profile card */}
          {!normalizedSearchQuery && (
            <View style={[surfaceStyles.card as object, { borderRadius: 18, padding: 16, shadowOpacity: 0, elevation: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    backgroundColor: SMART_PDF_DARK.accentSurface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="briefcase-outline" size={25} color={SMART_PDF_DARK.accent} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      letterSpacing: -0.4,
                      color: SMART_PDF_DARK.text,
                    }}
                  >
                    Saha CRM
                  </Text>
                  <Text style={{ fontSize: 13, color: SMART_PDF_DARK.muted }}>
                    {t('settingsDashboard.versionLabel', { version: APP_VERSION })}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: SMART_PDF_DARK.divider,
                  marginTop: 14,
                  marginBottom: 12,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: SMART_PDF_DARK.successSurface,
                    borderRadius: 8,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                  }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: SMART_PDF_DARK.success,
                    }}
                  />
                  <Text
                    style={{ fontSize: 11, fontWeight: '600', color: SMART_PDF_DARK.success }}
                  >
                    Çevrimdışı
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: SMART_PDF_DARK.accentSurface,
                    borderRadius: 8,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={10} color={SMART_PDF_DARK.accent} />
                  <Text
                    style={{ fontSize: 11, fontWeight: '600', color: SMART_PDF_DARK.accent }}
                  >
                    Veriler cihazda
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Kullanım (Görünüm + Dil) ────────────────── */}
          {(showThemeSection || showLanguageSection) && (
            <View style={{ gap: 8 }}>
              <SectionLabel>Kullanım</SectionLabel>
              <SettingGroup>
                {showThemeSection && (
                  <SettingRow
                    iconBox={
                      <IconBox
                        name="color-palette-outline"
                        bg={SMART_PDF_DARK.accentSurface}
                        color={SMART_PDF_DARK.accent}
                      />
                    }
                    title="Görünüm"
                    right={
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 3,
                          backgroundColor: SMART_PDF_DARK.surfaceMuted,
                          padding: 3,
                          borderRadius: 10,
                        }}
                      >
                        {themeButtons.map(btn => {
                          const isActive = preference === btn.code;
                          return (
                            <TouchableOpacity
                              key={btn.code}
                              onPress={() => setPreference(btn.code).catch(() => undefined)}
                              activeOpacity={0.72}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 7,
                                backgroundColor: isActive ? SMART_PDF_DARK.surface : 'transparent',
                              }}
                            >
                              <Ionicons
                                name={btn.iconName}
                                size={13}
                                color={isActive ? SMART_PDF_DARK.accent : SMART_PDF_DARK.muted}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: isActive ? '600' : '400',
                                  color: isActive ? SMART_PDF_DARK.text : SMART_PDF_DARK.muted,
                                }}
                              >
                                {btn.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    }
                  />
                )}

                {showThemeSection && showLanguageSection && <RowDivider />}

                {showLanguageSection && (
                  <SettingRow
                    iconBox={
                      <IconBox
                        name="globe-outline"
                        bg={SMART_PDF_DARK.secondarySurface}
                        color={SMART_PDF_DARK.secondary}
                      />
                    }
                    title="Dil"
                    right={
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 3,
                          backgroundColor: SMART_PDF_DARK.surfaceMuted,
                          padding: 3,
                          borderRadius: 10,
                        }}
                      >
                        {languageButtons.map(btn => {
                          const isActive = currentLanguage === btn.code;
                          return (
                            <TouchableOpacity
                              key={btn.code}
                              onPress={() => i18n.changeLanguage(btn.code).catch(() => undefined)}
                              activeOpacity={0.72}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 7,
                                backgroundColor: isActive ? SMART_PDF_DARK.surface : 'transparent',
                              }}
                            >
                              <Ionicons
                                name={btn.icon}
                                size={13}
                                color={isActive ? SMART_PDF_DARK.accent : SMART_PDF_DARK.muted}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: isActive ? '600' : '400',
                                  color: isActive ? SMART_PDF_DARK.text : SMART_PDF_DARK.muted,
                                }}
                              >
                                {btn.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    }
                  />
                )}
              </SettingGroup>
            </View>
          )}

          {/* ── Notifications ───────────────────────────── */}
          {showNotificationSection && (
            <View style={{ gap: 8 }}>
              <SectionLabel>{t('settingsDashboard.notifications.title')}</SectionLabel>
              <SettingGroup>
                <SettingRow
                  iconBox={
                    <IconBox
                      name="notifications-outline"
                      bg={SMART_PDF_DARK.successSurface}
                      color={SMART_PDF_DARK.success}
                    />
                  }
                  title={t('settingsDashboard.notifications.permissionAction')}
                  subtitle={
                    notificationSummary
                      ? t(`settingsDashboard.notifications.permissionStates.${notificationSummary.permission}`)
                      : undefined
                  }
                  onPress={() => handleNotificationPermission().catch(() => undefined)}
                  disabled={isNotificationBusy}
                />
                <RowDivider />
                <SettingRow
                  iconBox={
                    <IconBox
                      name="refresh-outline"
                      bg={SMART_PDF_DARK.successSurface}
                      color={SMART_PDF_DARK.success}
                    />
                  }
                  title={t('settingsDashboard.notifications.syncAction')}
                  subtitle={
                    notificationSummary
                      ? t('settingsDashboard.notifications.summary', {
                          permission: t(`settingsDashboard.notifications.permissionStates.${notificationSummary.permission}`),
                          count: notificationSummary.scheduledCount,
                        })
                      : undefined
                  }
                  onPress={() => handleReminderSync().catch(() => undefined)}
                  disabled={isNotificationBusy}
                />
                <RowDivider />
                <SettingRow
                  iconBox={
                    <IconBox
                      name="paper-plane-outline"
                      bg={SMART_PDF_DARK.accentSurface}
                      color={SMART_PDF_DARK.accent}
                    />
                  }
                  title={t('settingsDashboard.notifications.testInlineAction')}
                  onPress={() => handleTestNotification().catch(() => undefined)}
                  disabled={isNotificationBusy}
                />
              </SettingGroup>
            </View>
          )}

          {/* ── Data ────────────────────────────────────── */}
          {showDataSection && (
            <>
              <View style={{ gap: 8 }}>
                <SectionLabel>{t('settingsDashboard.dataTitle')}</SectionLabel>
                <SettingGroup>
                  <SettingRow
                    iconBox={
                      <IconBox
                        name="code-slash-outline"
                        bg={SMART_PDF_DARK.accentSurface}
                        color={SMART_PDF_DARK.accent}
                      />
                    }
                    title={t('settingsDashboard.shortJsonAction')}
                    subtitle="JSON formatında dışa aktar"
                    onPress={() => setPendingExport('json')}
                    disabled={isJsonBusy}
                  />
                  <RowDivider />
                  <SettingRow
                    iconBox={
                      <IconBox
                        name="grid-outline"
                        bg={SMART_PDF_DARK.successSurface}
                        color={SMART_PDF_DARK.success}
                      />
                    }
                    title={t('settingsDashboard.shortExcelAction')}
                    subtitle="Excel formatında dışa aktar"
                    onPress={() => setPendingExport('excel')}
                    disabled={isExcelBusy}
                  />
                </SettingGroup>
              </View>

              <View style={{ gap: 8 }}>
                <SectionLabel>Demo</SectionLabel>
                <SettingGroup>
                  <SettingRow
                    iconBox={
                      <IconBox
                        name="flask-outline"
                        bg={SMART_PDF_DARK.accentSurface}
                        color={SMART_PDF_DARK.accent}
                      />
                    }
                    title="Demo verileri ekle"
                    subtitle="Müşteri ve vade örnekleri yükle"
                    onPress={handleSeedDemo}
                    disabled={isDemoBusy}
                  />
                  <RowDivider />
                  <SettingRow
                    iconBox={
                      <IconBox
                        name="trash-outline"
                        bg={SMART_PDF_DARK.dangerSurface}
                        color={SMART_PDF_DARK.danger}
                      />
                    }
                    title="Demo verileri kaldır"
                    onPress={handleClearDemo}
                    disabled={isDemoBusy}
                    dangerous
                  />
                </SettingGroup>
              </View>
            </>
          )}

          {/* ── About ───────────────────────────────────── */}
          {showAboutAction && (
            <SettingGroup>
              <SettingRow
                iconBox={
                  <IconBox
                    name="information-circle-outline"
                    bg={SMART_PDF_DARK.surfaceAlt}
                    color={SMART_PDF_DARK.muted}
                  />
                }
                title={t('settingsDashboard.versionAction')}
                onPress={() => setIsAboutVisible(true)}
              />
            </SettingGroup>
          )}

        </View>
      </ScrollView>
    </AppScreen>
  );
};

export default SettingsScreen;
