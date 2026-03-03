import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";
import { AttendanceDatePicker } from "@/components/attendance/date-picker";
import { getOrCreateEvent } from "@/app/actions/attendance";
import { format } from "date-fns";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
  searchParams: Promise<{ date?: string }>;
};

// Get the most recent Sunday (or today if Sunday)
function getMostRecentSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 0 : dayOfWeek;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - diff);
  return format(sunday, "yyyy-MM-dd");
}

export default async function AttendancePage({ params, searchParams }: Props) {
  const { locale, departmentSlug } = await params;
  const { date: dateParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  const selectedDate = dateParam || getMostRecentSunday();

  // Get department
  const { data: department } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", departmentSlug)
    .single();

  if (!department) {
    return <div>Department not found</div>;
  }

  // Get or create event for the selected date
  const eventResult = await getOrCreateEvent(
    department.id,
    selectedDate,
    "sunday_worship"
  );

  // Get active students
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("department_id", department.id)
    .eq("is_active", true)
    .order("name");

  // Get current attendance for this event
  let attendedStudentIds = new Set<string>();
  if (eventResult.data) {
    const { data: attendanceRecords } = await supabase
      .from("attendance")
      .select("student_id")
      .eq("event_id", eventResult.data.id)
      .eq("checked_in", true);

    if (attendanceRecords) {
      attendedStudentIds = new Set(
        attendanceRecords.map((r) => r.student_id)
      );
    }
  }

  return (
    <>
      <Header title={t("attendance.title")}>
        <AttendanceDatePicker selectedDate={selectedDate} />
      </Header>

      <main className="flex-1 p-4 lg:p-6">
        {!students || students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">{t("students.noStudents")}</p>
          </div>
        ) : eventResult.data ? (
          <AttendanceGrid
            students={students}
            eventId={eventResult.data.id}
            attendedStudentIds={attendedStudentIds}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">{t("attendance.noEventYet")}</p>
          </div>
        )}
      </main>
    </>
  );
}
