import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pulsedev.gym',
  appName: 'Pulse GYM',
  webDir: 'dist/front-end/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;