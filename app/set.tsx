import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SetRedirect() {
  const { id, route } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      if (route === 'flashcard') {
        router.replace(`/set/flashcard?id=${id}`);
      } else {
        // Default to list view
        router.replace(`/set/list?id=${id}`);
      }
    }
  }, [id, route, router]);

  return null;
} 