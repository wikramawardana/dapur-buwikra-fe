import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}) => {
  // Neo-Brutalism base styles: border-black, sharp corners, hard shadow
  const baseStyles =
    "px-6 py-3 font-bold border-2 border-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

  const variants = {
    // Blue primary
    primary:
      "bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700",
    // White secondary
    secondary:
      "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50",
    // Transparent outline
    outline:
      "bg-transparent text-blue-700 border-2 border-blue-700 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] hover:bg-blue-50",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
