import { CheckCircle, X } from 'lucide-react';
import { ChecklistData } from '@/types/checklist';

interface ChecklistModalProps {
  checklist: ChecklistData;
  onClose: () => void;
  onCheckboxChange: (checklistId: string, categoryIndex: number, itemIndex: number, completed: boolean) => void;
}

export function ChecklistModal({ checklist, onClose, onCheckboxChange }: ChecklistModalProps) {
  return (
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
              Generated on {new Date(checklist.generatedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {checklist.categories.map((category, categoryIndex) => (
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
                        onChange={(e) => onCheckboxChange(checklist.id, categoryIndex, itemIndex, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                      />
                      <div className={`text-sm leading-relaxed ${item.completed ? 'line-through text-gray-500' : 'text-gray-700 group-hover:text-gray-900'}`}>
                        {typeof item.text === 'string' ? (
                          item.text.includes('\n• ') ? (
                            <div>
                              {item.text.split('\n• ').map((line, idx) => (
                                <div key={idx} className={idx === 0 ? '' : 'ml-4 text-xs text-gray-600 mt-1'}>
                                  {idx === 0 ? line : `• ${line}`}
                                </div>
                              ))}
                            </div>
                          ) : (
                            item.text
                          )
                        ) : (
                          JSON.stringify(item.text)
                        )}
                      </div>
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
              {checklist.categories.reduce((total, cat) => 
                total + cat.items.filter(item => item.completed).length, 0
              )}
            </span> of{' '}
            <span className="font-medium">
              {checklist.categories.reduce((total, cat) => total + cat.items.length, 0)}
            </span> items completed
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
