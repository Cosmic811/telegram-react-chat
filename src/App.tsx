import {
  useEffect,
  useState,
} from 'react';

import {
  getAvailableChats,
  getMe,
} from './api/telegramApi';

import type {
  TelegramChat,
  TelegramUser,
} from './api/types';

import {
  ChatWindow,
} from './components/ChatWindow';

const TOKEN_STORAGE_KEY =
  'telegram-messenger-token';

const ACTIVE_CHAT_STORAGE_KEY =
  'telegram-messenger-active-chat';

function getChatsStorageKey(
  botId: number,
) {
  return `telegram-messenger-chats:${botId}`;
}

function getChatName(
  chat: TelegramChat,
) {
  if (chat.username) {
    return `@${chat.username}`;
  }

  if (chat.first_name) {
    return chat.first_name;
  }

  return `Chat ${chat.id}`;
}

function readStoredChats(
  botId: number,
): TelegramChat[] {
  try {
    const raw =
      localStorage.getItem(
        getChatsStorageKey(botId),
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as TelegramChat[])
      : [];
  } catch {
    return [];
  }
}

function App() {
  const [token, setToken] =
    useState('');

  const [bot, setBot] =
    useState<TelegramUser | null>(
      null,
    );

  const [
    activeChat,
    setActiveChat,
  ] =
    useState<TelegramChat | null>(
      null,
    );

  const [
    availableChats,
    setAvailableChats,
  ] = useState<TelegramChat[]>([]);

  const [
    isConnecting,
    setIsConnecting,
  ] = useState(false);

  const [
    isRestoring,
    setIsRestoring,
  ] = useState(true);

  const [
    isLoadingChats,
    setIsLoadingChats,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadChats(
  currentToken: string,
  currentBot: TelegramUser,
) {
  setIsLoadingChats(true);
  setError(null);

  try {
    const stored =
      readStoredChats(
        currentBot.id,
      );

    const discovered =
      await getAvailableChats(
        currentToken,
      );

    const chats =
      new Map<
        number,
        TelegramChat
      >();

    for (const chat of stored) {
      chats.set(
        chat.id,
        chat,
      );
    }

    for (const chat of discovered) {
      chats.set(
        chat.id,
        chat,
      );
    }

    const result =
      Array.from(
        chats.values(),
      );

    setAvailableChats(result);

    localStorage.setItem(
      getChatsStorageKey(
        currentBot.id,
      ),
      JSON.stringify(result),
    );
  } catch (loadError) {
    setError(
      loadError instanceof Error
        ? loadError.message
        : 'Could not load Telegram chats.',
    );
  } finally {
    setIsLoadingChats(false);
  }
}

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedToken =
        localStorage.getItem(
          TOKEN_STORAGE_KEY,
        );

      if (!storedToken) {
        setIsRestoring(false);

        return;
      }

      try {
        const botData =
          await getMe(
            storedToken,
          );

        if (cancelled) {
          return;
        }

        setToken(
          storedToken,
        );

        setBot(
          botData,
        );

        const storedChats =
          readStoredChats(
            botData.id,
          );

        setAvailableChats(
          storedChats,
        );

        const rawActiveChat =
          localStorage.getItem(
            ACTIVE_CHAT_STORAGE_KEY,
          );

        if (rawActiveChat) {
          try {
            const parsed =
              JSON.parse(
                rawActiveChat,
              ) as {
                botId: number;
                chat: TelegramChat;
              };

            if (
              parsed.botId ===
              botData.id
            ) {
              setActiveChat(
                parsed.chat,
              );
            }
          } catch {
            localStorage.removeItem(
              ACTIVE_CHAT_STORAGE_KEY,
            );
          }
        }
      } catch {
        localStorage.removeItem(
          TOKEN_STORAGE_KEY,
        );

        localStorage.removeItem(
          ACTIVE_CHAT_STORAGE_KEY,
        );
      } finally {
        if (!cancelled) {
          setIsRestoring(
            false,
          );
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    const normalizedToken =
      token.trim();

    if (
      !normalizedToken ||
      isConnecting
    ) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const botData =
        await getMe(
          normalizedToken,
        );

      setToken(
        normalizedToken,
      );

      setBot(botData);

      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        normalizedToken,
      );

      await loadChats(
        normalizedToken,
        botData,
      );
    } catch (connectError) {
      setBot(null);

      setError(
        connectError instanceof Error
          ? connectError.message
          : 'Could not connect to Telegram.',
      );
    } finally {
      setIsConnecting(
        false,
      );
    }
  }

  function handleSelectChat(
    chat: TelegramChat,
  ) {
    if (!bot) {
      return;
    }

    setActiveChat(chat);

    localStorage.setItem(
      ACTIVE_CHAT_STORAGE_KEY,
      JSON.stringify({
        botId: bot.id,
        chat,
      }),
    );
  }

  function handleChangeChat() {
    localStorage.removeItem(
      ACTIVE_CHAT_STORAGE_KEY,
    );

    setActiveChat(null);
  }

  function handleDisconnect() {
    if (bot) {
      localStorage.removeItem(
        getChatsStorageKey(
          bot.id,
        ),
      );
    }

    localStorage.removeItem(
      TOKEN_STORAGE_KEY,
    );

    localStorage.removeItem(
      ACTIVE_CHAT_STORAGE_KEY,
    );

    setToken('');
    setBot(null);
    setActiveChat(null);
    setAvailableChats([]);
    setError(null);
  }

  if (isRestoring) {
    return (
      <main className="center-screen">
        <div className="loader" />

        <p className="muted">
          Restoring session...
        </p>
      </main>
    );
  }

  if (
    bot &&
    activeChat
  ) {
    return (
      <ChatWindow
        token={token}
        chatId={String(
          activeChat.id,
        )}
        chatName={getChatName(
          activeChat,
        )}
        botName={
          bot.username
            ? `@${bot.username}`
            : bot.first_name
        }
        onBack={
          handleChangeChat
        }
        onDisconnect={
          handleDisconnect
        }
      />
    );
  }

  if (!bot) {
    return (
      <main className="center-screen">
        <section className="auth-card">
          <div className="brand-mark">
            TG
          </div>

          <span className="eyebrow">
            TELEGRAM MESSENGER
          </span>

          <h1>
            Connect your bot
          </h1>

          <p className="card-description">
            Enter your Bot API
            token once. The
            application will
            remember it on this
            device.
          </p>

          {error && (
            <div
              className="error-box"
              role="alert"
            >
              {error}
            </div>
          )}

          <label className="field">
            <span>
              Bot token
            </span>

            <input
              type="password"
              autoComplete="off"
              placeholder="123456789:AA..."
              value={token}
              onChange={(
                event,
              ) => {
                setToken(
                  event.target
                    .value,
                );
              }}
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  void handleConnect();
                }
              }}
            />
          </label>

          <button
            type="button"
            className="primary-button"
            disabled={
              !token.trim() ||
              isConnecting
            }
            onClick={() => {
              void handleConnect();
            }}
          >
            {isConnecting
              ? 'Connecting...'
              : 'Connect bot'}
          </button>

          <p className="security-note">
            For this test
            application the token
            is stored only in your
            browser.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="center-screen">
      <section className="auth-card chat-picker-card">
        <div className="connection-status">
          <span className="status-dot" />
          Connected as{' '}
          {bot.username
            ? `@${bot.username}`
            : bot.first_name}
        </div>

        <h1>
          Choose a chat
        </h1>

        <p className="card-description">
          People who have written
          to your bot will appear
          here automatically.
        </p>

        {error && (
          <div
            className="error-box"
            role="alert"
          >
            {error}
          </div>
        )}

        {availableChats.length ===
        0 ? (
          <div className="empty-chat-picker">
            <div className="empty-icon">
              ↗
            </div>

            <h2>
              No chats found
            </h2>

            <p>
              Open the bot in
              Telegram, send
              <strong>
                {' '}
                /start
              </strong>{' '}
              or any text message
              and refresh the list.
            </p>
          </div>
        ) : (
          <div className="chat-picker-list">
            {availableChats.map(
              (chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className="chat-picker-item"
                  onClick={() => {
                    handleSelectChat(
                      chat,
                    );
                  }}
                >
                  <div className="chat-avatar">
                    {getChatName(
                      chat,
                    )
                      .replace(
                        '@',
                        '',
                      )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="chat-picker-copy">
                    <strong>
                      {getChatName(
                        chat,
                      )}
                    </strong>

                    <span>
                      Chat ID:{' '}
                      {chat.id}
                    </span>
                  </div>

                  <span className="chat-picker-arrow">
                    →
                  </span>
                </button>
              ),
            )}
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          disabled={
            isLoadingChats
          }
          onClick={() => {
            void loadChats(
              token,
              bot,
            );
          }}
        >
          {isLoadingChats
            ? 'Refreshing...'
            : 'Refresh chats'}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={
            handleDisconnect
          }
        >
          Disconnect bot
        </button>
      </section>
    </main>
  );
}

export default App;