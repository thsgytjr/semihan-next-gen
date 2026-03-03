"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface AttendanceDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
}

export function AttendanceDatePicker({
  selectedDate,
}: AttendanceDatePickerProps) {
  const t = useTranslations("attendance");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const dateLocale = locale === "ko" ? ko : enUS;
  const date = parseISO(selectedDate);

  function handleDateSelect(newDate: Date | undefined) {
    if (newDate) {
      const formatted = format(newDate, "yyyy-MM-dd");
      // Update URL search params with selected date
      router.push(`${pathname}?date=${formatted}`);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2 rounded-xl h-9 px-3 text-sm",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="hidden sm:inline">{format(date, "PPP", { locale: dateLocale })}</span>
          <span className="sm:hidden">{format(date, "MM/dd (EEE)", { locale: dateLocale })}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
