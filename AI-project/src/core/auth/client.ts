import { oneTapClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { envConfigs } from '@/config';

function resolveClientAuthBaseUrl() {
  const configuredUrl = envConfigs.auth_url?.trim();
  if (!configuredUrl) {
    return '';
  }

  if (typeof window !== 'undefined') {
    try {
      const configuredHost = new URL(configuredUrl).hostname;
      const currentHost = window.location.hostname;
      const configuredIsLocalhost =
        configuredHost === 'localhost' ||
        configuredHost === '127.0.0.1' ||
        configuredHost === '::1' ||
        configuredHost === '[::1]';
      const currentIsLocalhost =
        currentHost === 'localhost' ||
        currentHost === '127.0.0.1' ||
        currentHost === '::1' ||
        currentHost === '[::1]';

      if (!currentIsLocalhost && configuredIsLocalhost) {
        return '';
      }
    } catch {
      return '';
    }
  }

  return configuredUrl;
}

// create default auth client, without plugins
export const authClient = createAuthClient({
  baseURL: resolveClientAuthBaseUrl(),
});

// export default auth client methods
export const { useSession, signIn, signUp, signOut } = authClient;

// get auth client with plugins
export function getAuthClient(configs: Record<string, string>) {
  const authClient = createAuthClient({
    baseURL: resolveClientAuthBaseUrl(),
    plugins: getAuthPlugins(configs),
  });

  return authClient;
}

// get auth plugins with configs
function getAuthPlugins(configs: Record<string, string>) {
  const authPlugins = [];

  // google one tap plugin
  if (configs.google_client_id && configs.google_one_tap_enabled === 'true') {
    authPlugins.push(
      oneTapClient({
        clientId: configs.google_client_id,
        // Optional client configuration:
        autoSelect: false,
        cancelOnTapOutside: false,
        context: 'signin',
        additionalOptions: {
          // Any extra options for the Google initialize method
        },
        // Configure prompt behavior and exponential backoff:
        promptOptions: {
          baseDelay: 1000, // Base delay in ms (default: 1000)
          maxAttempts: 1, // Only attempt once to avoid multiple error logs (default: 5)
        },
      })
    );
  }

  return authPlugins;
}
