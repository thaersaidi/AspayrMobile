import { Platform, StyleProp, ViewStyle } from 'react-native';

/**
 * Utility functions for responsive design
 */

export const isWeb = Platform.OS === 'web';

/**
 * Get a style object that only applies on web
 */
export const webStyle = <T extends StyleProp<ViewStyle>>(style: T): T | {} => {
  return isWeb ? style : {};
};

/**
 * Get a style object that only applies on native (iOS/Android)
 */
export const nativeStyle = <T extends StyleProp<ViewStyle>>(style: T): T | {} => {
  return !isWeb ? style : {};
};

/**
 * Responsive spacing based on screen size
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Common max widths for content containers
 */
export const maxWidths = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
  content: 1200, // Main content area
  card: 800, // Single column cards
};

/**
 * Grid columns for different breakpoints
 */
export const gridColumns = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  wide: 4,
};
