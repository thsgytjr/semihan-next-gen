import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Users, ClipboardCheck, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const supabase = await createClient();

  // Get the sprout department
  const { data: department } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", "sprout")
    .single();

  // Get student count
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("department_id", department?.id ?? "");

  // Get today's attendance
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEvent } = await supabase
    .from("events")
    .select("id")
    .eq("department_id", department?.id ?? "")
    .eq("date", today)
    .single();

  let attendanceCount = 0;
  if (todayEvent) {
    const { count } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("event_id", todayEvent.id)
      .eq("checked_in", true);
    attendanceCount = count ?? 0;
  }

  const attendanceRate =
    studentCount && studentCount > 0
      ? Math.round((attendanceCount / studentCount) * 100)
      : 0;

  const stats = [
    {
      title: t("dashboard.totalStudents"),
      value: studentCount ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t("dashboard.todayAttendance"),
      value: attendanceCount,
      icon: ClipboardCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: t("dashboard.attendanceRate"),
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <>
      <Header title={t("dashboard.title")} />

      <main className="flex-1 p-4 lg:p-6 space-y-5">
        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.title} className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-3 gap-1.5 text-center">
              <div className={`rounded-xl p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold leading-none">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">빠른 이동</p>
          <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
            <Link href={`/${locale}/dashboard/sprout/attendance`}>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-green-500/30 hover:shadow-md hover:shadow-green-500/5 active:scale-[0.98] transition-all cursor-pointer">
                <div className="rounded-xl p-3 bg-green-100 dark:bg-green-900/30 shrink-0">
                  <ClipboardCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("nav.attendance")}</p>
                  <p className="text-sm text-muted-foreground">주일 출석 체크</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </Link>

            <Link href={`/${locale}/dashboard/sprout/students`}>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-blue-500/30 hover:shadow-md hover:shadow-blue-500/5 active:scale-[0.98] transition-all cursor-pointer">
                <div className="rounded-xl p-3 bg-blue-100 dark:bg-blue-900/30 shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{t("nav.students")}</p>
                  <p className="text-sm text-muted-foreground">학생 목록 관리</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
