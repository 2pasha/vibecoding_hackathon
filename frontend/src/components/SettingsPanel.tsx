import { useState } from 'react';
import { SettingsPanelProps } from '@/types';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings
} from 'lucide-react';

export function SettingsPanel({ 
  auth, 
  onAuthChange, 
  apiHealthy, 
  onApiHealthCheck 
}: SettingsPanelProps) {
  const [tokenInput, setTokenInput] = useState(auth.token);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleValidateToken = async () => {
    if (!tokenInput.trim()) return;
    
    setIsValidating(true);
    try {
      await onAuthChange({ ...auth, token: tokenInput.trim() });
    } finally {
      setIsValidating(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      await onApiHealthCheck();
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Token Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">API Token</h3>
        </div>
        
        <div className="space-y-2">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Enter your API token here..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          
          <button
            onClick={handleValidateToken}
            disabled={!tokenInput.trim() || isValidating}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Validate Token
          </button>
        </div>
        
        {/* Token Status */}
        <div className="text-sm">
          {auth.isValid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Token is valid
            </div>
          ) : auth.message ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              {auth.message}
            </div>
          ) : !auth.token ? (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              Please enter and validate your API token to use the chat
            </div>
          ) : null}
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Settings</h3>
        </div>
        
        {/* API Health Check */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">API Status</span>
            <button
              onClick={handleHealthCheck}
              disabled={isCheckingHealth}
              className="p-1 hover:bg-accent rounded"
            >
              <RefreshCw className={`h-4 w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="text-sm">
            {apiHealthy ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                API is running
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                API not available
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

