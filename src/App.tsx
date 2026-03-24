import { ChatContainer } from "./components/chat/ChatContainer";

export function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-800">AI Voice Chat</h1>
      </header>
      <main className="mx-auto max-w-2xl">
        <ChatContainer />
      </main>
    </div>
  );
}
