import { SettingsPanelProps } from '@/types';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from 'lucide-react';

export function SettingsPanel({ 
  auth
}: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      {/* API Status Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">API Status</h3>
        </div>
        
        {/* Token Status */}
        <div className="text-sm">
          {auth.isValid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              API is ready
            </div>
          ) : auth.message ? (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              {auth.message}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              API is not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

