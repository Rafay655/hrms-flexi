// components/Lucide.tsx
"use client";

import * as Icons from "lucide-react";
import { twMerge } from "tailwind-merge";
import React from "react";

type IconName = keyof typeof Icons;

interface LucideProps extends React.SVGProps<SVGSVGElement> {
  icon: IconName;
  title?: string;
  className?: string;
}

export default function Lucide({ icon, className, ...props }: LucideProps) {
  const IconComponent = Icons[icon] as React.FC<React.SVGProps<SVGSVGElement>>;

  if (!IconComponent) return null;

  return (
    <IconComponent
      {...props}
      className={twMerge("stroke-1.5 w-4 h-4", className)}
    />
  );
}