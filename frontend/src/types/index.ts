// API Response Types
export interface QueryRequest {
  query: string;
  max_tokens: number;
}

export interface QueryResponse {
  answer: string;
  citations: string[];
  retrieved_ids: number[];
  latency_ms: number;
}

export interface TokenValidationRequest {
  token: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  message: string;
}

export interface HealthResponse {
  ok: boolean;
}

export interface ApiError {
  error: string;
}

// UI State Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: QueryResponse;
  timestamp: Date;
}

export interface AuthState {
  token: string;
  isValid: boolean;
  message: string;
}

export interface AppState {
  messages: Message[];
  isProcessing: boolean;
  apiHealthy: boolean;
  auth: AuthState;
}

// Component Props Types
export interface ChatMessageProps {
  message: Message;
}

export interface SettingsPanelProps {
  auth: AuthState;
  onAuthChange: (auth: AuthState) => void;
  apiHealthy: boolean;
  onApiHealthCheck: () => Promise<boolean>;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  placeholder: string;
}

export interface ExampleQuestionsProps {
  onQuestionSelect: (question: string) => void;
  disabled: boolean;
}

