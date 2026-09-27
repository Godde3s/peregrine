import { useRef, useState } from 'react';
import { Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable';
import { Icon } from '@/components/symbol';
import { hapticTap } from '@/lib/haptics';
import { continuous, font, radius, spacing, type ThemeColors , AnyStyle } from '@/lib/theme';

/**
 * The composer is an UNCONTROLLED input (state architecture): value lives in
 * a ref, React state only tracks the cheap hasText boolean. Keystrokes never
 * re-render the conversation list.
 */
export function Composer({
  colors,
  streaming,
  onSend,
  onStop,
}: {
  colors: ThemeColors;
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef('');
  const [hasText, setHasText] = useState(false);
  const scale = useSharedValue(1);

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const submit = () => {
    const text = valueRef.current.trim();
    if (!text || streaming) return;
    valueRef.current = '';
    setHasText(false);
    inputRef.current?.clear();
    hapticTap();
    onSend(text);
  };

  return (
    <View style={[composerStyles.bar, { backgroundColor: colors.keyboardBar, borderTopColor: colors.separator }]}>
      <View
        style={[
          composerStyles.fieldRow,
          continuous,
          { backgroundColor: colors.card, borderRadius: radius.input },
        ]}
      >
        <TextInput
          ref={inputRef}
          defaultValue=""
          multiline
          placeholder="Message"
          placeholderTextColor={colors.tertiary}
          onChangeText={(text) => {
            valueRef.current = text;
            setHasText(text.trim().length > 0);
          }}
          onSubmitEditing={submit}
          returnKeyType="send"
          blurOnSubmit={false}
          style={[composerStyles.input, { color: colors.label }]}
          accessibilityLabel="Message input"
        />
        {streaming ? (
          <StopButton colors={colors} onStop={onStop} />
        ) : hasText ? (
          <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(90)}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Send message"
              onPress={submit}
              onPressIn={() => {
                scale.value = withSpring(0.94, { duration: 120, dampingRatio: 1 });
              }}
              onPressOut={() => {
                scale.value = withSpring(1, { duration: 300, dampingRatio: 1 });
              }}
              style={[composerStyles.send, { backgroundColor: colors.accent }]}
            >
              <Icon name="arrow.up" size={19} color={colors.onAccent} weight="semibold" />
            </PressableScale>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function StopButton({ colors, onStop }: { colors: ThemeColors; onStop: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Stop generating"
      onPress={() => {
        hapticTap();
        onStop();
      }}
      style={[composerStyles.send, composerStyles.stop, { borderColor: colors.secondary }]}
    >
      <Icon name="stop.fill" size={15} color={colors.secondary} />
    </PressableScale>
  );
}

const composerStyles: Record<string, AnyStyle> = {
  bar: {
    borderTopWidth: 0.5,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    paddingBottom: spacing.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: font.body,
    maxHeight: 120,
    paddingTop: spacing.m - 2,
    paddingBottom: spacing.m,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  stop: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
};
