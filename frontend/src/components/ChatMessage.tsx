import React from 'react';
import { Message } from '@/types';
import { formatTimestamp, formatLatency } from '@/utils';
import { Bot, User, Clock, FileText, BarChart3 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const response = message.response;

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <User className="h-5 w-5 text-green-600" />
          ) : (
            <Bot className="h-5 w-5 text-blue-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">
              {isUser ? 'You' : 'Assistant'}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {response && (
            <div className="mt-4 space-y-3">
              {/* Citations */}
              {response.citations && response.citations.length > 0 && 
               !message.content.includes('Not specified in the retrieved sections') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-sm">Citations:</span>
                  </div>
                  <div className="space-y-2">
                    {response.citations.map((citation, index) => (
                      <div key={index} className="citation">
                        📄 {citation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Metrics */}
              <div className="metrics">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Response Time</div>
                    <div className="font-semibold">{formatLatency(response.latency_ms)}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Chunks Retrieved</div>
                    <div className="font-semibold">{response.retrieved_ids.length}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="text-xs text-muted-foreground">Citations</div>
                    <div className="font-semibold">{response.citations.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

