import React from 'react';
import { cn } from '@/utils';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollArea({ children, className }: ScrollAreaProps) {
  return (
    <div className={cn('overflow-auto scrollbar-thin', className)}>
      {children}
    </div>
  );
}

