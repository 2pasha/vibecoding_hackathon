import { Brain, Clock, Users, Sparkles } from 'lucide-react';

export function TeamMemoryAgent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      {/* Coming Soon Icon */}
      <div className="relative">
        <div className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl">
          <Brain className="h-16 w-16 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full shadow-lg">
          <Sparkles className="h-6 w-6 text-yellow-800" />
        </div>
      </div>

      {/* Main Message */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Team Memory Agent
        </h2>
        <p className="text-2xl font-semibold text-gray-700">
          See you soon!!
        </p>
        <p className="text-lg text-gray-500 max-w-2xl">
          We're working on an amazing AI-powered team memory system that will help your team remember, learn, and grow together.
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl">
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Team Knowledge</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Capture and share team knowledge, decisions, and learnings automatically.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Reminders</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Get intelligent reminders about important team decisions and follow-ups.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Discover patterns and insights from your team's collective knowledge.
          </p>
        </div>
      </div>

      {/* Coming Soon Badge */}
      <div className="mt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-purple-700">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
