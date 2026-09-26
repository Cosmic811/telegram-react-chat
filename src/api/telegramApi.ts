import type {
  TelegramChat,
  TelegramMessage,
  TelegramResponse,
  TelegramUpdate,
  TelegramUser,
} from './types';

function getBaseUrl(token: string) {
  return `https://api.telegram.org/bot${token}`;
}

async function request<T>(
  token: string,
  method: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${getBaseUrl(token)}/${method}`,
    init,
  );

  const data =
    (await response.json()) as TelegramResponse<T>;

  if (
    !response.ok ||
    !data.ok ||
    data.result === undefined
  ) {
    throw new Error(
      data.description ??
        'Telegram API request failed.',
    );
  }

  return data.result;
}

export function getMe(token: string) {
  return request<TelegramUser>(
    token,
    'getMe',
  );
}

export function sendMessage(
  token: string,
  chatId: string,
  text: string,
) {
  return request<TelegramMessage>(
    token,
    'sendMessage',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    },
  );
}

export function getUpdates(
  token: string,
  offset?: number,
  signal?: AbortSignal,
  timeout = 20,
) {
  const params =
    new URLSearchParams();

  if (offset !== undefined) {
    params.set(
      'offset',
      String(offset),
    );
  }

  params.set(
    'timeout',
    String(timeout),
  );

  params.set(
    'allowed_updates',
    JSON.stringify(['message']),
  );

  return request<TelegramUpdate[]>(
    token,
    `getUpdates?${params.toString()}`,
    {
      signal,
    },
  );
}

export async function getAvailableChats(
  token: string,
): Promise<TelegramChat[]> {
  const updates =
    await getUpdates(
      token,
      undefined,
      undefined,
      0,
    );

  const chats =
    new Map<number, TelegramChat>();

  for (const update of updates) {
    const chat =
      update.message?.chat;

    if (!chat) {
      continue;
    }

    chats.set(
      chat.id,
      chat,
    );
  }

  return Array.from(
    chats.values(),
  );
}