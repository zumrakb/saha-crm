import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import type { Customer } from '../constants/customer.types';
import { isPendingTermStatus } from '../constants/termStatus';
import type { Term } from '../constants/term.types';
import { getCustomerById } from '../repositories/customer.repository';
import { getAllTerms } from '../repositories/term.repository';
import { formatDate, parseISODate } from '../utils/dateUtils';

const TERM_REMINDER_CHANNEL_ID = 'term-reminders';
const TERM_REMINDER_PREFIX = 'term-reminder-';
const TEST_NOTIFICATION_ID = 'term-reminder-test';
const NOTIFICATION_PERMISSION_REQUESTED_STORAGE_KEY = 'notifications.permission.requested';

export type NotificationPermissionState = 'authorized' | 'provisional' | 'denied';

export interface NotificationDebugSummary {
  permission: NotificationPermissionState;
  scheduledCount: number;
}

function getTermNotificationId(termId: number): string {
  return `${TERM_REMINDER_PREFIX}${termId}`;
}

function isManagedNotificationId(notificationId: string): boolean {
  return notificationId.startsWith(TERM_REMINDER_PREFIX);
}

function getPermissionState(status: AuthorizationStatus): NotificationPermissionState {
  if (status === AuthorizationStatus.AUTHORIZED) {
    return 'authorized';
  }

  if (status === AuthorizationStatus.PROVISIONAL) {
    return 'provisional';
  }

  return 'denied';
}

async function hasRequestedNotificationPermission(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(NOTIFICATION_PERMISSION_REQUESTED_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function markNotificationPermissionRequested(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED_STORAGE_KEY, 'true');
  } catch {
    // ignore storage errors
  }
}

function getReminderDate(expectedDate: string): Date {
  const reminderDate = parseISODate(expectedDate);
  reminderDate.setHours(9, 0, 0, 0);

  return reminderDate;
}

function formatReminderTime(date: Date): string {
  return new Intl.DateTimeFormat(
    (i18n.language || 'en').startsWith('tr') ? 'tr-TR' : 'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function canScheduleReminder(term: Term): boolean {
  if (!isPendingTermStatus(term.status)) {
    return false;
  }

  return getReminderDate(term.expectedDate).getTime() > Date.now();
}

function getCustomerLabel(customer: Customer | null): string {
  if (customer?.companyName?.trim()) {
    return customer.companyName.trim();
  }

  if (customer?.customerName?.trim()) {
    return customer.customerName.trim();
  }

  return 'Saha CRM';
}

async function ensureChannel(): Promise<string> {
  return notifee.createChannel({
    id: TERM_REMINDER_CHANNEL_ID,
    name: i18n.t('settingsDashboard.notifications.channels.termReminders'),
    importance: AndroidImportance.HIGH,
  });
}

async function cancelStaleManagedNotifications(activeNotificationIds: Set<string>): Promise<void> {
  const existingIds = await notifee.getTriggerNotificationIds();
  const staleIds = existingIds.filter(
    notificationId =>
      isManagedNotificationId(notificationId) &&
      !activeNotificationIds.has(notificationId),
  );

  await Promise.all(staleIds.map(notificationId => notifee.cancelNotification(notificationId)));
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const settings = await notifee.requestPermission({
    alert: true,
    badge: true,
    sound: true,
  });

  await markNotificationPermissionRequested();

  return getPermissionState(settings.authorizationStatus);
}

export async function autoRequestNotificationPermission(): Promise<NotificationPermissionState | null> {
  if (await hasRequestedNotificationPermission()) {
    return null;
  }

  const settings = await notifee.getNotificationSettings();

  if (settings.authorizationStatus !== AuthorizationStatus.NOT_DETERMINED) {
    await markNotificationPermissionRequested();
    return getPermissionState(settings.authorizationStatus);
  }

  return requestNotificationPermission();
}

export async function getNotificationDebugSummary(): Promise<NotificationDebugSummary> {
  const [settings, triggerIds] = await Promise.all([
    notifee.getNotificationSettings(),
    notifee.getTriggerNotificationIds(),
  ]);

  return {
    permission: getPermissionState(settings.authorizationStatus),
    scheduledCount: triggerIds.filter(isManagedNotificationId).length,
  };
}

export async function showTestNotification(): Promise<void> {
  const channelId = await ensureChannel();

  await notifee.displayNotification({
    id: TEST_NOTIFICATION_ID,
    title: i18n.t('settingsDashboard.notifications.messages.testTitle'),
    body: i18n.t('settingsDashboard.notifications.messages.testBody'),
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
    },
    ios: {
      sound: 'default',
    },
  });
}

export async function cancelTermReminder(termId: number): Promise<void> {
  await notifee.cancelNotification(getTermNotificationId(termId));
}

export async function scheduleTermReminder(term: Term): Promise<void> {
  const notificationId = getTermNotificationId(term.id);

  if (!canScheduleReminder(term)) {
    await notifee.cancelNotification(notificationId);
    return;
  }

  const channelId = await ensureChannel();
  const customer = getCustomerById(term.customerId);
  const reminderDate = getReminderDate(term.expectedDate);
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: reminderDate.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: i18n.t('settingsDashboard.notifications.messages.termTitle', {
        customer: getCustomerLabel(customer),
      }),
      body: i18n.t('settingsDashboard.notifications.messages.termBody', {
        product: term.productName,
        date: formatDate(
          term.expectedDate,
          (i18n.language || 'en').startsWith('tr') ? 'tr-TR' : 'en-US',
        ),
        time: formatReminderTime(reminderDate),
      }),
      data: {
        customerId: `${term.customerId}`,
        termId: `${term.id}`,
      },
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    },
    trigger,
  );
}

export async function syncTermReminders(terms = getAllTerms()): Promise<void> {
  await ensureChannel();

  const activeTerms = terms.filter(canScheduleReminder);
  const activeNotificationIds = new Set(
    activeTerms.map(term => getTermNotificationId(term.id)),
  );

  await cancelStaleManagedNotifications(activeNotificationIds);
  await Promise.all(activeTerms.map(term => scheduleTermReminder(term)));
}
