import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function TestModal() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24 }}>Test Modal</Text>
      <Button title="Close" onPress={() => router.back()} />
    </View>
  );
} 