import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

/** A photo that shows a distinct dim/pulsing placeholder while loading and a
 * clearly different broken-image icon on error — so "still loading" never
 * looks identical to "this photo is actually missing." */
export function LoadablePhoto({ uri, style }: { uri: string; style?: StyleProp<ViewStyle> }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');

  return (
    <View style={style}>
      {status !== 'error' && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {status !== 'loaded' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { backgroundColor: lineColor, opacity: status === 'loading' ? 0.4 : 1 },
          ]}>
          {status === 'error' && <IconSymbol name="tshirt" size={20} color={mutedColor} style={styles.errorIcon} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    opacity: 0.5,
  },
});
