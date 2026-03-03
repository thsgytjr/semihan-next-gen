import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ClipboardCheck, TrendingUp } from "lucide-react";
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

      <main className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Link href={`/${locale}/dashboard/sprout/attendance`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-green-600" />
                  {t("nav.attendance")}
                </CardTitle>
                <CardDescription>
                  {t("attendance.title")}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/${locale}/dashboard/sprout/students`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {t("nav.students")}
                </CardTitle>
                <CardDescription>
                  {t("students.title")}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </>
  );
}
