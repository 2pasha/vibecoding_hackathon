import { useState, useEffect } from 'react';
import { SettingsPanelProps } from '@/types';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';

export function SettingsPanel({ 
  auth, 
  onAuthChange
}: SettingsPanelProps) {
  const [tokenInput, setTokenInput] = useState(auth.token);
  const [isValidating, setIsValidating] = useState(false);

  // Sync tokenInput with auth.token when it changes (e.g., loaded from localStorage)
  useEffect(() => {
    setTokenInput(auth.token);
  }, [auth.token]);

  const handleValidateToken = async () => {
    if (!tokenInput.trim()) return;
    
    setIsValidating(true);
    try {
      await onAuthChange({ ...auth, token: tokenInput.trim() });
    } finally {
      setIsValidating(false);
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

    </div>
  );
}

