import { useState } from 'react';
import { Brain, Send, Loader2, Users, MessageSquare, Database } from 'lucide-react';

export function TeamMemoryAgent() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult(`Team memory search results for: "${query}"`);
    } catch (error) {
      setResult('Error searching team memory');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Memory Agent</h2>
              <p className="text-sm text-gray-500">AI-powered team knowledge and memory management</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Team Knowledge</h3>
                <p className="text-xs text-gray-500">Access shared team insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Conversation History</h3>
                <p className="text-xs text-gray-500">Search past discussions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Database className="h-5 w-5 text-purple-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Memory Storage</h3>
                <p className="text-xs text-gray-500">Persistent team memory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Interface */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Search Team Memory
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What did we decide about the project timeline?, Find discussions about API design, Search for meeting notes from last week..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={4}
                disabled={isProcessing}
              />
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isProcessing ? 'Searching...' : 'Search Memory'}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results:</h3>
              <p className="text-gray-900">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}