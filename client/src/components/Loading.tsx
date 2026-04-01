import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@hooks';

interface Props {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function Loading({ message, size = 'large', fullScreen = true }: Props) {
  const theme = useTheme();

  if (!fullScreen) {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size={size} color={theme.colors.primary} />
        {message && (
          <Text style={[styles.inlineMessage, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineMessage: {
    marginLeft: 12,
    fontSize: 14,
  },
});
