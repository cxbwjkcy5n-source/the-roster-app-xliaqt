
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AddScreen() {
  const router = useRouter();

  useEffect(() => {
    router.push('/person/add');
  }, []);

  return null;
}
