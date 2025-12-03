import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card as PaperCard, Text, useTheme } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevated = true,
}) => {
  const theme = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.dark ? theme.colors.outline : '#E5E7EB',
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <PaperCard style={cardStyle} elevation={elevated ? 2 : 0}>
          <PaperCard.Content>{children}</PaperCard.Content>
        </PaperCard>
      </TouchableOpacity>
    );
  }

  return (
    <PaperCard style={cardStyle} elevation={elevated ? 2 : 0}>
      <PaperCard.Content>{children}</PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
});
