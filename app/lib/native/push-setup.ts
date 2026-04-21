'use client';

import { isNative } from './capacitor-bridge';

export async function setupPushNotifications(userId: string): Promise<void> {
  if (!isNative()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    try {
      await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.value, userId }),
      });
    } catch {
      // Registration failure is non-fatal
    }
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data;
    // Navigate based on notification type if needed
    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }
  });
}
