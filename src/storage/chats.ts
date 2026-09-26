import type { TelegramChat } from '../api/types';

function getStorageKey(botId: string) {
  return `telegram-messenger-chats:${botId}`;
}

export function getStoredChats(
  botId: string,
): TelegramChat[] {
  try {
    const value = localStorage.getItem(
      getStorageKey(botId),
    );

    if (!value) {
      return [];
    }

    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as TelegramChat[];
  } catch {
    return [];
  }
}

export function saveChat(
  botId: string,
  chat: TelegramChat,
) {
  const chats = getStoredChats(botId);

  const nextChats = new Map(
    chats.map((item) => [
      item.id,
      item,
    ]),
  );

  nextChats.set(chat.id, chat);

  localStorage.setItem(
    getStorageKey(botId),
    JSON.stringify(
      Array.from(nextChats.values()),
    ),
  );
}

export function saveChats(
  botId: string,
  chats: TelegramChat[],
) {
  const current =
    getStoredChats(botId);

  const merged = new Map(
    current.map((item) => [
      item.id,
      item,
    ]),
  );

  for (const chat of chats) {
    merged.set(chat.id, chat);
  }

  localStorage.setItem(
    getStorageKey(botId),
    JSON.stringify(
      Array.from(merged.values()),
    ),
  );
}

export function clearStoredChats(
  botId: string,
) {
  localStorage.removeItem(
    getStorageKey(botId),
  );
}