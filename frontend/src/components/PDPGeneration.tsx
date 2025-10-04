import { Target } from 'lucide-react';

interface PDPGenerationProps {
  userInput: string;
  setUserInput: (input: string) => void;
  onGeneratePDP: () => void;
}

export function PDPGeneration({ userInput, setUserInput, onGeneratePDP }: PDPGenerationProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to generate your Personal Development Plan?</h3>
        <p className="text-gray-600">
          We'll create a customized plan based on your profile and career goals.
        </p>
      </div>
      
      {/* Learning Goal Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What would you like to focus on? (Optional)
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="e.g., I want to improve my leadership skills and become a better team player..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={3}
        />
        
        {/* Tip Buttons */}
        <div className="mt-3">
          <p className="text-sm text-gray-500 mb-2">Quick tips to get started:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setUserInput("I want to dive deeper into ")}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              I want to dive deeper into...
            </button>
            <button
              onClick={() => setUserInput("I want to improve my ")}
              className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-full border border-green-200 hover:bg-green-100 transition-colors"
            >
              I want to improve my...
            </button>
            <button
              onClick={() => setUserInput("I want to learn more about ")}
              className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              I want to learn more about...
            </button>
            <button
              onClick={() => setUserInput("I want to develop my ")}
              className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              I want to develop my...
            </button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onGeneratePDP}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
        >
          <Target className="h-5 w-5" />
          Generate My PDP
        </button>
      </div>
    </div>
  );
}
