import { useState, useEffect } from 'react';
import { Wrench, Target, BookOpen, LogIn, ExternalLink, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/utils';
import { useApp } from '@/contexts/AppContext';

type PDPState = 'not-logged-in' | 'ready' | 'generating' | 'result';

type LoadingState = 'initial' | 'extended' | 'very-extended' | 'checking';

export function SkillSmith() {
  const { state } = useApp();
  const [pdpState, setPdpState] = useState<PDPState>('not-logged-in');
  const [userInput, setUserInput] = useState('');
  const [pdpResult, setPdpResult] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('initial');

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
    setLoadingState('initial');
    
    // Set up timers for progressive loading states
    const extendedTimer = setTimeout(() => {
      setLoadingState('extended');
    }, 5000);
    
    const veryExtendedTimer = setTimeout(() => {
      setLoadingState('very-extended');
    }, 10000);
    
    const checkingTimer = setTimeout(() => {
      setLoadingState('checking');
    }, 15000);
    
    try {
      // Send request to generate course
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.userAuth.idToken}`
        },
        body: JSON.stringify({
          learning_goal: userInput || "I want to increase my skills and improve my professional development. Please create a comprehensive Personal Development Plan (PDP) for me."
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.course_content) {
          // Store the HTML content for display
          setPdpResult({
            type: 'html',
            content: data.course_content,
            userInput: userInput || "I want to increase my skills and improve my professional development. Please create a comprehensive Personal Development Plan (PDP) for me."
          });
        } else {
          throw new Error(data.message || 'Failed to generate course');
        }
      } else {
        throw new Error('Failed to generate course');
      }
    } catch (error) {
      console.error('Error generating PDP:', error);
      // Fallback to mock data on error
      setPdpResult({
        type: 'json',
        skills: [
          { name: 'Professional Development', level: 'Intermediate', priority: 'High', timeline: '3 months' },
          { name: 'Technical Skills', level: 'Beginner', priority: 'High', timeline: '2 months' },
          { name: 'Leadership Skills', level: 'Beginner', priority: 'Medium', timeline: '4 months' },
          { name: 'Communication Skills', level: 'Intermediate', priority: 'Medium', timeline: '2 months' }
        ],
        goals: [
          'Enhance professional skills',
          'Develop technical expertise',
          'Improve leadership capabilities'
        ],
        actionPlan: [
          'Complete relevant training courses',
          'Practice new skills in real projects',
          'Seek mentorship opportunities',
          'Join professional communities'
        ],
        resources: ['Online courses', 'Professional books', 'Mentorship programs'],
        timeline: '6-12 months for initial goals',
        userInput: userInput || "I want to increase my skills and improve my professional development. Please create a comprehensive Personal Development Plan (PDP) for me."
      });
    } finally {
      // Clear all timers
      clearTimeout(extendedTimer);
      clearTimeout(veryExtendedTimer);
      clearTimeout(checkingTimer);
    }
    
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

  // Ready state - show PDP generation with user profile
  if (pdpState === 'ready') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">SkillSmith</h2>
              <p className="text-gray-600">Hi {state.userAuth.user?.name}, let's create your PDP</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Profile</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-200">
                  <img 
                    src={state.userAuth.user?.photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                    alt={state.userAuth.user?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{state.userAuth.user?.name}</h4>
                <p className="text-purple-600 font-medium mb-2">{state.userAuth.user?.position}</p>
                <div className="text-sm text-gray-500">
                  Born: {new Date(state.userAuth.user?.birth_date || '').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hard Skills */}
              <div>
                <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Hard Skills
                </h5>
                <div className="flex flex-wrap gap-2">
                  {state.userAuth.user?.hard_skills?.map((skill: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div>
                <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Soft Skills
                </h5>
                <div className="flex flex-wrap gap-2">
                  {state.userAuth.user?.soft_skills?.map((skill: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PDP Generation Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
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
            
            {loadingState === 'initial' && (
              <>
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
              </>
            )}
            
            {loadingState === 'extended' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="text-6xl">🐱</div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Working...</h3>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <h3>Or a little bit longer... 😅</h3>
                  </div>
                </div>
              </>
            )}
            
            {loadingState === 'very-extended' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="text-6xl">⏰</div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Still working...</h3>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Or maybe even little bit longer that you expect</span>
                  </div>
                </div>
              </>
            )}
            
            {loadingState === 'checking' && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="text-6xl">🔍</div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Okay, I will go and check is everything is OK</h3>
                
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Almost there...</span>
                  </div>
                </div>
              </>
            )}
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
            {/* Display HTML content if available */}
            {pdpResult.type === 'html' ? (
              <div>
                <div 
                  className="prose prose-sm max-w-none pdp-content"
                  dangerouslySetInnerHTML={{ __html: pdpResult.content }}
                />
                <style>{`
                  .pdp-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1rem 0;
                  }
                  .pdp-content table th,
                  .pdp-content table td {
                    border: 1px solid #d1d5db;
                    padding: 0.75rem;
                    text-align: left;
                  }
                  .pdp-content table th {
                    background-color: #f9fafb;
                    font-weight: 600;
                  }
                  .pdp-content h1 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    color: #1f2937;
                  }
                  .pdp-content h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    color: #1f2937;
                  }
                  .pdp-content ul {
                    margin: 1rem 0;
                    padding-left: 1.5rem;
                  }
                  .pdp-content li {
                    margin: 0.5rem 0;
                  }
                `}</style>
              </div>
            ) : (
              /* Display JSON content (fallback) */
              <>
                {/* Skills Assessment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pdpResult.skills?.map((skill: any, index: number) => (
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
                    {pdpResult.goals?.map((goal: string, index: number) => (
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
                    {pdpResult.actionPlan?.map((action: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources */}
                {pdpResult.resources && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Resources</h3>
                    <ul className="space-y-2">
                      {pdpResult.resources.map((resource: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline */}
                {pdpResult.timeline && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Timeline</h3>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{pdpResult.timeline}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* User Input Display */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Your Input:</h4>
              <p className="text-blue-800 text-sm">{pdpResult.userInput || userInput}</p>
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