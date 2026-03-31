import { StyleSheet, Text, View } from 'react-native';
import type { HomeStackScreenProps } from '@types/navigation';

type Props = HomeStackScreenProps<'Home'>;

export default function HomeScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Activities</Text>
      <Text style={styles.subtitle}>Your daily dashboard will appear here</Text>
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
