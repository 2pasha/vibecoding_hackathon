import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
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

// localStorage keys
const AUTH_STORAGE_KEY = 'cheatix_user_auth';
const ID_TOKEN_STORAGE_KEY = 'cheatix_id_token';

// Helper functions for localStorage
const saveAuthToStorage = (userAuth: UserAuthState, idToken: string) => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userAuth));
    localStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
  } catch (error) {
    console.error('Error saving auth to localStorage:', error);
  }
};

const loadAuthFromStorage = (): { userAuth: UserAuthState; idToken: string | null } => {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedToken = localStorage.getItem(ID_TOKEN_STORAGE_KEY);
    
    if (savedAuth && savedToken) {
      const userAuth = JSON.parse(savedAuth);
      return { userAuth, idToken: savedToken };
    }
  } catch (error) {
    console.error('Error loading auth from localStorage:', error);
  }
  
  return {
    userAuth: {
      isAuthenticated: false,
      user: null,
      idToken: null,
    },
    idToken: null,
  };
};

const clearAuthFromStorage = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing auth from localStorage:', error);
  }
};

// Load initial state from localStorage
const { userAuth: initialUserAuthState, idToken: initialIdToken } = loadAuthFromStorage();

// Initial state
const initialAuthState: AuthState = {
  token: '', // No token needed - backend handles authentication internally
  isValid: true, // Assume API is always available since backend handles auth
  message: '',
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
  login: (idToken: string) => Promise<void>;
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

  const login = async (idToken: string) => {
    try {
      // Validate token and get user data
      const response = await fetch('/api/validate-user-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        const userAuthState = {
          isAuthenticated: true,
          user: {
            name: userData.name,
            email: `${userData.name.toLowerCase().replace(/\s+/g, '.')}@cheatix.com`
          },
          idToken: idToken
        };
        
        dispatch({
          type: 'SET_USER_AUTH',
          payload: userAuthState
        });
        
        // Save to localStorage
        saveAuthToStorage(userAuthState, idToken);
        
        // Set the ID token in the API client
        apiClient.setIdToken(idToken);
      } else {
        // Token is invalid
        dispatch({
          type: 'SET_USER_AUTH',
          payload: {
            isAuthenticated: false,
            user: null,
            idToken: null
          }
        });
        apiClient.clearIdToken();
        clearAuthFromStorage();
      }
    } catch (error) {
      console.error('Error validating token:', error);
      // Fallback to not authenticated
      dispatch({
        type: 'SET_USER_AUTH',
        payload: {
          isAuthenticated: false,
          user: null,
          idToken: null
        }
      });
      apiClient.clearIdToken();
      clearAuthFromStorage();
    }
  };

  const logout = () => {
    dispatch({
      type: 'SET_USER_AUTH',
      payload: {
        isAuthenticated: false,
        user: null,
        idToken: null
      }
    });
    // Clear the ID token from the API client
    apiClient.clearIdToken();
    // Clear from localStorage
    clearAuthFromStorage();
  };

  // Restore authentication state on startup
  useEffect(() => {
    if (initialIdToken && initialUserAuthState.isAuthenticated) {
      // Set the ID token in the API client
      apiClient.setIdToken(initialIdToken);
    }
  }, []); // Only run on mount

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
