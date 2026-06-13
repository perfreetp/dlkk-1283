import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-[#2D5BFF]/20 focus:border-[#2D5BFF]',
            'transition-all duration-200',
            error && 'border-[#EF4444] focus:ring-[#EF4444]/20 focus:border-[#EF4444]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };