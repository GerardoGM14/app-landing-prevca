import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
    <div>
      {eyebrow && (
        <p className="text-xs font-ui uppercase tracking-widest text-prevca-blue mb-2">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tighter text-prevca-dark">
        {title}
      </h1>
      <div className="w-16 h-1.5 bg-prevca-blue mt-4" />
      {description && (
        <p className="text-gray-500 font-body mt-4 max-w-2xl">{description}</p>
      )}
    </div>
    {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
  </div>
);
