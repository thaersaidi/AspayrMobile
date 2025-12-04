const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 */
const config = getDefaultConfig(__dirname);

// Extend the default config
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;
