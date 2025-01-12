'use client'

export const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Top right gradient */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-200/40 to-purple-200/40 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl"
        style={{ transform: 'translate(25%, -25%)' }}
      />

      {/* Bottom left gradient */}
      <div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/40 to-indigo-200/40 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-full blur-3xl"
        style={{ transform: 'translate(-25%, 25%)' }}
      />

      {/* Optional center pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
    </div>
  );
}; 