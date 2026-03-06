import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Users, ClipboardCheck, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

type StudentBreakdown = { campus: string | null; service_slot: string | null; class_tag: string | null };

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

  // Get all active students for breakdown stats
  const { data: breakdownStudents } = await supabase
    .from("students")
    .select("campus, service_slot, class_tag")
    .eq("department_id", department?.id ?? "")
    .eq("is_active", true);

  const allStudents: StudentBreakdown[] = breakdownStudents ?? [];

  // Fetch class tag colors
  const { data: classTagRows } = await supabase
    .from("class_tags")
    .select("name, color")
    .eq("department_id", department?.id ?? "");
  const colorMap = new Map<string, string>(
    (classTagRows ?? []).map((r) => [r.name, r.color ?? "#22c55e"])
  );

  // Campus breakdown
  const campusCounts = new Map<string, number>();
  for (const s of allStudents) {
    if (s.campus) campusCounts.set(s.campus, (campusCounts.get(s.campus) ?? 0) + 1);
  }

  // Service slot breakdown
  const serviceCounts = new Map<string, number>();
  let serviceUnset = 0;
  for (const s of allStudents) {
    if (s.service_slot) {
      serviceCounts.set(s.service_slot, (serviceCounts.get(s.service_slot) ?? 0) + 1);
    } else {
      serviceUnset++;
    }
  }

  // Class tag breakdown
  const tagCounts = new Map<string, number>();
  for (const s of allStudents) {
    if (s.class_tag) tagCounts.set(s.class_tag, (tagCounts.get(s.class_tag) ?? 0) + 1);
  }

  const hasCampus = campusCounts.size > 0;
  const hasServiceSlots = serviceCounts.size > 0;
  const hasClassTags = tagCounts.size > 0;

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

        {/* Campus Breakdown */}
        {hasCampus && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {t("dashboard.byCampus")}
            </p>
            <div className="grid gap-2 grid-cols-2">
              {Array.from(campusCounts.entries()).map(([campus, count]) => (
                <Link key={campus} href={`/${locale}/dashboard/sprout/students?campus=${encodeURIComponent(campus)}`}>
                  <div className="rounded-2xl border border-border bg-card p-4 hover:border-gray-400 transition-colors cursor-pointer">
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{campus}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Service Slot Breakdown */}
        {hasServiceSlots && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {t("dashboard.byService")}
            </p>
            <div className="grid gap-2 grid-cols-3">
              {["1부", "2부"].map((slot) => (
                <Link key={slot} href={`/${locale}/dashboard/sprout/students?service=${encodeURIComponent(slot)}`}>
                  <div className="rounded-2xl border border-border bg-card p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="text-2xl font-bold text-blue-600">{serviceCounts.get(slot) ?? 0}</div>
                    <p className="text-sm text-muted-foreground mt-0.5">{slot}</p>
                  </div>
                </Link>
              ))}
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{serviceUnset}</div>
                <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.unset")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Class Tag Breakdown */}
        {hasClassTags && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {t("dashboard.byClass")}
            </p>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap gap-2">
                {Array.from(tagCounts.entries())
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([name, count]) => {
                    const color = colorMap.get(name) ?? "#22c55e";
                    return (
                      <Link
                        key={name}
                        href={`/${locale}/dashboard/sprout/students?tag=${encodeURIComponent(name)}`}
                      >
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: color + "20", borderColor: color, color }}
                        >
                          {name}
                          <span className="font-bold">{count}</span>
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

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
