import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/pressable';
import { Icon } from '@/components/symbol';
import { isProbablyUrl, normalizeBase, testConnection } from '@/lib/api';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { setApiKey } from '@/lib/storage';
import { useSettings } from '@/lib/store';
import {
  continuous,
  font,
  radius,
  spacing,
  useThemeColors,
  AnyStyle,
} from '@/lib/theme';

/**
 * Onboarding is a one-way door (navigation law 3): the root guard makes it
 * unreachable once an endpoint is configured — back can never re-enter this
 * state. Android back from home exits the app.
 */
export default function Onboarding() {
  const colors = useThemeColors();
  const urlRef = useRef('');
  const keyRef = useRef('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  const setEndpoint = useSettings((s) => s.setEndpoint);
  const setModel = useSettings((s) => s.setModel);

  const connect = async () => {
    const raw = urlRef.current;
    if (!isProbablyUrl(raw)) {
      setError('Enter a URL like http://localhost:11434 or https://api.example.com');
      hapticError();
      return;
    }
    setError('');
    setConnecting(true);
    const result = await testConnection(raw, keyRef.current);
    setConnecting(false);
    if (!result.ok) {
      setError(result.error);
      hapticError();
      return;
    }
    await setApiKey(keyRef.current.trim());
    setEndpoint(normalizeBase(raw));
    if (result.models > 0) {
      // Land on a model the endpoint actually serves — first message should work.
      setModel('');
    }
    hapticSuccess();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={onboardingStyles.container}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={onboardingStyles.mark}>
          <Icon name="bolt.fill" size={30} color={colors.accent} weight="semibold" />
        </View>
        <Text style={[onboardingStyles.title, { color: colors.label }]}>Peregrine</Text>
        <Text style={[onboardingStyles.subtitle, { color: colors.secondary }]}>
          Connect an OpenAI-compatible endpoint — Ollama on this device, a
          self-hosted gateway, or the cloud. Keys stay in the Keychain.
        </Text>

        <View style={onboardingStyles.form}>
          <Text style={[onboardingStyles.label, { color: colors.secondary }]}>Endpoint URL</Text>
          <TextInput
            defaultValue=""
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            autoComplete="url"
            placeholder="http://localhost:11434"
            placeholderTextColor={colors.tertiary}
            onChangeText={(t) => {
              urlRef.current = t;
              if (error) setError('');
            }}
            style={[
              onboardingStyles.input,
              continuous,
              { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator },
            ]}
          />
          <Text style={[onboardingStyles.label, { color: colors.secondary }]}>
            API key · optional
          </Text>
          <TextInput
            defaultValue=""
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            placeholder="sk-…"
            placeholderTextColor={colors.tertiary}
            onChangeText={(t) => {
              keyRef.current = t;
            }}
            style={[
              onboardingStyles.input,
              continuous,
              { backgroundColor: colors.card, color: colors.label, borderColor: colors.separator },
            ]}
          />
          {error ? (
            <Text style={[onboardingStyles.error, { color: colors.danger }]} selectable>
              {error}
            </Text>
          ) : null}
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Connect and start"
            disabled={connecting}
            onPress={() => void connect()}
            style={[
              onboardingStyles.cta,
              continuous,
              { backgroundColor: connecting ? colors.tertiary : colors.accent },
            ]}
          >
            <Text style={[onboardingStyles.ctaText, { color: colors.onAccent }]}>
              {connecting ? 'Connecting…' : 'Start'}
            </Text>
          </PressableScale>
          <Text style={[onboardingStyles.hint, { color: colors.tertiary }]}>
            No account, no telemetry. Run Ollama locally and point Peregrine at
            it, or bring any /v1 endpoint you already trust.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const onboardingStyles: Record<string, AnyStyle> = {
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.s,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: '#00000000',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  title: {
    fontSize: font.largeTitle,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.callout,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.s,
  },
  label: {
    fontSize: font.footnote,
    fontWeight: '500',
    marginTop: spacing.s,
  },
  input: {
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    fontSize: font.callout,
  },
  error: {
    fontSize: font.footnote,
    lineHeight: 18,
    marginTop: spacing.s,
  },
  cta: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l - 2,
    marginTop: spacing.m,
  },
  ctaText: {
    fontSize: font.headline,
    fontWeight: '600',
  },
  hint: {
    fontSize: font.footnote,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.l,
  },
};
