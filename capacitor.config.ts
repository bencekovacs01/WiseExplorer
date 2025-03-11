import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wise.explorer',
  appName: 'WiseExplorer',
  webDir: "out",
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
    hostname: '192.168.1.100:3001',
    // hostname: 'localhost:3001',
  },
  android: {
    backgroundColor: "#ffffff",
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "always",
    preferredContentMode: "mobile",
  },
};

export default config;