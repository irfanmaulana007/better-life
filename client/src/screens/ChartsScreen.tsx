import { StyleSheet, Text, View } from 'react-native';
import type { ChartsStackScreenProps } from '@types/navigation';

type Props = ChartsStackScreenProps<'Charts'>;

export default function ChartsScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Charts</Text>
      <Text style={styles.subtitle}>Your analytics will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
