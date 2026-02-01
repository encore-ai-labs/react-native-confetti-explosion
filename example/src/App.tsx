import { StyleSheet, View } from 'react-native';
import { ConfettiExplosion } from 'react-native-confetti-explosion';

export default function App() {
  return (
    <View style={styles.container}>
      <ConfettiExplosion />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
