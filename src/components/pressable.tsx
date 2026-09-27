import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from 'react-native-reanimated';

import { PRESS_IN_MS, PRESS_SCALE, SPRING_SNAP, EASE_OUT } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Press feedback lands on press-in (motion laws): scale 0.97 + spring back
 * on release for buttons and cards. Reduce Motion collapses it to opacity.
 */
export function PressableScale({
  style,
  pressedOpacity = 1,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle>; pressedOpacity?: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const animated = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        opacity: 1 - progress.value * (1 - pressedOpacity),
      };
    }
    return {
      transform: [{ scale: 1 - progress.value * (1 - PRESS_SCALE) }],
    };
  });

  return (
    <AnimatedPressable
      onPressIn={() => {
        progress.value = withTiming(1, { duration: PRESS_IN_MS, easing: EASE_OUT });
      }}
      onPressOut={() => {
        progress.value = reduceMotion
          ? withTiming(0, { duration: PRESS_IN_MS, easing: Easing.out(Easing.quad) })
          : withSpring(0, SPRING_SNAP);
      }}
      style={[animated, style]}
      {...props}
    />
  );
}

/**
 * List rows highlight — a background change, never a scale (motion laws).
 * Color interpolation runs on the UI thread.
 */
export function PressableRow({
  baseColor,
  highlightColor,
  style,
  ...props
}: PressableProps & {
  baseColor: string;
  highlightColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      [baseColor, highlightColor],
    ),
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 140 });
      }}
      style={[animated, style]}
      {...props}
    />
  );
}
