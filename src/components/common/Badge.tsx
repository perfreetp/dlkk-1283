import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  icon?: string;
  name: string;
  earned?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, icon, name, earned = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
          earned ? 'bg-gradient-to-r from-[#FF6B35]/10 to-[#2D5BFF]/10' : 'bg-gray-100 opacity-50',
          className
        )}
        {...props}
      >
        {icon && <span className="text-lg">{icon}</span>}
        <span className={cn('text-sm font-medium', earned ? 'text-gray-700' : 'text-gray-400')}>
          {name}
        </span>
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };