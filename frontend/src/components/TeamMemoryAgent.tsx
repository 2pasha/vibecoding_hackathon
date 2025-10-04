import { Clock } from 'lucide-react';

interface TeamMemoryAgentProps {
  onTabChange?: (tab: 'knowledge-qa' | 'skillsmith') => void;
}

export function TeamMemoryAgent({ onTabChange: _onTabChange }: TeamMemoryAgentProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        

        {/* Coming Soon Content */}
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-full">
              <Clock className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Coming Soon!
          </h3>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're working hard to bring you an amazing Team Memory Agent experience.
          </p>




        </div>
      </div>
    </div>
  );
}