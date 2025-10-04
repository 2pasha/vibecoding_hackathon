import { ChatHistory } from '@/components/ChatHistory';
import { ChatInput } from '@/components/ChatInput';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ExampleQuestions } from '@/components/ExampleQuestions';
import { Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function KnowledgeQA() {
  const { state, validateToken, sendMessage, clearMessages } = useApp();

  // Manual health check only when needed

  const handleAuthChange = async (auth: typeof state.auth) => {
    await validateToken(auth.token);
  };

  const handleQuestionSelect = (question: string) => {
    sendMessage(question);
  };

  const placeholder = state.auth.isValid 
    ? "e.g., What is the vacation policy?"
    : "Please validate your API token first";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <SettingsPanel
                auth={state.auth}
                onAuthChange={handleAuthChange}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <ExampleQuestions
                onQuestionSelect={handleQuestionSelect}
                disabled={state.isProcessing || !state.auth.isValid}
              />
            </div>
          </aside>

          {/* Main Chat Area */}
          <main className="lg:col-span-3 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Chat</h2>
              <button
                onClick={clearMessages}
                disabled={state.isProcessing || state.messages.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </button>
            </div>

            {/* Chat History */}
            <ChatHistory messages={state.messages} />

            {/* Chat Input */}
            <ChatInput
              onSendMessage={sendMessage}
              disabled={state.isProcessing || !state.auth.isValid}
              placeholder={placeholder}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
  
