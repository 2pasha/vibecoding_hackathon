import { useState, useEffect } from 'react';
import { Wrench, Target, TrendingUp, Users, BookOpen, Star, LogIn, ExternalLink, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/utils';
import { useApp } from '@/contexts/AppContext';

type PDPState = 'not-logged-in' | 'ready' | 'generating' | 'result';

export function SkillSmith() {
  const { state } = useApp();
  const [pdpState, setPdpState] = useState<PDPState>('not-logged-in');
  const [userInput, setUserInput] = useState('');
  const [pdpResult, setPdpResult] = useState<any>(null);

  // Check authentication state
  useEffect(() => {
    if (state.userAuth.isAuthenticated) {
      setPdpState('ready');
    } else {
      setPdpState('not-logged-in');
    }
  }, [state.userAuth.isAuthenticated]);

  const handleGeneratePDP = async () => {
    setPdpState('generating');
    
    // Pre-fill with mock data for senior developer
    setUserInput('I want to become a senior developer, I\'m currently working with React but want to learn backend development, I\'m interested in AI and machine learning...');
    
    // Mock API call for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Mock PDP result
    setPdpResult({
      skills: [
        { name: 'React Development', level: 'Intermediate', priority: 'High', timeline: '3 months' },
        { name: 'TypeScript', level: 'Beginner', priority: 'High', timeline: '2 months' },
        { name: 'Node.js', level: 'Beginner', priority: 'Medium', timeline: '4 months' },
        { name: 'AWS Cloud', level: 'Beginner', priority: 'Medium', timeline: '6 months' }
      ],
      goals: [
        'Become a full-stack developer',
        'Lead technical projects',
        'Mentor junior developers'
      ],
      actionPlan: [
        'Complete React Advanced course',
        'Build 3 portfolio projects',
        'Get AWS certification',
        'Join developer community'
      ]
    });
    
    setPdpState('result');
  };

  const handleGoToNotion = () => {
    // Open Notion page in new tab
    window.open('https://notion.so', '_blank');
  };

  // Not logged in state
  if (pdpState === 'not-logged-in') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">SkillSmith</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Please login</h3>
            <p className="text-gray-600 mb-6">
              Sign in to access your personalized skill development plan and AI-powered recommendations.
            </p>
            
            <button
              onClick={() => {
                // This will be handled by the parent component to open auth modal
                const event = new CustomEvent('openAuthModal');
                window.dispatchEvent(event);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - show PDP generation (no input field)
  if (pdpState === 'ready') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">SkillSmith</h2>
              <p className="text-gray-600">Hi {state.userAuth.user?.name}, let's create your PDP</p>
            </div>
          </div>

          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to generate your Personal Development Plan?</h3>
              <p className="text-gray-600">
                We'll create a customized plan based on your profile and career goals.
              </p>
            </div>

            <button
              onClick={handleGeneratePDP}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
            >
              <Target className="h-5 w-5" />
              Generate My PDP
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating state - show loader
  if (pdpState === 'generating') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">SkillSmith</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Generating your PDP...</h3>
              <p className="text-gray-600">
                Our AI is analyzing your input and creating a personalized development plan just for you.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>This usually takes about 5 seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result state - show PDP result
  if (pdpState === 'result' && pdpResult) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your PDP is Ready!</h2>
                <p className="text-gray-600">Personalized Development Plan for {state.userAuth.user?.name}</p>
              </div>
            </div>
            
            <button
              onClick={handleGoToNotion}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              <ExternalLink className="h-4 w-4" />
              Go to my PDP
            </button>
          </div>

          <div className="space-y-6">
            {/* Skills Assessment */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pdpResult.skills.map((skill: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{skill.name}</h4>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        skill.priority === 'High' ? 'bg-red-100 text-red-800' :
                        skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      )}>
                        {skill.priority} Priority
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Level: {skill.level}</p>
                      <p>Timeline: {skill.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Goals</h3>
              <ul className="space-y-2">
                {pdpResult.goals.map((goal: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Plan */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Plan</h3>
              <ul className="space-y-2">
                {pdpResult.actionPlan.map((action: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* User Input Display */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Your Input:</h4>
              <p className="text-blue-800 text-sm">{userInput}</p>
            </div>

            {/* Interactive Input Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Want to refine your goals? Update your input here:
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Update your career goals and skills..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleGeneratePDP}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Regenerate PDP
                </button>
                <button
                  onClick={() => setUserInput('')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear Input
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}