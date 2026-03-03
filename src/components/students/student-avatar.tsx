"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Student } from "@/types/database";

interface StudentAvatarProps {
  student: Student;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

const textSizeMap = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
};

export function StudentAvatar({ student, size = "md" }: StudentAvatarProps) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  if (student.photo_url) {
    return (
      <div
        className={`relative ${sizeMap[size]} rounded-full overflow-hidden bg-muted`}
      >
        <Image
          src={student.photo_url}
          alt={student.name}
          fill
          className="object-cover"
          sizes={size === "lg" ? "96px" : size === "md" ? "64px" : "40px"}
        />
      </div>
    );
  }

  return (
    <Avatar className={sizeMap[size]}>
      <AvatarImage src={student.photo_url ?? undefined} alt={student.name} />
      <AvatarFallback className={`${textSizeMap[size]} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
