import { useState, useEffect } from 'react';
import { Wrench, LogIn, Loader2, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { UserProfile } from './UserProfile';
import { PDPGeneration } from './PDPGeneration';
import { ChecklistList } from './ChecklistList';
import { ChecklistModal } from './ChecklistModal';
import { PDPResult } from './PDPResult';
import { ChecklistData, ChecklistCategory } from '@/types/checklist';

type PDPState = 'not-logged-in' | 'ready' | 'generating' | 'result';
type LoadingState = 'initial' | 'extended' | 'very-extended' | 'checking';

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
            items: cat.items.map((item: any, index: number) => ({
              id: `${cat.category}_${index}`,
              text: typeof item === 'string' ? item : JSON.stringify(item),
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

  const handleViewFullChecklist = (checklist: ChecklistData) => {
    setSelectedChecklist(checklist);
  };

  const handleCloseModal = () => {
    setSelectedChecklist(null);
  };

  return (
    <>
      {/* Not logged in state */}
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

      {/* Ready state */}
      {pdpState === 'ready' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <UserProfile />
          <PDPGeneration 
            userInput={userInput}
            setUserInput={setUserInput}
            onGeneratePDP={handleGeneratePDP}
          />
          <ChecklistList 
            checklists={checklists}
            onCheckboxChange={handleCheckboxChange}
            onViewFull={handleViewFullChecklist}
          />
        </div>
      )}

      {/* Generating state */}
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

      {/* Result state */}
      {pdpState === 'result' && pdpResult && (
        <PDPResult 
          pdpResult={pdpResult}
          userInput={userInput}
          setUserInput={setUserInput}
          checklists={checklists}
          isGeneratingChecklist={isGeneratingChecklist}
          onGenerateChecklist={handleGenerateChecklist}
          onRegeneratePDP={handleGeneratePDP}
          onCheckboxChange={handleCheckboxChange}
          onViewFullChecklist={handleViewFullChecklist}
        />
      )}
      
      {/* Checklist Modal */}
      {selectedChecklist && (
        <ChecklistModal 
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          onCheckboxChange={handleCheckboxChange}
        />
      )}
    </>
  );
}