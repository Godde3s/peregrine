import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';

import { EmptyState, SkeletonRow } from '@/components/chat-ui';
import { PressableRow } from '@/components/pressable';
import { Symbol } from '@/components/symbol';
import { listModels, type ModelInfo } from '@/lib/api';
import { getApiKey } from '@/lib/storage';
import { useSettings } from '@/lib/store';
import { continuous, font, radius, spacing, useThemeColors , AnyStyle } from '@/lib/theme';

/**
 * Models — server state in TanStack Query (caching, retry, pull-to-refresh),
 * skeletons that match the final layout's shape, inline errors with retry.
 */
export default function ModelsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  // expo-router syncs the native search bar text into the `q` route param.
  const query = typeof params.q === 'string' ? params.q : '';
  const baseUrl = useSettings((s) => s.baseUrl);

  const modelsQuery = useQuery({
    queryKey: ['models', baseUrl],
    queryFn: async () => listModels(baseUrl, await getApiKey()),
  });

  const models = modelsQuery.data ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      needle
        ? models.filter(
            (m) =>
              m.id.toLowerCase().includes(needle) ||
              (m.ownedBy ?? '').toLowerCase().includes(needle),
          )
        : models,
    [models, needle],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Search models',
            hideWhenScrolling: false,
          },
        }}
      />
      {modelsQuery.isPending ? (
        <View>
          {Array.from({ length: 7 }, (_, i) => (
            <SkeletonRow key={i} colors={colors} />
          ))}
        </View>
      ) : modelsQuery.isError ? (
        <ErrorCard
          message={
            modelsQuery.error instanceof Error
              ? modelsQuery.error.message
              : 'Could not load models'
          }
          colors={colors}
          onRetry={() => void modelsQuery.refetch()}
        />
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ModelRow
              model={item}
              colors={colors}
              onPress={() =>
                router.push({
                  pathname: '/model/[id]',
                  params: { id: encodeURIComponent(item.id) },
                })
              }
            />
          )}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={modelsQuery.isRefetching}
              onRefresh={() => void modelsQuery.refetch()}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="cpu"
              title={needle ? 'No matches' : 'No models reported'}
              message={
                needle
                  ? 'Try a different search term.'
                  : 'The endpoint replied without a model list. Check it in Settings.'
              }
              colors={colors}
            />
          }
        />
      )}
    </View>
  );
}

function ModelRow({
  model,
  colors,
  onPress,
}: {
  model: ModelInfo;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  return (
    <PressableRow
      baseColor={colors.bg}
      highlightColor={colors.separator}
      accessibilityRole="button"
      accessibilityLabel={`Model ${model.id}`}
      onPress={onPress}
      style={rowStyles.row}
    >
      <View style={rowStyles.textWrap}>
        <Text numberOfLines={1} style={[rowStyles.title, { color: colors.label }]}>
          {model.id}
        </Text>
        <Text numberOfLines={1} style={[rowStyles.caption, { color: colors.secondary }]}>
          {model.ownedBy || 'unknown owner'}
        </Text>
      </View>
      <Symbol name="chevron.right" size={15} color={colors.tertiary} />
    </PressableRow>
  );
}

function ErrorCard({
  message,
  colors,
  onRetry,
}: {
  message: string;
  colors: ReturnType<typeof useThemeColors>;
  onRetry: () => void;
}) {
  return (
    <View
      style={[cardStyles.card, continuous, { backgroundColor: colors.card }]}
    >
      <View style={cardStyles.errorRow}>
        <Symbol name="wifi.exclamationmark" size={18} color={colors.danger} />
        <Text style={[cardStyles.errorText, { color: colors.label }]} selectable>
          {message}
        </Text>
      </View>
      <PressableRow
        baseColor={colors.card}
        highlightColor={colors.separator}
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={onRetry}
        style={cardStyles.retry}
      >
        <Symbol name="arrow.clockwise" size={15} color={colors.accent} />
        <Text style={[cardStyles.retryText, { color: colors.accent }]}>Retry</Text>
      </PressableRow>
    </View>
  );
}

const rowStyles: Record<string, AnyStyle> = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  textWrap: { flex: 1, gap: 3 },
  title: { fontSize: font.callout, fontWeight: '500' },
  caption: { fontSize: font.footnote },
};

const cardStyles: Record<string, AnyStyle> = {
  card: {
    borderRadius: radius.card,
    marginHorizontal: spacing.l,
    marginTop: spacing.l,
    padding: spacing.l,
    gap: spacing.m,
  },
  errorRow: { flexDirection: 'row', gap: spacing.s, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: font.footnote, lineHeight: 18 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.s,
  },
  retryText: { fontSize: font.callout, fontWeight: '500' },
};
