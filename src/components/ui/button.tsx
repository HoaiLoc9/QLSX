import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-semibold text-white bg-amber-700 hover:bg-amber-800 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
