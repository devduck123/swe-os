import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Notes',
  slug: 'notes',
  scheme: 'notes',
  ios: { bundleIdentifier: 'com.example.notes' },
  extra: { eas: { projectId: '00000000-0000-0000-0000-000000000000' } },
};

export default config;
