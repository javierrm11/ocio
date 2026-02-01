import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: ReactNode;
}

export const Button = ({ variant = 'primary', children, className, ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-weai-primary text-white hover:bg-slate-800",
    secondary: "bg-weai-secondary text-white hover:bg-blue-600",
    outline: "border border-weai-border text-weai-primary hover:bg-slate-50"
  };

  return (
    <button 
      className={`px-4 py-2 rounded-weai font-medium transition-all disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};