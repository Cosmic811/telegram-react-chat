import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { getUpdates } from '../api/telegramApi';
import { saveChat } from '../storage/chats';
import type {
  TelegramMessage,
} from '../api/types';

interface UseTelegramUpdatesOptions {
  token: string;
  chatId: string;

  onMessage: (
    message: TelegramMessage,
  ) => void;
}

export function useTelegramUpdates({
  token,
  chatId,
  onMessage,
}: UseTelegramUpdatesOptions) {
  const [error, setError] =
    useState<string | null>(null);

  const [isPolling, setIsPolling] =
    useState(false);

  const onMessageRef =
    useRef(onMessage);

  useEffect(() => {
    onMessageRef.current =
      onMessage;
  }, [onMessage]);

  useEffect(() => {
    const controller =
      new AbortController();

    const botId =
      token.split(':')[0] ??
      'bot';

    const offsetStorageKey =
      `telegram-update-offset:${botId}`;

    const storedOffset =
      localStorage.getItem(
        offsetStorageKey,
      );

    let offset =
      storedOffset !== null &&
      Number.isFinite(
        Number(storedOffset),
      )
        ? Number(storedOffset)
        : undefined;

    async function poll() {
      setIsPolling(true);

      while (
        !controller.signal.aborted
      ) {
        try {
          const updates =
            await getUpdates(
              token,
              offset,
              controller.signal,
            );

          for (
            const update of updates
          ) {
            const nextOffset =
              update.update_id + 1;

            if (
              offset === undefined ||
              nextOffset > offset
            ) {
              offset =
                nextOffset;

              localStorage.setItem(
                offsetStorageKey,
                String(offset),
              );
            }

            const message =
              update.message;
            if (message?.chat) {
               saveChat(
               botId,
               message.chat,
             );
            }
            if (
              !message?.text ||
              String(
                message.chat.id,
              ) !== chatId
            ) {
              continue;
            }

            onMessageRef.current(
              message,
            );
          }

          setError(null);
          setIsPolling(true);
        } catch (pollError) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setIsPolling(false);

          setError(
            pollError instanceof Error
              ? pollError.message
              : 'Could not receive Telegram updates.',
          );

          await new Promise(
            (resolve) => {
              setTimeout(
                resolve,
                1500,
              );
            },
          );
        }
      }
    }

    void poll();

    return () => {
      controller.abort();
    };
  }, [chatId, token]);

  return {
    error,
    isPolling,
  };
}