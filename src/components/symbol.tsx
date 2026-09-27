import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, type StyleProp, type TextProps, type TextStyle } from 'react-native';

/**
 * Fidelity law 3 — SF Symbols on iOS (inherit weight + optical size),
 * Material-family icons on Android. One family per platform, never mixed.
 */
export type SFSymbolName =
  | 'message'
  | 'message.fill'
  | 'cpu'
  | 'cpu.fill'
  | 'gearshape'
  | 'gearshape.fill'
  | 'chevron.right'
  | 'plus'
  | 'arrow.up'
  | 'stop.fill'
  | 'trash'
  | 'xmark'
  | 'checkmark'
  | 'wifi'
  | 'wifi.exclamationmark'
  | 'lock.fill'
  | 'link'
  | 'key.fill'
  | 'exclamationmark.triangle'
  | 'bolt.fill'
  | 'slider.horizontal.3'
  | 'arrow.clockwise'
  | 'ellipsis'
  | 'text.bubble'
  | 'text.bubble.fill';

const ANDROID_MAP: Partial<Record<SFSymbolName, keyof typeof Ionicons.glyphMap>> = {
  message: 'chatbubble-outline',
  'message.fill': 'chatbubble',
  cpu: 'hardware-chip-outline',
  'cpu.fill': 'hardware-chip',
  gearshape: 'settings-outline',
  'gearshape.fill': 'settings',
  'chevron.right': 'chevron-forward',
  plus: 'add',
  'arrow.up': 'arrow-up',
  'stop.fill': 'stop',
  trash: 'trash-outline',
  xmark: 'close',
  checkmark: 'checkmark',
  wifi: 'wifi-outline',
  'wifi.exclamationmark': 'cloud-offline-outline',
  'lock.fill': 'lock-closed',
  link: 'link-outline',
  'key.fill': 'key',
  'exclamationmark.triangle': 'warning-outline',
  'bolt.fill': 'flash',
  'slider.horizontal.3': 'options-outline',
  'arrow.clockwise': 'refresh',
  ellipsis: 'ellipsis-horizontal',
  'text.bubble': 'chatbox-outline',
  'text.bubble.fill': 'chatbox',
};

const IOS_WEIGHT = {
  regular: 'regular',
  medium: 'medium',
  semibold: 'semibold',
  bold: 'bold',
} as const;

export function Symbol({
  name,
  size = 20,
  color,
  weight = 'regular',
}: {
  name: SFSymbolName;
  size?: number;
  color: string;
  weight?: keyof typeof IOS_WEIGHT;
}) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name as SymbolViewProps['name']}
        size={size}
        tintColor={color}
        weight={IOS_WEIGHT[weight]}
      />
    );
  }
  const glyph = ANDROID_MAP[name] ?? 'ellipse-outline';
  return <Ionicons name={glyph} size={size} color={color} />;
}

export type IconName = SFSymbolName;

export function symbolTextStyle(name: IconName): StyleProp<TextProps> | undefined {
  void name;
  return undefined;
}

export type { TextStyle };
