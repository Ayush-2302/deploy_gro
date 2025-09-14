import React from 'react';
import { Card } from './Primitives';
import { Icon } from './Icons';
import { clsx } from 'clsx';

interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function Section({ 
  title, 
  subtitle, 
  actions, 
  children, 
  collapsible = false,
  defaultExpanded = true,
  className 
}: SectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <Card className={clsx('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold font-heading text-slate-900">
            {title}
          </h3>
          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Icon 
                name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                size={16} 
                className="text-slate-500" 
              />
            </button>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-600 -mt-2">
          {subtitle}
        </p>
      )}

      {/* Content */}
      {(!collapsible || isExpanded) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </Card>
  );
}
