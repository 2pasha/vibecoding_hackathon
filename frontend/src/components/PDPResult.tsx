import { CheckCircle, Target, BookOpen, Clock, Loader2, Eye } from 'lucide-react';
import { cn } from '@/utils';
import { useApp } from '@/contexts/AppContext';
import { ChecklistData } from '@/types/checklist';

interface PDPResultProps {
  pdpResult: any;
  userInput: string;
  setUserInput: (input: string) => void;
  checklists: ChecklistData[];
  isGeneratingChecklist: boolean;
  onGenerateChecklist: () => void;
  onRegeneratePDP: () => void;
  onCheckboxChange: (checklistId: string, categoryIndex: number, itemIndex: number, completed: boolean) => void;
  onViewFullChecklist: (checklist: ChecklistData) => void;
}

export function PDPResult({ 
  pdpResult, 
  userInput, 
  setUserInput, 
  checklists, 
  isGeneratingChecklist, 
  onGenerateChecklist, 
  onRegeneratePDP, 
  onCheckboxChange, 
  onViewFullChecklist
}: PDPResultProps) {
  const { state } = useApp();

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
              onClick={onGenerateChecklist}
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
                          onClick={() => onViewFullChecklist(checklist)}
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
                                  onChange={(e) => onCheckboxChange(checklist.id, categoryIndex, itemIndex, e.target.checked)}
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
                onClick={onRegeneratePDP}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Regenerate PDP
              </button>
              <button
                onClick={onGenerateChecklist}
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
  );
}
