import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { spacing, gridColumns } from '../../utils/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  gap?: number;
  minColumns?: number;
  maxColumns?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Responsive grid that adjusts number of columns based on screen size
 * On mobile: 1 column (vertical stack)
 * On tablet: 2 columns
 * On desktop: 3 columns
 * On wide: 4 columns (or maxColumns if specified)
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  gap = spacing.md,
  minColumns = 1,
  maxColumns = 4,
  style,
}) => {
  const { breakpoint } = useResponsive();

  // Determine number of columns based on breakpoint
  let columns = gridColumns[breakpoint];
  columns = Math.max(minColumns, Math.min(columns, maxColumns));

  // Convert children to array
  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.grid, { gap }, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[
            styles.gridItem,
            {
              width: columns === 1 ? '100%' : `${(100 / columns)}%`,
              paddingHorizontal: columns === 1 ? 0 : gap / 2,
              marginBottom: gap,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 0,
  },
  gridItem: {
    // Base styles for grid items
  },
});
