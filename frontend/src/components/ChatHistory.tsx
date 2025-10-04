import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';
import { ScrollArea } from './ui/ScrollArea';

interface ChatHistoryProps {
  messages: Message[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Start a conversation</h3>
            <p className="text-muted-foreground max-w-sm">
              Ask questions about Cheatix company or whatever you want. Try one of the example questions or ask your own.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </ScrollArea>
  );
}

