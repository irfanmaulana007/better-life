import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@hooks';
import { Icon } from './Icon';

interface Props {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorMessage({ message, onRetry, retryText = 'Try Again' }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorLight }]}>
      <View style={styles.iconContainer}>
        <Icon name="alert" size={32} color="#FF3B30" />
      </View>
      <Text style={[styles.message, { color: theme.colors.error }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.error }]}
          onPress={onRetry}
        >
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
