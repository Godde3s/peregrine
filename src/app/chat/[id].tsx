import { Stack, useLocalSearchParams, Redirect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

import { ChatBubble, EmptyState } from '@/components/chat-ui';
import { Composer } from '@/components/composer';
import { chatComplete, streamChat, type ChatTurn } from '@/lib/api';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { getApiKey } from '@/lib/storage';
import { newId, useChat, useSettings, type ChatMessage } from '@/lib/store';
import { spacing, useThemeColors } from '@/lib/theme';

/**
 * The thread — server events stream into an optimistic message list;
 * the keyboard tracks via react-native-keyboard-controller (never a
 * listener + guessed duration). All keyboard motion runs on the UI thread.
 */
export default function ChatThread() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const conversation = useChat((s) => s.conversations.find((c) => c.id === id));
  const messages = useChat((s) => (id ? s.messages[id] : undefined)) ?? [];
  const appendMessage = useChat((s) => s.appendMessage);
  const patchMessage = useChat((s) => s.patchMessage);
  const baseUrl = useSettings((s) => s.baseUrl);
  const model = useSettings((s) => s.model);
  const conversationModel = conversation?.model ?? model;
  const temperature = useSettings((s) => s.temperature);
  const streamEnabled = useSettings((s) => s.streamEnabled);

  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const listWrapStyle = useAnimatedStyle(() => ({
    paddingBottom: -keyboardHeight.value,
  }));
  const composerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

  const send = useCallback(
    async (text: string) => {
      if (!id || streaming) return;
      appendMessage(id, {
        id: newId(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      });

      // History snapshot BEFORE the assistant placeholder lands.
      const history: ChatTurn[] = [
        ...(useChat.getState().messages[id] ?? []),
      ]
        .filter((m) => !m.error && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantId = newId();
      appendMessage(id, {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        model: conversationModel,
        streaming: true,
      });

      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);
      const startedAt = Date.now();
      let acc = '';

      const apiKey = await getApiKey();
      try {
        if (streamEnabled) {
          for await (const delta of streamChat({
            baseUrl,
            apiKey,
            model: conversationModel,
            messages: history,
            temperature,
            signal: controller.signal,
          })) {
            acc += delta;
            patchMessage(id, assistantId, { content: acc });
          }
        } else {
          acc = await chatComplete({
            baseUrl,
            apiKey,
            model: conversationModel,
            messages: history,
            temperature,
            signal: controller.signal,
          });
          patchMessage(id, assistantId, { content: acc });
        }
        patchMessage(id, assistantId, {
          streaming: false,
          elapsedMs: Date.now() - startedAt,
        });
        hapticSuccess();
      } catch (error) {
        const aborted =
          error instanceof DOMException && error.name === 'AbortError';
        if (aborted) {
          patchMessage(id, assistantId, {
            streaming: false,
            content: acc || '',
            elapsedMs: Date.now() - startedAt,
          });
        } else {
          patchMessage(id, assistantId, {
            streaming: false,
            content: acc,
            error:
              error instanceof Error ? error.message : 'The request failed',
          });
          hapticError();
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [
      appendMessage,
      baseUrl,
      conversationModel,
      id,
      patchMessage,
      streaming,
      streamEnabled,
      temperature,
    ],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  if (!conversation) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: conversation.title,
          headerBackTitle: 'Chats',
        }}
      />
      <Animated.View style={[{ flex: 1 }, listWrapStyle]}>
        {/*
         * FlashList v2 has no `inverted` prop — classic manual inversion:
         * flip the list, flip every row. Newest message sits at the bottom,
         * right above the composer.
         */}
        <View style={{ flex: 1, transform: [{ scaleY: -1 }] }}>
          <FlashList
            data={reversed}
            keyExtractor={(item: ChatMessage) => item.id}
            renderItem={({ item }) => (
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <ChatBubble
                  role={item.role}
                  content={item.content}
                  streaming={item.streaming}
                  error={item.error}
                  colors={colors}
                />
              </View>
            )}
            contentContainerStyle={{ paddingVertical: spacing.l }}
            contentInsetAdjustmentBehavior="automatic"
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <EmptyState
                  icon="bolt.fill"
                  title={`Talking to ${conversationModel || '…'}`}
                  message="Say hello — replies stream in token by token, right on device time."
                  colors={colors}
                />
              </View>
            }
          />
        </View>
      </Animated.View>
      <Animated.View style={composerStyle}>
        <Composer
          colors={colors}
          streaming={streaming}
          onSend={(text) => void send(text)}
          onStop={stop}
        />
        <HomeIndicatorPad colors={colors} />
      </Animated.View>
    </View>
  );
}

/**
 * The composer translates with the keyboard; without it (keyboard closed)
 * it must still clear the home indicator (fidelity law 8).
 */
function HomeIndicatorPad({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return <View style={{ height: spacing.m, backgroundColor: colors.keyboardBar }} />;
}
