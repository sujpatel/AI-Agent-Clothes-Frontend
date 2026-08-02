import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://dmrkaxzizzqsupntiyps.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_B80gTYSD66DarYWUVUT9BA_-mNA9S34';

// AsyncStorage's native module reads `window` during Expo's server-side
// rendering pass for the web target, which crashes before the page ever
// loads — this app only ships on iOS/Android, so only wire it up there.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
