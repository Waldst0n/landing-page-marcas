import type { ReactNode } from "react";
import { colors } from "../utils/Colors";

type ButtonProps = {
  title: string;
  onClick?: () => void;
  width?: string;
  icon?: ReactNode;
  reversed?: boolean;
  className?: string;
};

function Button({
  title,
  onClick,
  width = "full",
  icon,
  reversed,
  className,
}: ButtonProps) {
  return (
    <>
      <a
        href="#action"
        className={`flex items-center justify-center ${
          width ?? "w-full"
        } p-4 h-12  text-white text-center py-3 rounded-full shadow-xl bg-purple-500 hover:bg-purple-600 transition-colors duration-300 ${className}`}
        onClick={onClick}
      >
        {!reversed ? (
          <>
            <p className="text-xl uppercase font-bold mr-2 ">{title}</p>
            {icon}
          </>
        ) : (
          <>
            {icon}
            <p className="text-xl uppercase font-bold ml-2 ">{title}</p>
          </>
        )}
      </a>
    </>
  );
}

export default Button;
