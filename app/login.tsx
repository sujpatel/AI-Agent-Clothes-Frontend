import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const lineColor = useThemeColor({}, 'line');
  const mutedColor = useThemeColor({}, 'muted');

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter an email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = mode === 'signIn' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);

    if (result) {
      setError(result);
    } else if (mode === 'signUp') {
      setConfirmationSent(true);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.masthead}>
          <ThemedText style={[styles.eyebrow, { color: mutedColor }]}>
            {mode === 'signIn' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
          </ThemedText>
          <ThemedText style={styles.h1}>{mode === 'signIn' ? 'Sign in' : 'Sign up'}</ThemedText>
          <ThemedView style={[styles.rule, { backgroundColor: lineColor }]} />
        </ThemedView>

        {confirmationSent ? (
          <ThemedText style={[styles.confirmText, { color: mutedColor }]}>
            Check {email} for a confirmation link, then sign in.
          </ThemedText>
        ) : (
          <>
            <ThemedView style={styles.form}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={[styles.input, { color: textColor, backgroundColor: cardColor, borderColor: lineColor }]}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={mutedColor}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: textColor, backgroundColor: cardColor, borderColor: lineColor }]}
              />
            </ThemedView>

            {error && <ThemedText style={[styles.error, { color: mutedColor }]}>{error}</ThemedText>}

            <Pressable
              style={[styles.button, { backgroundColor: textColor }, submitting && styles.buttonDisabled]}
              onPress={submit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={bgColor} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: bgColor }]}>
                  {mode === 'signIn' ? 'SIGN IN' : 'SIGN UP'}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.switchModeLink}
              onPress={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setError(null);
              }}>
              <ThemedText style={[styles.switchModeText, { color: mutedColor }]}>
                {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </ThemedText>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  masthead: {
    gap: 8,
    marginBottom: 32,
  },
  eyebrow: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  h1: {
    fontFamily: Fonts.serif,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: '600',
    letterSpacing: -1,
  },
  rule: {
    height: 1,
    width: '100%',
  },
  form: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  error: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  switchModeLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
  switchModeText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  confirmText: {
    fontFamily: Fonts.serif,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
});
