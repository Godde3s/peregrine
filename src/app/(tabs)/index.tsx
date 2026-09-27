import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Alert, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { EmptyState } from '@/components/chat-ui';
import { PressableRow, PressableScale } from '@/components/pressable';
import { Symbol } from '@/components/symbol';
import { hapticWarn } from '@/lib/haptics';
import { formatTimestamp } from '@/lib/format';
import { useChat, useSettings, type Conversation } from '@/lib/store';
import { font, spacing, useThemeColors , AnyStyle } from '@/lib/theme';

/**
 * Conversations — FlashList from row one (perceived performance), native
 * large title, rows that highlight (never scale), destructive delete behind
 * a native confirm.
 */
export default function ChatsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const query = typeof params.q === 'string' ? params.q.toLowerCase() : '';

  const conversations = useChat((s) => s.conversations);
  const messages = useChat((s) => s.messages);
  const deleteConversation = useChat((s) => s.deleteConversation);
  const createConversation = useChat((s) => s.createConversation);
  const model = useSettings((s) => s.model);

  const sorted = useMemo(
    () =>
      [...conversations]
        .filter((c) => !query || c.title.toLowerCase().includes(query))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations, query],
  );

  const startNewChat = useCallback(() => {
    if (!model) {
      router.push('/(tabs)/models');
      return;
    }
    const conversation = createConversation(model);
    router.push({ pathname: '/chat/[id]', params: { id: conversation.id } });
  }, [createConversation, model, router]);

  const confirmDelete = useCallback(
    (conversation: Conversation) => {
      hapticWarn();
      Alert.alert('Delete chat?', `“${conversation.title}” will be removed.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ]);
    },
    [deleteConversation],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerRight: () => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="New chat"
              onPress={startNewChat}
              hitSlop={12}
              style={{ padding: spacing.xs }}
            >
              <Symbol name="plus" size={26} color={colors.accent} />
            </PressableScale>
          ),
        }}
      />
      <FlashList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            preview={lastPreview(messages[item.id])}
            colors={colors}
            onPress={() =>
              router.push({ pathname: '/chat/[id]', params: { id: item.id } })
            }
            onLongPress={() => confirmDelete(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          <EmptyState
            icon="text.bubble"
            title={query ? 'No matches' : 'No conversations yet'}
            message={
              query
                ? 'Try a different search term.'
                : 'Open the Models tab, pick a model, and send your first message.'
            }
            colors={colors}
          />
        }
      />
    </View>
  );
}

function lastPreview(list: ReturnType<typeof useChat.getState>['messages'][string]): string {
  const last = list?.[list.length - 1];
  if (!last || last.content.trim().length === 0) return '';
  return last.content.trim().split('\n')[0] ?? '';
}

function ConversationRow({
  conversation,
  preview,
  colors,
  onPress,
  onLongPress,
}: {
  conversation: Conversation;
  preview: string;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <PressableRow
      baseColor={colors.bg}
      highlightColor={colors.separator}
      accessibilityRole="button"
      accessibilityLabel={`Chat: ${conversation.title}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={rowStyles.row}
    >
      <View style={rowStyles.textWrap}>
        <Text numberOfLines={1} style={[rowStyles.title, { color: colors.label }]}>
          {conversation.title}
        </Text>
        <Text numberOfLines={1} style={[rowStyles.caption, { color: colors.secondary }]}>
          {[conversation.model, preview || formatTimestamp(conversation.updatedAt)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Symbol name="chevron.right" size={15} color={colors.tertiary} />
    </PressableRow>
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
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: font.headline,
    fontWeight: '500',
  },
  caption: {
    fontSize: font.footnote,
  },
};


