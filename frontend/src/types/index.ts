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

export interface UserAuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    photo_url?: string;
    position?: string;
    birth_date?: string;
    hard_skills?: string[];
    soft_skills?: string[];
    notion_url?: string;
  } | null;
  idToken: string | null;
}

export type TabType = 'knowledge-qa' | 'skillsmith' | 'team-memory';

export interface AppState {
  messages: Message[];
  isProcessing: boolean;
  auth: AuthState;
  userAuth: UserAuthState;
  activeTab: TabType;
}

// Component Props Types
export interface ChatMessageProps {
  message: Message;
}

export interface SettingsPanelProps {
  auth: AuthState;
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

