import { useRouter } from 'expo-router';
import FlashcardsScreen from '../FlashcardsScreen';

export default function HomeScreen() {
  const router = useRouter();

  const handleNavigateToSet = (setId: string) => {
    router.push({ pathname: '/set', params: { id: setId } });
  };

  return <FlashcardsScreen onNavigateToSet={handleNavigateToSet} />;
}
