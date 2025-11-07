import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const EvervaultCard = ({ text, className }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "relative h-[250px] w-full rounded-3xl border border-white/[0.2] bg-transparent p-8 overflow-hidden",
        className
      )}
    >
      <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white" />

      <EvervaultCardPattern
        mousePosition={mousePosition}
        isHovering={isHovering}
      />
      <div className="relative z-20 flex items-center justify-center h-full">
        <p className="text-2xl font-bold text-white text-center">{text}</p>
      </div>
    </div>
  );
};

const EvervaultCardPattern = ({ mousePosition, isHovering }) => {
  const maskImage = `radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 [mask-image:linear-gradient(white,transparent)] z-[1]">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-700 opacity-0"
          animate={{
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={style}
        />
        <motion.div
          className="absolute inset-0 opacity-0 mix-blend-overlay"
          animate={{
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={style}
        >
          <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
            {generateRandomString(1500)}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const Icon = ({ className, ...rest }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

const generateRandomString = (length) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
