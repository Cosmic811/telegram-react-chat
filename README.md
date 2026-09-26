# Telegram Messenger

Test assignment for a React Frontend Developer position.

The original assignment allows using Telegram instead of MAX, so this implementation uses the Telegram Bot API.

## Demo

The application provides a simple interface for sending and receiving text messages through a Telegram bot.

Main flow:

1. Connect a Telegram bot using a Bot API token.
2. Discover users who have already sent a message to the bot.
3. Select a chat.
4. Send text messages from the web interface.
5. Receive new Telegram messages automatically through long polling.

## Features

- Telegram Bot API integration
- Bot token validation through `getMe`
- Automatic chat discovery
- Text message sending
- Incoming message receiving
- Telegram long polling with `getUpdates`
- Update offset handling to prevent duplicate messages
- Multiple discovered chats
- Persistent selected chat
- Local message history
- Automatic session restoration after page reload
- Error and loading states
- Responsive messenger interface
- Keyboard message sending with Enter
- Shift + Enter for a new line

## Tech Stack

- React
- TypeScript
- Vite
- Telegram Bot API
- CSS

No external state management or UI libraries are used.

## Project Structure

```text
src/
├── api/
│   ├── telegramApi.ts
│   └── types.ts
├── components/
│   └── ChatWindow.tsx
├── hooks/
│   └── useTelegramUpdates.ts
├── storage/
│   └── chats.ts
├── App.tsx
├── index.css
└── main.tsx

Local Setup
Requirements:
- Node.js
- npm
- Telegram bot created through BotFather
Clone the repository:
git clone <repository-url>
cd telegram-react-chat

Install dependencies:
npm install

Start the development server:
npm run dev

Production build:
npm run build

Lint:
npm run lint

How to Use
1. Create a Telegram bot
Open BotFather in Telegram and create a bot with:
/newbot

Copy the generated Bot API token.
2. Connect the bot
Open the application and enter the Bot API token.
The application validates it using Telegram's getMe method.
3. Start a conversation
A Telegram user must first send a message to the bot, for example:
/start

Return to the application and click:
Refresh chats

The user will appear in the available chats list.
4. Messaging
Select the chat.
Messages can now be:
- sent from the React application to Telegram
- received from Telegram in the React application
Incoming messages are received using Telegram Bot API long polling.
Telegram API Methods
The application uses:
- getMe
- getUpdates
- sendMessage
Incoming updates are processed using update_id.
After processing an update, the next polling request uses:
offset = update_id + 1

This prevents already processed updates from being received repeatedly.
Persistence
For the purposes of this frontend test assignment, the application uses browser localStorage for:
- Bot token
- discovered chats
- active chat
- processed Telegram update offset
- local message history
This allows the application to restore the previous session after a browser restart.
Security Note
This is a frontend-only test implementation.
The Telegram Bot API token is stored in the user's browser because the assignment is implemented without a backend.
In a production application, the bot token should not be exposed to the frontend. Telegram API communication should instead be handled by a backend service and credentials should be stored securely on the server.
Limitations
- Only text messages are supported.
- Message history contains messages processed by this application and is not a complete Telegram chat history.
- Users must message the bot before they can be discovered.
- The implementation uses the Telegram Bot API rather than a Telegram user account.
Assignment
Implementation: Telegram version of the messenger test assignment.

## Live Demo

https://cosmic811.github.io/telegram-react-chat/