import { Sparkles } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      title: '快速生成',
      description: '平均 5 秒内完成图像生成',
      icon: Sparkles,
      color: 'blue'
    },
    {
      title: '高质量',
      description: '支持最高 4K 分辨率输出',
      icon: Sparkles,
      color: 'green'
    },
    {
      title: '多种模型',
      description: '10+ 种 AI 模型供选择',
      icon: Sparkles,
      color: 'purple'
    }
  ];

  const stats = [
    { value: '5s', label: '平均生成时间' },
    { value: '10+', label: 'AI 模型' },
    { value: '1M+', label: '已生成图片' },
    { value: '99.9%', label: '可用性' }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
      {/* 特性展示 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          核心特性
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mb-12 border-t pt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center border-t pt-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          开始你的 AI 创作之旅
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          无需设计技能，输入想法即可获得惊艳作品。无论你是设计师、内容创作者还是普通用户，都能轻松使用。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/signup"
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity inline-flex items-center justify-center"
          >
            免费注册
          </a>
          <a
            href="/gallery"
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
          >
            查看作品
          </a>
        </div>
      </div>
    </div>
  );
}