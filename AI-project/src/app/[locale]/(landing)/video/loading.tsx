import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 min-h-[60vh] p-8">
      {/* 1. animate-spin: 旋转动画
         2. text-orange-500: 使用您的品牌橙色
      */}
      <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      
      {/* 加载提示文字 */}
      <p className="text-sm font-medium text-gray-400 animate-pulse">
        Loading AI Video Studio...
      </p>
    </div>
  );
}