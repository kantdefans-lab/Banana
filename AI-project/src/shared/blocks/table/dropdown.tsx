'use client';

import { MoreHorizontal } from 'lucide-react';
import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface Action {
  name: string;
  title: string;
  url: string;
  icon?: string;
  variant?: 'default' | 'destructive';
}

// ✅ 修复：扩展 Props 定义，匹配 index.tsx 传递的参数
interface DropdownProps {
  value?: Action[];    // 接收传入的操作列表
  placeholder?: string; // 接收 placeholder（虽然可能不用，但必须声明以通过 TS 检查）
  metadata?: any;
  className?: string;
  row?: any;           // 兼容旧调用方式
  col?: any;
}

export function Dropdown({ value, row, col }: DropdownProps) {
  // ✅ 逻辑升级：优先使用传入的 value (如果它是数组)，否则尝试用 col.callback(row) 计算
  const actions: Action[] = Array.isArray(value) 
    ? value 
    : (col?.callback ? col.callback(row) : []);

  if (!actions || actions.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      {/* 灰色背景 + 层级修复 */}
      <DropdownMenuContent 
        align="end" 
        className="w-[180px]"
      >
        {actions.map((action, idx) => (
          <DropdownMenuItem 
            key={idx} 
            asChild
            className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600 focus:bg-red-50' : ''}
          >
            <Link
              href={action.url || '#'}
              className="flex w-full items-center gap-2 cursor-pointer"
            >
              {action.icon && <SmartIcon name={action.icon} className="h-4 w-4" />}
              {action.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Dropdown;
