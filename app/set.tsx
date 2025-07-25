import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SetRedirect() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/set/flashcard?id=${id}`);
    }
  }, [id, router]);

  return null;
} 