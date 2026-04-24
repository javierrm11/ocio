import admin from 'firebase-admin';

function getApp() {
  if (admin.apps.length > 0) return admin.app();
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}');
  return admin.initializeApp({ credential: admin.credential.cert(sa) });
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!tokens.length) return;
  const messaging = getApp().messaging();
  await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: data ?? {},
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });
}