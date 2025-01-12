export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`
      bg-surface-light-card dark:bg-surface-dark-card 
      backdrop-blur-xl 
      rounded-2xl 
      border border-border-light dark:border-border-dark
      ${className}
    `}>
      {children}
    </div>
  );
}; 