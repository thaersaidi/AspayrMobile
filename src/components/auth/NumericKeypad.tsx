import React from 'react';
import { View, TouchableOpacity, StyleSheet, Vibration, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface NumericKeypadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min((width - 120) / 3, 72);

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onPress,
  onDelete,
  disabled = false,
}) => {
  const theme = useTheme();

  const handlePress = (value: string) => {
    if (!disabled) {
      Vibration.vibrate(10);
      onPress(value);
    }
  };

  const handleDelete = () => {
    if (!disabled) {
      Vibration.vibrate(10);
      onDelete();
    }
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <View style={styles.container}>
      {buttons.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((button, buttonIndex) => {
            if (button === '') {
              return <View key={buttonIndex} style={styles.emptyButton} />;
            }

            if (button === 'delete') {
              return (
                <TouchableOpacity
                  key={buttonIndex}
                  style={[
                    styles.button,
                    styles.deleteButton,
                    { backgroundColor: '#FEE2E2' },
                  ]}
                  onPress={handleDelete}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="backspace-outline"
                    size={24}
                    color="#DC2626"
                  />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={buttonIndex}
                style={[
                  styles.button,
                  { backgroundColor: '#F3F4F6' },
                  disabled && styles.buttonDisabled,
                ]}
                onPress={() => handlePress(button)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>
                  {button}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  deleteButton: {
    // Delete button styling
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
  },
});
