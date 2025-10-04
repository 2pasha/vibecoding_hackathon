import React, { useState } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { TabNavigation } from '@/components/TabNavigation';
import { KnowledgeQA } from '@/components/KnowledgeQA';
import { SkillSmith } from '@/components/SkillSmith';
import { TeamMemoryAgent } from '@/components/TeamMemoryAgent';
import { AuthModal } from '@/components/AuthModal';
import { BookOpen, Settings, User, LogOut } from 'lucide-react';

function AppContent() {
  const { state, setActiveTab, login, logout } = useApp();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Listen for custom event to open auth modal
  React.useEffect(() => {
    const handleOpenAuthModal = () => {
      setIsAuthModalOpen(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
    };
  }, []);

  const renderActiveTab = () => {
    switch (state.activeTab) {
      case 'knowledge-qa':
        return <KnowledgeQA />;
      case 'skillsmith':
        return <SkillSmith />;
      case 'team-memory':
        return <TeamMemoryAgent onTabChange={setActiveTab} />;
      default:
        return <KnowledgeQA />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200/60 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm header-logo">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">Cheatix Team Assistance</h1>
                <p className="text-xs text-gray-500 font-medium">AI-powered team productivity</p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex-1 flex justify-center px-8">
              <TabNavigation 
                activeTab={state.activeTab} 
                onTabChange={setActiveTab} 
              />
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-1">
              <button 
                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5 header-icon" />
              </button>
              
              {state.userAuth.isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Hi, {state.userAuth.user?.name}
                  </span>
                  <button 
                    onClick={logout}
                    className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Logout"
                  >
                    <LogOut className="h-5 w-5 header-icon" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Hi, folks
                  </span>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Sign in"
                  >
                    <User className="h-5 w-5 header-icon" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderActiveTab()}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={async (idToken) => await login(idToken)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
