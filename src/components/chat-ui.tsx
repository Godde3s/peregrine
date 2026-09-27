import { useEffect } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/symbol';
import { continuous, font, radius, spacing, type ThemeColors , AnyStyle } from '@/lib/theme';

/* ------------------------------ streaming dots ------------------------------ */

function usePulse(minOpacity: number, durationMs: number): SharedValue<number> {
  const pulse = useSharedValue(minOpacity);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse, minOpacity, durationMs]);
  return pulse;
}

export function TypingDots({ color }: { color: string }) {
  const pulse = usePulse(0.3, 420);

  return (
    <View style={dotStyles.row} accessibilityLabel="Assistant is thinking">
      {[0, 1, 2].map((i) => (
        <PulsingDot key={i} pulse={pulse} lead={i === 0} color={color} />
      ))}
    </View>
  );
}

function PulsingDot({
  pulse,
  lead,
  color,
}: {
  pulse: SharedValue<number>;
  lead: boolean;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: radius.pill,
          backgroundColor: color,
          marginLeft: lead ? 0 : 5,
        },
        style,
      ]}
    />
  );
}

/* -------------------------------- chat bubble -------------------------------- */

export function ChatBubble({
  role,
  content,
  streaming,
  error,
  colors,
}: {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  error?: string;
  colors: ThemeColors;
}) {
  const isUser = role === 'user';
  const bubbleColor = isUser ? colors.userBubble : colors.assistantBubble;
  const textColor = isUser ? colors.onAccent : colors.label;
  const empty = content.length === 0;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={[
        bubbleStyles.shell,
        continuous,
        {
          backgroundColor: bubbleColor,
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '84%',
        },
      ]}
    >
      {empty && streaming ? (
        <TypingDots color={isUser ? colors.onAccent : colors.secondary} />
      ) : (
        <Text
          selectable
          style={{ color: textColor, fontSize: font.body, lineHeight: 23 }}
        >
          {content}
        </Text>
      )}
      {error ? (
        <View style={bubbleStyles.errorRow}>
          <Icon name="exclamationmark.triangle" size={13} color={colors.danger} />
          <Text
            style={{ color: colors.danger, fontSize: font.footnote, flex: 1 }}
            selectable
          >
            {error}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

/* ------------------------------- skeleton row -------------------------------- */

function SkeletonBlock({
  pulse,
  color,
  style,
}: {
  pulse: SharedValue<number>;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const animated = useAnimatedStyle(() => ({
    opacity: pulse.value,
    backgroundColor: color,
  }));
  return <Animated.View style={[{ borderRadius: 6 }, animated, style]} />;
}

export function SkeletonRow({ colors }: { colors: ThemeColors }) {
  const pulse = usePulse(0.45, 650);

  return (
    <View
      style={[
        skeletonStyles.row,
        { borderBottomColor: colors.separator },
      ]}
    >
      <SkeletonBlock
        pulse={pulse}
        color={colors.tertiary}
        style={{ width: 36, height: 36, borderRadius: radius.pill }}
      />
      <View style={skeletonStyles.lines}>
        <SkeletonBlock pulse={pulse} color={colors.tertiary} style={{ width: '58%', height: 13 }} />
        <SkeletonBlock pulse={pulse} color={colors.tertiary} style={{ width: '36%', height: 11 }} />
      </View>
    </View>
  );
}

/* ------------------------------- empty state --------------------------------- */

export function EmptyState({
  icon,
  title,
  message,
  colors,
}: {
  icon: IconName;
  title: string;
  message: string;
  colors: ThemeColors;
}) {
  return (
    <View style={emptyStyles.wrap}>
      <View
        style={[emptyStyles.iconWrap, continuous, { backgroundColor: colors.accentSoft }]}
      >
        <Icon name={icon} size={26} color={colors.accent} weight="medium" />
      </View>
      <Text style={[emptyStyles.title, { color: colors.label }]}>{title}</Text>
      <Text style={[emptyStyles.message, { color: colors.secondary }]}>{message}</Text>
    </View>
  );
}

/* --------------------------------- styles ------------------------------------ */

const bubbleStyles: Record<string, AnyStyle> = {
  shell: {
    borderRadius: radius.card,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    marginHorizontal: spacing.l,
    marginVertical: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
  },
};

const dotStyles: Record<string, AnyStyle> = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
};

const skeletonStyles: Record<string, AnyStyle> = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 0.5,
  },
  lines: {
    flex: 1,
    gap: spacing.s,
  },
};

const emptyStyles: Record<string, AnyStyle> = {
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    gap: spacing.s,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  title: {
    fontSize: font.headline,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: font.footnote,
    textAlign: 'center',
    lineHeight: 18,
  },
};
