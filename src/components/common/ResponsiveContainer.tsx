import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { maxWidths } from '../../utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  centerContent?: boolean;
}

/**
 * Container component that constrains width on web while remaining full-width on mobile
 * Centers content on larger screens
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = maxWidths.content,
  style,
  centerContent = true,
}) => {
  const { isWeb, width } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        isWeb && {
          maxWidth,
          width: '100%',
          marginHorizontal: centerContent ? 'auto' : 0,
          alignSelf: centerContent ? 'center' : 'auto',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
