import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-600',
      primary: 'bg-[#FF6B35]/10 text-[#FF6B35]',
      secondary: 'bg-[#2D5BFF]/10 text-[#2D5BFF]',
      success: 'bg-[#10B981]/10 text-[#10B981]',
      warning: 'bg-[#F59E0B]/10 text-[#F59E0B]',
      danger: 'bg-[#EF4444]/10 text-[#EF4444]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag };