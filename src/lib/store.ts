import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kv, loadJSON, saveJSON } from './storage';

/**
 * State architecture (skill): client state in a small atomic store, server
 * state in TanStack Query, ephemeral UI state local to components.
 * Two narrow stores instead of one broad context — changes re-render only
 * their consumers.
 */

export type Role = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  model?: string;
  streaming?: boolean;
  error?: string;
  elapsedMs?: number;
};

export type Conversation = {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
};

export const newId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ---------------------------------- settings --------------------------------- */

type SettingsState = {
  baseUrl: string;
  model: string;
  temperature: number;
  streamEnabled: boolean;
  hydrated: boolean;
  setEndpoint: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setStreamEnabled: (enabled: boolean) => void;
  setHydrated: () => void;
};

const SETTINGS_KEY = 'settings.v1';

export const useSettings = create<SettingsState>()((set) => ({
  ...(loadJSON<{
    baseUrl: string;
    model: string;
    temperature: number;
    streamEnabled: boolean;
  }>(SETTINGS_KEY, { baseUrl: '', model: '', temperature: 0.7, streamEnabled: true }) ?? {
    baseUrl: '',
    model: '',
    temperature: 0.7,
    streamEnabled: true,
  }),
  hydrated: false,
  setEndpoint: (baseUrl) => {
    set({ baseUrl });
    saveJSON(SETTINGS_KEY, {
      baseUrl,
      model: useSettings.getState().model,
      temperature: useSettings.getState().temperature,
      streamEnabled: useSettings.getState().streamEnabled,
    });
  },
  setModel: (model) => {
    set({ model });
    saveJSON(SETTINGS_KEY, {
      baseUrl: useSettings.getState().baseUrl,
      model,
      temperature: useSettings.getState().temperature,
      streamEnabled: useSettings.getState().streamEnabled,
    });
  },
  setTemperature: (temperature) => {
    set({ temperature });
    saveJSON(SETTINGS_KEY, {
      baseUrl: useSettings.getState().baseUrl,
      model: useSettings.getState().model,
      temperature,
      streamEnabled: useSettings.getState().streamEnabled,
    });
  },
  setStreamEnabled: (streamEnabled) => {
    set({ streamEnabled });
    saveJSON(SETTINGS_KEY, {
      baseUrl: useSettings.getState().baseUrl,
      model: useSettings.getState().model,
      temperature: useSettings.getState().temperature,
      streamEnabled,
    });
  },
  setHydrated: () => set({ hydrated: true }),
}));

export const endpointReady = (state: Pick<SettingsState, 'baseUrl'>): boolean =>
  state.baseUrl.trim().length > 0;

/* ----------------------------------- chat ----------------------------------- */

type ChatState = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  createConversation: (model: string) => Conversation;
  deleteConversation: (id: string) => void;
  clearConversations: () => void;
  renameConversation: (id: string, title: string) => void;
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  patchMessage: (
    conversationId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) => void;
};

const CONVERSATIONS_KEY = 'conversations.v1';
const MESSAGES_KEY = 'messages.v1';

function persistChat(conversations: Conversation[], messages: Record<string, ChatMessage[]>): void {
  saveJSON(CONVERSATIONS_KEY, conversations);
  // Keep only the latest 40 conversations' transcripts on disk.
  const keep = new Set(conversations.slice(0, 40).map((c) => c.id));
  const trimmed: Record<string, ChatMessage[]> = {};
  for (const [id, list] of Object.entries(messages)) {
    if (keep.has(id)) trimmed[id] = list;
  }
  saveJSON(MESSAGES_KEY, trimmed);
}

export const useChat = create<ChatState>()((set, get) => ({
  conversations: loadJSON<Conversation[]>(CONVERSATIONS_KEY, []),
  messages: loadJSON<Record<string, ChatMessage[]>>(MESSAGES_KEY, {}),
  createConversation: (model) => {
    const conversation: Conversation = {
      id: newId(),
      title: 'New chat',
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      messages: { ...state.messages, [conversation.id]: [] },
    }));
    persistChat(get().conversations, get().messages);
    return conversation;
  },
  deleteConversation: (id) => {
    set((state) => {
      const messages = { ...state.messages };
      delete messages[id];
      return {
        conversations: state.conversations.filter((c) => c.id !== id),
        messages,
      };
    });
    persistChat(get().conversations, get().messages);
  },
  clearConversations: () => {
    set({ conversations: [], messages: {} });
    persistChat([], {});
  },
  renameConversation: (id, title) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title: title || c.title } : c,
      ),
    }));
    persistChat(get().conversations, get().messages);
  },
  appendMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), message],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, updatedAt: Date.now(), title: deriveTitle(c, message) }
          : c,
      ),
    }));
    persistChat(get().conversations, get().messages);
  },
  patchMessage: (conversationId, messageId, patch) => {
    set((state) => {
      const list = state.messages[conversationId] ?? [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: list.map((m) =>
            m.id === messageId ? { ...m, ...patch } : m,
          ),
        },
      };
    });
    if (patch.streaming === false) {
      persistChat(get().conversations, get().messages);
    }
  },
}));

function deriveTitle(conversation: Conversation, message: ChatMessage): string {
  if (conversation.title !== 'New chat' || message.role !== 'user') {
    return conversation.title;
  }
  const firstLine = message.content.trim().split('\n')[0] ?? '';
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine || conversation.title;
}
