import { createContext, useContext, useReducer, ReactNode } from 'react';
import { AuthState, AppState, Message, TabType, UserAuthState } from '@/types';
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
  | { type: 'SET_USER_AUTH'; payload: UserAuthState }
  | { type: 'CLEAR_MESSAGES' }
  | AuthAction;

// Initial state
const initialAuthState: AuthState = {
  token: '', // No token needed - backend handles authentication internally
  isValid: true, // Assume API is always available since backend handles auth
  message: '',
};

const initialUserAuthState: UserAuthState = {
  isAuthenticated: false,
  user: null,
};

const initialState: AppState = {
  messages: [],
  isProcessing: false,
  auth: initialAuthState,
  userAuth: initialUserAuthState,
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
    case 'SET_USER_AUTH':
      return { ...state, userAuth: action.payload };
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
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setActiveTab: (tab: TabType) => void;
  login: (idToken: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const sendMessage = async (content: string) => {
    if (!content.trim() || state.isProcessing) {
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

  const login = (idToken: string) => {
    // Mock authentication - check for demo ID token
    if (idToken === 'demo-token-ann-123') {
      dispatch({
        type: 'SET_USER_AUTH',
        payload: {
          isAuthenticated: true,
          user: {
            name: 'Ann',
            email: 'ann@cheatix.com'
          }
        }
      });
    } else {
      // For any other tokens, show as not authenticated
      dispatch({
        type: 'SET_USER_AUTH',
        payload: {
          isAuthenticated: false,
          user: null
        }
      });
    }
  };

  const logout = () => {
    dispatch({
      type: 'SET_USER_AUTH',
      payload: {
        isAuthenticated: false,
        user: null
      }
    });
  };

  const value: AppContextType = {
    state,
    dispatch,
    sendMessage,
    clearMessages,
    setActiveTab,
    login,
    logout,
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
