import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState, AppState, Message, TabType } from '@/types';
import { apiClient } from '@/services/api';

// Action types
type AuthAction = 
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_VALIDATION'; payload: { isValid: boolean; message: string } }
  | { type: 'CLEAR_AUTH' };

type AppAction = 
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'CLEAR_MESSAGES' }
  | AuthAction;

// Initial state
const initialAuthState: AuthState = {
  token: apiClient.getToken() || '',
  isValid: false,
  message: '',
};

const initialState: AppState = {
  messages: [],
  isProcessing: false,
  auth: initialAuthState,
  activeTab: 'knowledge-qa',
};

// Reducers
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_VALIDATION':
      return { ...state, isValid: action.payload.isValid, message: action.payload.message };
    case 'CLEAR_AUTH':
      return { ...initialAuthState };
    default:
      return state;
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'SET_TOKEN':
    case 'SET_VALIDATION':
    case 'CLEAR_AUTH':
      return { ...state, auth: authReducer(state.auth, action) };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  validateToken: (token: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setActiveTab: (tab: TabType) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const validateToken = async (token: string) => {
    dispatch({ type: 'SET_TOKEN', payload: token });
    
    try {
      const result = await apiClient.validateToken(token);
      dispatch({ 
        type: 'SET_VALIDATION', 
        payload: { isValid: result.valid, message: result.message } 
      });
      
      if (result.valid) {
        apiClient.setToken(token);
      } else {
        apiClient.clearToken();
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_VALIDATION', 
        payload: { isValid: false, message: `Error: ${error}` } 
      });
      apiClient.clearToken();
    }
  };

  // Auto-validate token on startup if it exists in localStorage
  useEffect(() => {
    const savedToken = apiClient.getToken();
    if (savedToken && savedToken !== state.auth.token) {
      validateToken(savedToken);
    }
  }, []); // Empty dependency array - only run on mount

  const sendMessage = async (content: string) => {
    if (!content.trim() || state.isProcessing || !state.auth.isValid) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_PROCESSING', payload: true });

    try {
      const response = await apiClient.askQuestion(content.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        response,
        timestamp: new Date(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error}`,
        timestamp: new Date(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const setActiveTab = (tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const value: AppContextType = {
    state,
    dispatch,
    validateToken,
    sendMessage,
    clearMessages,
    setActiveTab,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
