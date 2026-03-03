import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { format } from "date-fns";

type Props = {
  params: Promise<{ locale: string; departmentSlug: string }>;
};

export default async function AttendanceHistoryPage({ params }: Props) {
  const { locale, departmentSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  // Get department
  const { data: department } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", departmentSlug)
    .single();

  if (!department) {
    return <div>Department not found</div>;
  }

  // Get events with attendance counts
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("department_id", department.id)
    .order("date", { ascending: false })
    .limit(50);

  // Get total students count
  const { count: totalStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("department_id", department.id)
    .eq("is_active", true);

  // Get attendance counts per event
  const eventAttendance: Record<string, number> = {};
  if (events && events.length > 0) {
    for (const event of events) {
      const { count } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("checked_in", true);
      eventAttendance[event.id] = count ?? 0;
    }
  }

  return (
    <>
      <Header title={t("attendance.history")} />

      <main className="flex-1 p-4 lg:p-6">
        {!events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-sm">{t("common.noData")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const count = eventAttendance[event.id] ?? 0;
              const rate =
                totalStudents && totalStudents > 0
                  ? Math.round((count / totalStudents) * 100)
                  : 0;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card"
                >
                  {/* Rate indicator */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                    rate >= 80
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : rate >= 50
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }`}>
                    {rate}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {format(new Date(event.date + "T00:00:00"), "yyyy년 MM월 dd일")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.type === "sunday_worship"
                        ? t("attendance.sundayWorship")
                        : t("attendance.special")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-base">{count}<span className="text-muted-foreground font-normal text-xs">/{totalStudents ?? 0}</span></p>
                    <p className="text-xs text-muted-foreground">명 출석</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
