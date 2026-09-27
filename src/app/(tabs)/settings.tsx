import * as Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { PressableRow } from '@/components/pressable';
import { Icon } from '@/components/symbol';
import { isProbablyUrl, normalizeBase, testConnection } from '@/lib/api';
import { hapticError, hapticSuccess, hapticTick, hapticWarn } from '@/lib/haptics';
import { formatMs } from '@/lib/format';
import { useChat, useSettings } from '@/lib/store';
import { continuous, font, radius, spacing, tabularNums, useThemeColors , AnyStyle } from '@/lib/theme';

type TestState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ok'; ms: number; models: number }
  | { kind: 'fail'; error: string };

/**
 * Settings — native controls over rebuilt ones (fidelity law 2): the system
 * Switch, the platform Slider, native alerts for destructive confirms.
 * Validation happens on blur/submit, never on keystroke.
 */
export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const baseUrl = useSettings((s) => s.baseUrl);
  const model = useSettings((s) => s.model);
  const temperature = useSettings((s) => s.temperature);
  const streamEnabled = useSettings((s) => s.streamEnabled);
  const setEndpoint = useSettings((s) => s.setEndpoint);
  const setTemperature = useSettings((s) => s.setTemperature);
  const setStreamEnabled = useSettings((s) => s.setStreamEnabled);
  const clearConversations = useChat((s) => s.clearConversations);

  const urlRef = useRef(baseUrl);
  const [test, setTest] = useState<TestState>({ kind: 'idle' });

  const commitEndpoint = () => {
    const next = urlRef.current.trim();
    if (next === baseUrl) return;
    if (next && !isProbablyUrl(next)) return;
    setEndpoint(next ? normalizeBase(next) : '');
    setTest({ kind: 'idle' });
  };

  const runTest = async () => {
    const candidate = urlRef.current.trim();
    if (!isProbablyUrl(candidate)) {
      setTest({ kind: 'fail', error: 'Enter a valid URL first.' });
      hapticError();
      return;
    }
    setTest({ kind: 'running' });
    const result = await testConnection(candidate, '');
    if (result.ok) {
      setTest({ kind: 'ok', ms: result.elapsedMs, models: result.models });
      hapticSuccess();
    } else {
      setTest({ kind: 'fail', error: result.error });
      hapticError();
    }
  };

  const confirmClear = () => {
    hapticWarn();
    Alert.alert('Delete all chats?', 'Every conversation will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: clearConversations },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerLargeTitle: true }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <SectionLabel text="Endpoint" colors={colors} />
        <Group colors={colors}>
          <View style={settingsStyles.inputRow}>
            <Text style={[settingsStyles.fieldLabel, { color: colors.secondary }]}>Base URL</Text>
            <TextInput
              defaultValue={baseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textContentType="URL"
              placeholder="http://localhost:11434"
              placeholderTextColor={colors.tertiary}
              onChangeText={(t) => {
                urlRef.current = t;
              }}
              onBlur={commitEndpoint}
              onSubmitEditing={commitEndpoint}
              style={[settingsStyles.input, { color: colors.label }]}
              selectTextOnFocus
            />
          </View>
          <Hairline colors={colors} />
          <PressableRow
            baseColor={colors.card}
            highlightColor={colors.separator}
            accessibilityRole="button"
            accessibilityLabel="Set API key"
            onPress={() => router.push('/apikey')}
            style={settingsStyles.row}
          >
            <Icon name="key.fill" size={18} color={colors.secondary} />
            <Text style={[settingsStyles.rowText, { color: colors.label }]}>API key</Text>
            <Text style={[settingsStyles.value, { color: colors.secondary }]}>
              Keychain
            </Text>
            <Icon name="chevron.right" size={14} color={colors.tertiary} />
          </PressableRow>
          <Hairline colors={colors} />
          <PressableRow
            baseColor={colors.card}
            highlightColor={colors.separator}
            accessibilityRole="button"
            accessibilityLabel="Test connection"
            onPress={() => void runTest()}
            style={settingsStyles.row}
          >
            <Icon name="wifi" size={18} color={colors.secondary} />
            <Text style={[settingsStyles.rowText, { color: colors.label }]}>
              Test connection
            </Text>
            <TestResult state={test} colors={colors} />
          </PressableRow>
        </Group>

        <SectionLabel text="Default model" colors={colors} />
        <Group colors={colors}>
          <PressableRow
            baseColor={colors.card}
            highlightColor={colors.separator}
            accessibilityRole="button"
            accessibilityLabel="Choose default model"
            onPress={() => router.push('/(tabs)/models')}
            style={settingsStyles.row}
          >
            <Icon name="cpu" size={18} color={colors.secondary} />
            <Text style={[settingsStyles.rowText, { color: colors.label }]} numberOfLines={1}>
              {model || 'Pick on the Models tab'}
            </Text>
            <Icon name="chevron.right" size={14} color={colors.tertiary} />
          </PressableRow>
        </Group>

        <SectionLabel text="Generation" colors={colors} />
        <Group colors={colors}>
          <View style={settingsStyles.row}>
            <Icon name="slider.horizontal.3" size={18} color={colors.secondary} />
            <Text style={[settingsStyles.rowText, { color: colors.label }]}>Temperature</Text>
            <Text style={[settingsStyles.value, tabularNums, { color: colors.secondary }]}>
              {temperature.toFixed(1)}
            </Text>
          </View>
          <Slider
            value={temperature}
            minimumValue={0}
            maximumValue={2}
            step={0.1}
            onValueChange={(v) => setTemperature(Math.round(v * 10) / 10)}
            onSlidingComplete={() => hapticTick()}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.separator}
            style={{ marginHorizontal: spacing.l + 30, marginBottom: spacing.m }}
            accessibilityLabel="Temperature"
          />
          <Hairline colors={colors} />
          <View style={settingsStyles.row}>
            <Icon name="bolt.fill" size={18} color={colors.secondary} />
            <Text style={[settingsStyles.rowText, { color: colors.label }]}>
              Stream replies
            </Text>
            <Switch
              value={streamEnabled}
              onValueChange={(v) => {
                hapticTick();
                setStreamEnabled(v);
              }}
              trackColor={{ false: colors.separator, true: colors.accent }}
            />
          </View>
        </Group>

        <SectionLabel text="Data" colors={colors} />
        <Group colors={colors}>
          <PressableRow
            baseColor={colors.card}
            highlightColor={colors.separator}
            accessibilityRole="button"
            accessibilityLabel="Delete all chats"
            onPress={confirmClear}
            style={settingsStyles.row}
          >
            <Icon name="trash" size={18} color={colors.danger} />
            <Text style={[settingsStyles.rowText, { color: colors.danger }]}>
              Delete all chats
            </Text>
          </PressableRow>
        </Group>

        <SectionLabel text="About" colors={colors} />
        <Group colors={colors}>
          <View style={settingsStyles.row}>
            <Text style={[settingsStyles.rowText, { color: colors.label }]}>Version</Text>
            <Text style={[settingsStyles.value, tabularNums, { color: colors.secondary }]}>
              {Constants.default.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
          <Hairline colors={colors} />
          <PressableRow
            baseColor={colors.card}
            highlightColor={colors.separator}
            accessibilityRole="link"
            accessibilityLabel="Design bar reference"
            onPress={() =>
              void Linking.openURL('https://github.com/Appllama/appllama-skills').catch(
                () => {},
              )
            }
            style={settingsStyles.row}
          >
            <Text style={[settingsStyles.rowText, { color: colors.label }]}>
              Built against the appllama design bar
            </Text>
            <Icon name="link" size={14} color={colors.tertiary} />
          </PressableRow>
        </Group>
      </ScrollView>
    </View>
  );
}

function TestResult({ state, colors }: { state: TestState; colors: ReturnType<typeof useThemeColors> }) {
  if (state.kind === 'idle') return null;
  if (state.kind === 'running') {
    return <Text style={[settingsStyles.value, { color: colors.secondary }]}>…</Text>;
  }
  if (state.kind === 'ok') {
    return (
      <View style={settingsStyles.testOk}>
        <Icon name="checkmark" size={13} color={colors.success} />
        <Text style={[settingsStyles.value, tabularNums, { color: colors.success }]}>
          {state.models} models · {formatMs(state.ms)}
        </Text>
      </View>
    );
  }
  return (
    <Text
      style={[settingsStyles.value, { color: colors.danger }]}
      numberOfLines={1}
      selectable
    >
      {state.error}
    </Text>
  );
}

function SectionLabel({ text, colors }: { text: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <Text
      style={[
        settingsStyles.sectionLabel,
        { color: colors.secondary },
      ]}
    >
      {text.toUpperCase()}
    </Text>
  );
}

function Group({ colors, children }: { colors: ReturnType<typeof useThemeColors>; children: React.ReactNode }) {
  return (
    <View style={[settingsStyles.group, continuous, { backgroundColor: colors.card }]}>
      {children}
    </View>
  );
}

function Hairline({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View
      style={{ height: 0.5, backgroundColor: colors.separator, marginLeft: 47 }}
    />
  );
}

const settingsStyles: Record<string, AnyStyle> = {
  sectionLabel: {
    fontSize: font.caption,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginHorizontal: spacing.l,
    marginTop: spacing.xl,
    marginBottom: spacing.s,
  },
  group: {
    borderRadius: radius.card,
    marginHorizontal: spacing.l,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    minHeight: 44,
  },
  inputRow: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    gap: spacing.xs,
  },
  fieldLabel: { fontSize: font.caption },
  input: { fontSize: font.callout, paddingVertical: 2 },
  rowText: {
    fontSize: font.callout,
    flex: 1,
  },
  value: { fontSize: font.footnote, flexShrink: 1, maxWidth: '55%' },
  testOk: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
};
