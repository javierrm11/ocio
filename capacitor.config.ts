import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ozio.app',
  appName: 'Ozio',
  // webDir must exist but is not used since server.url points to Vercel
  webDir: 'capacitor-placeholder',
  server: {
    url: 'https://ocio-virid.vercel.app/mapa',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    Keyboard: {
      resize: 'none',
      scrollAssist: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
