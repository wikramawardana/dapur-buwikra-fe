import type React from "react";

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  className = "",
  onClick,
  hoverEffect = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border-4 border-black shadow-neo 
        p-6 relative overflow-hidden
        ${
          hoverEffect
            ? "transition-all duration-200 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-neo-hover cursor-pointer"
            : ""
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "black";
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseStyle =
    "font-bold text-lg border-4 border-black px-6 py-3 shadow-neo active:shadow-none active:translate-x-[5px] active:translate-y-[5px] transition-all duration-150";

  const variants = {
    primary: "bg-brut-blue text-white hover:bg-blue-700",
    secondary: "bg-white text-black hover:bg-gray-100",
    black: "bg-black text-white hover:bg-gray-800",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
