import { useState, useEffect } from 'react';
import { Wrench, Target, BookOpen, LogIn, ExternalLink, CheckCircle, Clock, Loader2, Eye, X } from 'lucide-react';
import { cn } from '@/utils';
import { useApp } from '@/contexts/AppContext';

type PDPState = 'not-logged-in' | 'ready' | 'generating' | 'result';

type LoadingState = 'initial' | 'extended' | 'very-extended' | 'checking';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  id: string;
  userId: string;
  generatedAt: string;
  categories: ChecklistCategory[];
}

export function SkillSmith() {
  const { state } = useApp();
  const [pdpState, setPdpState] = useState<PDPState>('not-logged-in');
  const [userInput, setUserInput] = useState('');
  const [pdpResult, setPdpResult] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('initial');
  const [checklists, setChecklists] = useState<ChecklistData[]>([]);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistData | null>(null);


  // Check authentication state
  useEffect(() => {
    if (state.userAuth.isAuthenticated) {
      setPdpState('ready');
      loadUserChecklists();
    } else {
      setPdpState('not-logged-in');
    }
  }, [state.userAuth.isAuthenticated]);

  // Load user checklists from localStorage
  const loadUserChecklists = () => {
    if (!state.userAuth.user?.name) return;
    
    try {
      const stored = localStorage.getItem(`checklists_${state.userAuth.user.name}`);
      if (stored) {
        const parsedChecklists = JSON.parse(stored);
        setChecklists(parsedChecklists);
      }
    } catch (error) {
      console.error('Error loading checklists:', error);
    }
  };

  // Save checklists to localStorage
  const saveChecklists = (updatedChecklists: ChecklistData[]) => {
    if (!state.userAuth.user?.name) return;
    
    try {
      localStorage.setItem(`checklists_${state.userAuth.user.name}`, JSON.stringify(updatedChecklists));
      setChecklists(updatedChecklists);
    } catch (error) {
      console.error('Error saving checklists:', error);
    }
  };

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

  const handleGenerateChecklist = async () => {
    setIsGeneratingChecklist(true);
    
    try {
      // Use the existing endpoint that expects generated_course (HTML content from PDP)
      const response = await fetch('/api/generate-checklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.userAuth.idToken}`
        },
        body: JSON.stringify({
          generated_course: pdpResult?.content || "No course content available. Please generate a PDP first."
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.checklist) {
          // Parse the checklist data
          const parsedCategories: ChecklistCategory[] = data.checklist.map((cat: any) => ({
            category: cat.category,
            items: cat.items.map((item: string, index: number) => ({
              id: `${cat.category}_${index}`,
              text: item,
              completed: false
            }))
          }));

          // Create new checklist data
          const newChecklist: ChecklistData = {
            id: `checklist_${Date.now()}`,
            userId: state.userAuth.user?.name || '',
            generatedAt: new Date().toISOString(),
            categories: parsedCategories
          };

          // Add to existing checklists
          const updatedChecklists = [...checklists, newChecklist];
          saveChecklists(updatedChecklists);
        } else {
          throw new Error(data.message || 'Failed to generate checklist');
        }
      } else {
        throw new Error('Failed to generate checklist');
      }
    } catch (error) {
      console.error('Error generating checklist:', error);
      alert('Failed to generate checklist. Please try again.');
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleCheckboxChange = (checklistId: string, categoryIndex: number, itemIndex: number, completed: boolean) => {
    const updatedChecklists = checklists.map(checklist => {
      if (checklist.id === checklistId) {
        const updatedCategories = [...checklist.categories];
        updatedCategories[categoryIndex] = {
          ...updatedCategories[categoryIndex],
          items: updatedCategories[categoryIndex].items.map((item, index) => 
            index === itemIndex ? { ...item, completed } : item
          )
        };
        return { ...checklist, categories: updatedCategories };
      }
      return checklist;
    });
    
    saveChecklists(updatedChecklists);
  };

  return (
    <>
      {/* Main Content */}
      {pdpState === 'not-logged-in' && (
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
      )}

      {pdpState === 'ready' && (
        <div className="max-w-6xl mx-auto space-y-6">
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
                onClick={handleGeneratePDP}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
              >
                <Target className="h-5 w-5" />
                Generate My PDP
              </button>
            </div>
          </div>

          {/* Existing Checklists Section */}
          {checklists.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Your Checklists ({checklists.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(checklists[checklists.length - 1]?.generatedAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-4">
                {checklists.slice(-3).map((checklist) => (
                  <div key={checklist.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        Generated on {new Date(checklist.generatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{checklist.categories.reduce((total, cat) => total + cat.items.length, 0)} items</span>
                          <span className="text-green-600">
                            {checklist.categories.reduce((total, cat) => 
                              total + cat.items.filter(item => item.completed).length, 0
                            )} completed
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedChecklist(checklist)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View Full
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {checklist.categories.slice(0, 2).map((category, categoryIndex) => (
                        <div key={categoryIndex}>
                          <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {category.category}
                          </h5>
                          <div className="space-y-1 ml-4">
                            {category.items.slice(0, 3).map((item, itemIndex) => (
                              <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) => handleCheckboxChange(checklist.id, categoryIndex, itemIndex, e.target.checked)}
                                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className={`text-xs ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {item.text}
                                </span>
                              </label>
                            ))}
                            {category.items.length > 3 && (
                              <div className="text-xs text-gray-500 ml-5">
                                +{category.items.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {checklist.categories.length > 2 && (
                        <div className="text-xs text-gray-500 ml-4">
                          +{checklist.categories.length - 2} more categories
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Generate a new PDP to create more checklists based on your updated goals
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {pdpState === 'generating' && (
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
      )}

      {pdpState === 'result' && pdpResult && (
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

              {/* Generate Checklist Button */}
              <div className="text-center">
                <button
                  onClick={handleGenerateChecklist}
                  disabled={isGeneratingChecklist}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingChecklist ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isGeneratingChecklist ? 'Generating Checklist...' : 'Generate Checklist'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Create actionable tasks based on your PDP
                </p>
              </div>

              {/* Checklists Section */}
              {checklists.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Checklists</h3>
                  <div className="space-y-6">
                    {checklists.slice(-2).map((checklist) => (
                      <div key={checklist.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">
                            Checklist from {new Date(checklist.generatedAt).toLocaleDateString()}
                          </h4>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500">
                              {checklist.categories.reduce((total, cat) => total + cat.items.length, 0)} items
                            </div>
                            <button
                              onClick={() => setSelectedChecklist(checklist)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              View Full
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {checklist.categories.map((category, categoryIndex) => (
                            <div key={categoryIndex}>
                              <h5 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                {category.category}
                              </h5>
                              <div className="space-y-2 ml-4">
                                {category.items.map((item, itemIndex) => (
                                  <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.completed}
                                      onChange={(e) => handleCheckboxChange(checklist.id, categoryIndex, itemIndex, e.target.checked)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                      {item.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    onClick={handleGenerateChecklist}
                    disabled={isGeneratingChecklist}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingChecklist ? 'Generating...' : 'Generate Checklist'}
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
      )}
      
      {/* Checklist Modal */}
      {selectedChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Full Checklist View
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Generated on {new Date(selectedChecklist.generatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedChecklist(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {selectedChecklist.categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      {category.category}
                    </h3>
                    
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => handleCheckboxChange(selectedChecklist.id, categoryIndex, itemIndex, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                          />
                          <span className={`text-sm leading-relaxed ${item.completed ? 'line-through text-gray-500' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {selectedChecklist.categories.reduce((total, cat) => 
                    total + cat.items.filter(item => item.completed).length, 0
                  )}
                </span> of{' '}
                <span className="font-medium">
                  {selectedChecklist.categories.reduce((total, cat) => total + cat.items.length, 0)}
                </span> items completed
              </div>
              <button
                onClick={() => setSelectedChecklist(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}