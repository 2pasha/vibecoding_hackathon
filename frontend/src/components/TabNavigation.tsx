import { BookOpen, Wrench, Brain } from 'lucide-react';
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
    },
    {
      id: 'team-memory' as TabType,
      label: 'Team Memory Agent',
      icon: Brain,
      description: 'AI-powered team knowledge and memory'
    }
  ];

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}