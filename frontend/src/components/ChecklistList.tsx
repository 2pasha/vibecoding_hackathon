import { CheckCircle, Eye } from 'lucide-react';
import { ChecklistData } from '@/types/checklist';

interface ChecklistListProps {
  checklists: ChecklistData[];
  onCheckboxChange: (checklistId: string, categoryIndex: number, itemIndex: number, completed: boolean) => void;
  onViewFull: (checklist: ChecklistData) => void;
}

export function ChecklistList({ checklists, onCheckboxChange, onViewFull }: ChecklistListProps) {
  if (checklists.length === 0) return null;

  return (
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
                  onClick={() => onViewFull(checklist)}
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
                          onChange={(e) => onCheckboxChange(checklist.id, categoryIndex, itemIndex, e.target.checked)}
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
  );
}
