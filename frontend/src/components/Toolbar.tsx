import { Button } from './Primitives';
import { Icon } from './Icons';
import { clsx } from 'clsx';

interface ToolbarProps {
  actions: Array<{
    label: string;
    icon?: keyof typeof import('./Icons').Icons;
    variant?: 'primary' | 'secondary' | 'subtle' | 'danger' | 'ghost';
    onClick: () => void;
    disabled?: boolean;
  }>;
  className?: string;
}

export function Toolbar({ actions, className }: ToolbarProps) {
  return (
    <div className={clsx(
      'fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50',
      'sm:hidden', // Only show on mobile
      className
    )}>
      <div className="flex space-x-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex-1"
          >
            {action.icon && (
              <Icon name={action.icon} size={16} className="mr-2" />
            )}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
