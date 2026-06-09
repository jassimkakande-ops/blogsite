interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4`}
      />
      <p className={`text-gray-400 ${textSizeClasses[size]}`}>{text}</p>
    </div>
  );
}

// Full page loading spinner
export function FullPageSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading spinner (for sections)
export function InlineSpinner({ text = 'Loading...', className = 'py-12' }: { text?: string; className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}