
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect directly to roster (home screen) - no login required
  return <Redirect href="/(tabs)/roster" />;
}
