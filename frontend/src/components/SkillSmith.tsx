import { Wrench, Target, TrendingUp, Users, BookOpen, Star } from 'lucide-react';

export function SkillSmith() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Wrench className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">SkillSmith</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          AI-powered skill development and training recommendations to help you grow your career
        </p>
      </div>

      {/* Skill Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            name: 'Technical Skills',
            icon: Wrench,
            color: 'bg-blue-500',
            skills: ['Python Programming', 'Machine Learning', 'Data Analysis', 'Cloud Computing']
          },
          {
            name: 'Leadership & Management',
            icon: Users,
            color: 'bg-green-500',
            skills: ['Team Leadership', 'Project Management', 'Strategic Planning', 'Conflict Resolution']
          },
          {
            name: 'Communication',
            icon: BookOpen,
            color: 'bg-purple-500',
            skills: ['Public Speaking', 'Technical Writing', 'Cross-cultural Communication', 'Presentation Skills']
          }
        ].map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.name} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg text-white ${category.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
              
              <div className="space-y-2">
                {category.skills.map((skill, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{skill}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">High Demand</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold">AI-Powered Recommendations</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Priority Skills</span>
            </div>
            <p className="text-sm text-gray-600">
              Focus on Python Programming and Machine Learning - these have the highest market demand and align with your career goals.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium">Learning Timeline</span>
            </div>
            <p className="text-sm text-gray-600">
              Complete foundational courses in 2-3 months, then move to advanced topics and hands-on projects.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Get Personalized Learning Plan
        </button>
      </div>
    </div>
  );
}