import { ChatHistory } from '@/components/ChatHistory';
import { ChatInput } from '@/components/ChatInput';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ExampleQuestions } from '@/components/ExampleQuestions';
import { Trash2, AlertCircle, LogIn, Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export function KnowledgeQA() {
  const { state, sendMessage, clearMessages } = useApp();

  const handleQuestionSelect = (question: string) => {
    sendMessage(question);
  };

  const handleLoginClick = () => {
    const event = new CustomEvent('openAuthModal');
    window.dispatchEvent(event);
  };

  const placeholder = state.userAuth.isAuthenticated
    ? "e.g., What is the vacation policy?"
    : "Please authenticate to use the chat";

  const isDisabled = state.isProcessing || !state.userAuth.isAuthenticated;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-8">
        {/* Authentication Hint Banner */}
        {!state.userAuth.isAuthenticated && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-medium text-amber-800">
                    Authentication Required
                  </h3>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  You need to sign in to ask questions and interact with the Knowledge QA system. 
                  This ensures secure access to company information and personalized responses.
                </p>
                <button
                  onClick={handleLoginClick}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In to Continue
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <SettingsPanel
                auth={state.auth}
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <ExampleQuestions
                onQuestionSelect={handleQuestionSelect}
                disabled={isDisabled}
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
            <div className="relative">
              <ChatInput
                onSendMessage={sendMessage}
                disabled={isDisabled}
                placeholder={placeholder}
              />
              {!state.userAuth.isAuthenticated && (
                <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Sign in to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
  
