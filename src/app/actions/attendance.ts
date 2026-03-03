"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleAttendance(
  studentId: string,
  eventId: string,
  checkedIn: boolean
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (checkedIn) {
    // Upsert attendance record
    const { error } = await supabase.from("attendance").upsert(
      {
        student_id: studentId,
        event_id: eventId,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      },
      {
        onConflict: "student_id,event_id",
      }
    );

    if (error) return { error: error.message };
  } else {
    // Remove attendance record
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("student_id", studentId)
      .eq("event_id", eventId);

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getOrCreateEvent(
  departmentId: string,
  date: string,
  type: "sunday_worship" | "special" = "sunday_worship"
) {
  const supabase = await createClient();

  // Try to find existing event
  const { data: existingEvent } = await supabase
    .from("events")
    .select("*")
    .eq("department_id", departmentId)
    .eq("date", date)
    .eq("type", type)
    .single();

  if (existingEvent) {
    return { data: existingEvent };
  }

  // Create new event
  const title =
    type === "sunday_worship"
      ? `주일 예배 - ${date}`
      : `특별 행사 - ${date}`;

  const { data: newEvent, error } = await supabase
    .from("events")
    .insert({
      title,
      date,
      department_id: departmentId,
      type,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { data: newEvent };
}

export async function getAttendanceForEvent(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendance")
    .select("*, students(*)")
    .eq("event_id", eventId);

  if (error) return { error: error.message };
  return { data };
}
