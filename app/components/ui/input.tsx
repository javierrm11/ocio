import { InputHTMLAttributes } from 'react';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input 
      className={`w-full px-3 py-2 border border-weai-border rounded-weai focus:outline-none focus:ring-2 focus:ring-weai-secondary/50 bg-white ${className}`}
      {...props}
    />
  );
};