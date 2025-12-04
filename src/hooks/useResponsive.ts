import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  deviceType: DeviceType;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
}

/**
 * Hook to get responsive information about the current screen size and platform
 * Updates on dimension changes
 */
export const useResponsive = (): ResponsiveInfo => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isWeb = Platform.OS === 'web';

  // Determine breakpoint
  let breakpoint: Breakpoint = 'mobile';
  if (width >= BREAKPOINTS.wide) {
    breakpoint = 'wide';
  } else if (width >= BREAKPOINTS.desktop) {
    breakpoint = 'desktop';
  } else if (width >= BREAKPOINTS.tablet) {
    breakpoint = 'tablet';
  }

  // Determine device type (more general than breakpoint)
  let deviceType: DeviceType = 'mobile';
  if (width >= BREAKPOINTS.desktop) {
    deviceType = 'desktop';
  } else if (width >= BREAKPOINTS.tablet) {
    deviceType = 'tablet';
  }

  return {
    width,
    height,
    breakpoint,
    deviceType,
    isWeb,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
  };
};

/**
 * Get responsive value based on current breakpoint
 * @example
 * const padding = useResponsiveValue({ mobile: 8, tablet: 16, desktop: 24 });
 */
export const useResponsiveValue = <T,>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}): T | undefined => {
  const { breakpoint } = useResponsive();

  if (breakpoint === 'wide' && values.wide !== undefined) return values.wide;
  if ((breakpoint === 'desktop' || breakpoint === 'wide') && values.desktop !== undefined)
    return values.desktop;
  if ((breakpoint === 'tablet' || breakpoint === 'desktop' || breakpoint === 'wide') && values.tablet !== undefined)
    return values.tablet;
  return values.mobile;
};
