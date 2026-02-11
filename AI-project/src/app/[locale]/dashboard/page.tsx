// app/dashboard/page.tsx
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout showPromotion={true}>
      <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        <p className="text-gray-300 mb-4">Welcome to your AI Studio dashboard</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">AI Image Generator</h3>
            <p className="text-gray-400 text-sm">Create stunning images with AI</p>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">AI Video Generator</h3>
            <p className="text-gray-400 text-sm">Generate videos from text prompts</p>
          </div>
          
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Effects Library</h3>
            <p className="text-gray-400 text-sm">Apply creative effects to your creations</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}