import type { HTMLAttributes, ReactNode } from 'react';

export const Card = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => <div className={`p-6 border-b border-gray-200 ${className}`}>{children}</div>;

export const CardBody = ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => <div className={`p-6 ${className}`}>{children}</div>;

export const CardFooter = ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={`p-6 border-t border-gray-200 bg-gray-50 ${className}`}>{children}</div>
);
