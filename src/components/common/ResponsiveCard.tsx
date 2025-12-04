import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Card as PaperCard, useTheme } from 'react-native-paper';
import { useResponsive } from '../../hooks/useResponsive';

export interface ResponsiveCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  horizontal?: boolean | 'auto'; // 'auto' means horizontal on desktop, vertical on mobile
  padding?: number;
}

/**
 * Card component that adapts its layout based on screen size
 * - On web/desktop: Can display horizontally with hover effects
 * - On mobile: Always displays vertically
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  onPress,
  style,
  elevated = true,
  horizontal = 'auto',
  padding = 16,
}) => {
  const theme = useTheme();
  const { isDesktop, isWeb } = useResponsive();
  const [isHovered, setIsHovered] = useState(false);

  // Determine if card should be horizontal
  const isHorizontal = horizontal === 'auto' ? isDesktop : horizontal;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.dark ? theme.colors.outline : '#E5E7EB',
    },
    // Add hover effect on web
    isWeb && isHovered && styles.hoveredCard,
    isWeb && isHovered && {
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark ? theme.colors.surfaceVariant : '#F9FAFB',
    },
    style,
  ];

  const contentStyle = [
    styles.content,
    { padding },
    isHorizontal && styles.horizontalContent,
  ];

  const content = (
    <PaperCard style={cardStyle} elevation={elevated ? (isHovered ? 4 : 2) : 0}>
      <View style={contentStyle}>{children}</View>
    </PaperCard>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        onMouseEnter={() => isWeb && setIsHovered(true)}
        onMouseLeave={() => isWeb && setIsHovered(false)}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      onMouseEnter={() => isWeb && setIsHovered(true)}
      onMouseLeave={() => isWeb && setIsHovered(false)}
    >
      {content}
    </View>
  );
};

/**
 * Horizontal card section component for organizing content within a ResponsiveCard
 */
interface CardSectionProps {
  children: React.ReactNode;
  flex?: number;
  style?: StyleProp<ViewStyle>;
  align?: 'flex-start' | 'center' | 'flex-end';
}

export const CardSection: React.FC<CardSectionProps> = ({
  children,
  flex = 1,
  style,
  align = 'flex-start',
}) => {
  return (
    <View style={[{ flex, justifyContent: align }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out', // For web hover animations
  },
  hoveredCard: {
    transform: [{ translateY: -2 }],
  },
  content: {
    flexDirection: 'column',
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
