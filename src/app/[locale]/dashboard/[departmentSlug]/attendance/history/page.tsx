import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        <Card>
          <CardHeader>
            <CardTitle>{t("attendance.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!events || events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {t("common.noData")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("attendance.date")}</TableHead>
                      <TableHead>{t("attendance.eventType")}</TableHead>
                      <TableHead className="text-right">
                        {t("attendance.checkedIn")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("dashboard.attendanceRate")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const count = eventAttendance[event.id] ?? 0;
                      const rate =
                        totalStudents && totalStudents > 0
                          ? Math.round((count / totalStudents) * 100)
                          : 0;
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {format(new Date(event.date + "T00:00:00"), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {event.type === "sunday_worship"
                                ? t("attendance.sundayWorship")
                                : t("attendance.special")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {count} / {totalStudents ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={rate >= 80 ? "default" : "secondary"}
                              className={
                                rate >= 80
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }
                            >
                              {rate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
