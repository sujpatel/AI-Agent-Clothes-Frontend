import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://dmrkaxzizzqsupntiyps.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_B80gTYSD66DarYWUVUT9BA_-mNA9S34';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
