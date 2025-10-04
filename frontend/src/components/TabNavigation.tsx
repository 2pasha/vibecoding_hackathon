import { BookOpen, Wrench } from 'lucide-react';
import { TabType } from '@/types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: 'knowledge-qa' as TabType,
      label: 'Knowledge QA',
      icon: BookOpen,
      description: 'Ask questions about company policies and procedures'
    },
    {
      id: 'skillsmith' as TabType,
      label: 'SkillSmith',
      icon: Wrench,
      description: 'AI-powered skill development and training'
    }
  ];

  return (
    <nav className="flex bg-gray-100/60 rounded-xl p-1.5" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm tab-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isActive
                ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}