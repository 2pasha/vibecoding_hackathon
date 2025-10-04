import { useApp } from '@/contexts/AppContext';

export function UserProfile() {
  const { state } = useApp();

  return (
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
  );
}
