import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  sendMessage,
} from '../api/telegramApi';

import type {
  TelegramMessage,
} from '../api/types';

import {
  useTelegramUpdates,
} from '../hooks/useTelegramUpdates';

interface ChatWindowProps {
  token: string;
  chatId: string;
  chatName: string;
  botName: string;

  onBack: () => void;
  onDisconnect: () => void;
}

interface MessageItem {
  id: string;
  text: string;

  direction:
    | 'incoming'
    | 'outgoing';

  date: number;
}

export function ChatWindow({
  token,
  chatId,
  chatName,
  botName,
  onBack,
  onDisconnect,
}: ChatWindowProps) {
  const historyStorageKey =
    useMemo(() => {
      const botId =
        token.split(':')[0] ??
        'bot';

      return `telegram-message-history:${botId}:${chatId}`;
    }, [chatId, token]);

  const [
    messages,
    setMessages,
  ] = useState<MessageItem[]>(
    () => {
      try {
        const raw =
          localStorage.getItem(
            historyStorageKey,
          );

        if (!raw) {
          return [];
        }

        const parsed =
          JSON.parse(raw);

        return Array.isArray(
          parsed,
        )
          ? (parsed as MessageItem[])
          : [];
      } catch {
        return [];
      }
    },
  );

  const [text, setText] =
    useState('');

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  const [
    sendError,
    setSendError,
  ] =
    useState<string | null>(
      null,
    );

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    localStorage.setItem(
      historyStorageKey,
      JSON.stringify(
        messages.slice(-200),
      ),
    );
  }, [
    historyStorageKey,
    messages,
  ]);

  const handleIncomingMessage =
    useCallback(
      (
        message: TelegramMessage,
      ) => {
        if (!message.text) {
          return;
        }

        const item: MessageItem =
          {
            id: `incoming-${message.message_id}`,

            text: message.text,

            direction:
              'incoming',

            date: message.date,
          };

        setMessages(
          (current) => {
            if (
              current.some(
                (
                  existingMessage,
                ) =>
                  existingMessage.id ===
                  item.id,
              )
            ) {
              return current;
            }

            return [
              ...current,
              item,
            ].slice(-200);
          },
        );
      },
      [],
    );

  const {
    error: pollingError,
    isPolling,
  } = useTelegramUpdates({
    token,
    chatId,

    onMessage:
      handleIncomingMessage,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedText =
      text.trim();

    if (
      !normalizedText ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const sentMessage =
        await sendMessage(
          token,
          chatId,
          normalizedText,
        );

      const outgoingMessage:
        MessageItem = {
          id: `outgoing-${sentMessage.message_id}`,

          text: normalizedText,

          direction:
            'outgoing',

          date: sentMessage.date,
        };

      setMessages(
        (current) =>
          [
            ...current,
            outgoingMessage,
          ].slice(-200),
      );

      setText('');
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : 'Could not send message.',
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="messenger-shell">
      <aside className="messenger-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">
            TG
          </div>

          <div>
            <strong>
              Messenger
            </strong>

            <span>
              {botName}
            </span>
          </div>
        </div>

        <div className="sidebar-chat active">
          <div className="chat-avatar">
            {chatName
              .replace('@', '')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="sidebar-chat-copy">
            <strong>
              {chatName}
            </strong>

            <span>
              Chat ID: {chatId}
            </span>
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onBack}
          >
            Change chat
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={
              onDisconnect
            }
          >
            Disconnect
          </button>
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div className="mobile-back">
            <button
              type="button"
              className="icon-button"
              onClick={onBack}
              aria-label="Back"
            >
              ←
            </button>
          </div>

          <div className="chat-avatar">
            {chatName
              .replace('@', '')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="chat-header-copy">
            <strong>
              {chatName}
            </strong>

            <span>
              <span
                className={
                  isPolling
                    ? 'status-dot'
                    : 'status-dot offline'
                }
              />

              {isPolling
                ? 'Listening for messages'
                : 'Reconnecting...'}
            </span>
          </div>

          <div className="chat-id-badge">
            {chatId}
          </div>
        </header>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">
                ✦
              </div>

              <h2>
                No messages yet
              </h2>

              <p>
                Send a message
                from this
                interface or
                write to the bot
                from Telegram.
              </p>
            </div>
          ) : (
            <div
              className="messages-list"
              aria-live="polite"
            >
              {messages.map(
                (message) => (
                  <div
                    key={
                      message.id
                    }
                    className={`message-row ${message.direction}`}
                  >
                    <div
                      className={`message-bubble ${message.direction}`}
                    >
                      <p>
                        {
                          message.text
                        }
                      </p>

                      <time>
                        {new Date(
                          message.date *
                            1000,
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute:
                              '2-digit',
                          },
                        )}
                      </time>
                    </div>
                  </div>
                ),
              )}

              {isSending && (
                <div className="message-row outgoing">
                  <div className="message-bubble outgoing sending">
                    Sending...
                  </div>
                </div>
              )}

              <div
                ref={bottomRef}
              />
            </div>
          )}
        </div>

        {(sendError ||
          pollingError) && (
          <div
            className="chat-error"
            role="alert"
          >
            {sendError ??
              pollingError}
          </div>
        )}

        <form
          className="message-composer"
          onSubmit={
            handleSubmit
          }
        >
          <textarea
            rows={1}
            value={text}
            disabled={isSending}
            placeholder="Write a message..."
            maxLength={4096}
            onChange={(
              event,
            ) => {
              setText(
                event.target
                  .value,
              );
            }}
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                  'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault();

                event.currentTarget.form?.requestSubmit();
              }
            }}
          />

          <button
            type="submit"
            className="send-button"
            disabled={
              !text.trim() ||
              isSending
            }
          >
            <span>
              Send
            </span>

            <span aria-hidden="true">
              ➜
            </span>
          </button>
        </form>
      </section>
    </main>
  );
}