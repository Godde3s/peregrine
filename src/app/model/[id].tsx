import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { PressableScale } from '@/components/pressable';
import { Icon } from '@/components/symbol';
import { hapticTap } from '@/lib/haptics';
import { formatDate } from '@/lib/format';
import { useChat, useSettings } from '@/lib/store';
import { continuous, font, radius, spacing, useThemeColors , AnyStyle } from '@/lib/theme';
import type { ModelInfo } from '@/lib/api';

/**
 * Model detail — a plain push (navigation law 1: the user may come back to
 * the list, so the entry stays on the stack).
 */
export default function ModelDetail() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const rawId = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';
  const queryClient = useQueryClient();

  const baseUrl = useSettings((s) => s.baseUrl);
  const setModel = useSettings((s) => s.setModel);
  const createConversation = useChat((s) => s.createConversation);

  const model = queryClient
    .getQueriesData<ModelInfo[]>({ queryKey: ['models'] })
    .flatMap(([, data]) => data ?? [])
    .find((m) => m.id === rawId);

  if (!rawId) return null;

  const startChat = () => {
    hapticTap();
    setModel(rawId);
    const conversation = createConversation(rawId);
    router.push({ pathname: '/chat/[id]', params: { id: conversation.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: model ? rawId : 'Model' }} />
      <View style={[detailStyles.card, continuous, { backgroundColor: colors.card }]}>
        <Text style={[detailStyles.name, { color: colors.label }]} selectable>
          {rawId}
        </Text>
        <DetailRow label="Owner" value={model?.ownedBy ?? '—'} colors={colors} />
        <DetailRow label="Added" value={formatDate(model?.created)} colors={colors} />
        <DetailRow label="Endpoint" value={baseUrl} colors={colors} />
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Start a chat with ${rawId}`}
        onPress={startChat}
        style={[detailStyles.cta, continuous, { backgroundColor: colors.accent }]}
      >
        <Icon name="text.bubble.fill" size={17} color={colors.onAccent} />
        <Text style={[detailStyles.ctaText, { color: colors.onAccent }]}>
          Start chat
        </Text>
      </PressableScale>
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={[detailStyles.rowLabel, { color: colors.secondary }]}>{label}</Text>
      <Text style={[detailStyles.rowValue, { color: colors.label }]} selectable>
        {value}
      </Text>
    </View>
  );
}

const detailStyles: Record<string, AnyStyle> = {
  card: {
    borderRadius: radius.card,
    margin: spacing.l,
    padding: spacing.l,
    gap: spacing.m,
  },
  name: {
    fontSize: font.title,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.l,
  },
  rowLabel: { fontSize: font.footnote, flexShrink: 0 },
  rowValue: {
    fontSize: font.footnote,
    textAlign: 'right',
    flexShrink: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: radius.pill,
    marginHorizontal: spacing.l,
    paddingVertical: spacing.l - 2,
  },
  ctaText: { fontSize: font.headline, fontWeight: '600' },
};
