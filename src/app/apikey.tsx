import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PressableScale } from '@/components/pressable';
import { Symbol } from '@/components/symbol';
import { hapticSuccess, hapticTick } from '@/lib/haptics';
import { getApiKey, setApiKey } from '@/lib/storage';
import { continuous, font, radius, spacing, useThemeColors , AnyStyle } from '@/lib/theme';

/**
 * API key — a short interruption, so it presents as a modal (navigation
 * law 2) with its own Cancel/Done pair. The value lives in the Keychain,
 * never in app storage.
 */
export default function ApiKeyScreen() {
  const colors = useThemeColors();
  const inputRef = useRef('');
  const [draft, setDraft] = useState('');

  const save = async () => {
    const next = inputRef.current.trim();
    const current = await getApiKey();
    if (next === current) {
      hapticTick();
    } else {
      await setApiKey(next);
      hapticSuccess();
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'API key',
          headerLeft: () => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              hitSlop={12}
              onPress={() => router.back()}
            >
              <Text style={{ color: colors.secondary, fontSize: font.callout }}>
                Cancel
              </Text>
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Save key"
              hitSlop={12}
              onPress={() => void save()}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontSize: font.callout,
                  fontWeight: '600',
                }}
              >
                Done
              </Text>
            </PressableScale>
          ),
        }}
      />
      <View style={keyStyles.wrap}>
        <View style={[keyStyles.card, continuous, { backgroundColor: colors.card }]}>
          <View style={keyStyles.row}>
            <Symbol name="lock.fill" size={18} color={colors.secondary} />
            <Text style={[keyStyles.label, { color: colors.secondary }]}>
              Stored in the device Keychain — sent only to your endpoint.
            </Text>
          </View>
          <TextInput
            defaultValue=""
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            placeholder="sk-…  (leave empty to remove)"
            placeholderTextColor={colors.tertiary}
            onChangeText={(t) => {
              inputRef.current = t;
              setDraft(t);
            }}
            style={[
              keyStyles.input,
              continuous,
              {
                backgroundColor: colors.bg,
                color: colors.label,
                borderColor: colors.separator,
              },
            ]}
          />
          <Text style={[keyStyles.hint, { color: colors.tertiary }]}>
            {draft.trim().length === 0
              ? 'Saving an empty field removes the stored key.'
              : `${draft.length} characters`}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const keyStyles: Record<string, AnyStyle> = {
  wrap: { padding: spacing.l },
  card: {
    borderRadius: radius.card,
    padding: spacing.l,
    gap: spacing.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  label: {
    fontSize: font.footnote,
    lineHeight: 18,
    flex: 1,
  },
  input: {
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    fontSize: font.callout,
  },
  hint: {
    fontSize: font.caption,
  },
};
