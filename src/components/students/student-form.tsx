"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import { createStudent, updateStudent } from "@/app/actions/students";
import { Camera, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import type { Student } from "@/types/database";

interface Teacher {
  id: string;
  display_name: string;
}

interface StudentFormProps {
  departmentId: string;
  student?: Student;
  existingTags?: string[];
  teachers?: Teacher[];
}

export function StudentForm({ departmentId, student, existingTags = [], teachers = [] }: StudentFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(student?.photo_url ?? null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [classTag, setClassTag] = useState(student?.class_tag ?? "");
  const [serviceSlot, setServiceSlot] = useState<string>(student?.service_slot ?? "");
  const [campus, setCampus] = useState<string>(student?.campus ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCropSrc(url);
    }
    e.target.value = "";
  }

  function handleCropComplete(blob: Blob) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCroppedBlob(blob);
    setPreview(URL.createObjectURL(blob));
    setPhotoRemoved(false);
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function removePhoto() {
    setPreview(null);
    setCroppedBlob(null);
    setPhotoRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("department_id", departmentId);
    formData.set("class_tag", classTag.trim());
    formData.set("service_slot", serviceSlot);
    formData.set("campus", campus);

    if (croppedBlob) {
      formData.delete("photo");
      formData.set("photo", croppedBlob, "photo.jpg");
    } else if (student?.photo_url && !photoRemoved) {
      formData.set("existing_photo_url", student.photo_url);
    }

    if (photoRemoved) {
      formData.set("remove_photo", "true");
      formData.set("existing_photo_url", student?.photo_url ?? "");
    }

    try {
      const result = student
        ? await updateStudent(student.id, formData)
        : await createStudent(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/sprout/students`);
        router.refresh();
      }
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="min-h-screen bg-background">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-screen">
          {/* Mobile-first sticky header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
            >
              {t("common.cancel")}
            </button>
            <h1 className="text-base font-semibold">
              {student ? t("students.editStudent") : t("students.addStudent")}
            </h1>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 h-8"
            >
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </div>

          <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                {preview ? (
                  <div className="relative h-28 w-28 rounded-full overflow-hidden ring-4 ring-green-500/30 shadow-lg">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-0 right-0 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 shadow-md"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-dashed border-green-400/50 bg-green-50/50 dark:bg-green-950/20 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all active:scale-95"
                  >
                    <Camera className="h-8 w-8 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                      {t("students.uploadPhoto")}
                    </span>
                  </button>
                )}
              </div>

              {preview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 hover:text-green-700 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  {t("students.changePhoto")}
                </button>
              )}

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {t("students.photoHint")}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {t("students.studentName")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={student?.name ?? ""}
                  placeholder={t("students.studentName")}
                  required
                  className="h-12 text-base rounded-xl"
                />
              </div>

              {/* Class Tag */}
              <div className="space-y-2">
                <Label htmlFor="class_tag" className="text-sm font-medium">
                  {t("students.classTag")}
                </Label>
                {existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setClassTag(classTag === tag ? "" : tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                          classTag === tag
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-background text-foreground border-border hover:border-green-400"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  id="class_tag"
                  name="class_tag_input"
                  value={classTag}
                  onChange={(e) => setClassTag(e.target.value)}
                  placeholder={t("students.classTagPlaceholder")}
                  className="h-12 text-base rounded-xl"
                  list="class-tag-suggestions"
                />
                <datalist id="class-tag-suggestions">
                  {existingTags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
              </div>

              {/* Service Slot */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("students.serviceSlot")}
                </Label>
                <div className="flex gap-2">
                  {["", "1부", "2부"].map((slot) => (
                    <button
                      key={slot || "unset"}
                      type="button"
                      onClick={() => setServiceSlot(slot)}
                      style={
                        serviceSlot === slot
                          ? { backgroundColor: "#2563eb", color: "#ffffff", borderColor: "#2563eb" }
                          : {}
                      }
                      className="flex-1 py-2 rounded-xl text-sm font-medium border border-border bg-background text-foreground hover:border-blue-400 transition-all"
                    >
                      {slot === "" ? t("students.serviceUnset") : slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campus */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("students.campus")}
                </Label>
                <div className="flex gap-2">
                  {["", "노스", "캐롤튼"].map((c) => (
                    <button
                      key={c || "unset"}
                      type="button"
                      onClick={() => setCampus(c)}
                      style={
                        campus === c
                          ? { backgroundColor: "#16a34a", color: "#ffffff", borderColor: "#16a34a" }
                          : {}
                      }
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border bg-background text-foreground hover:border-green-400 transition-all"
                    >
                      {c === "" ? t("students.campusUnset") : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Teacher */}
              {teachers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="teacher_id" className="text-sm font-medium">
                    {t("students.teacher")}
                  </Label>
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    defaultValue={student?.teacher_id ?? ""}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">{t("students.noTeacher")}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="birth_date" className="text-sm font-medium">
                  {t("students.birthDate")}
                </Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={student?.birth_date ?? ""}
                  className="h-12 text-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduation_date" className="text-sm font-medium">
                  {t("students.graduationDate")}
                </Label>
                <Input
                  id="graduation_date"
                  name="graduation_date"
                  type="date"
                  defaultValue={student?.graduation_date ?? ""}
                  className="h-12 text-base rounded-xl"
                />
              </div>

              {/* Parent Info section */}
              <div className="rounded-xl border border-border p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">{t("students.parentInfo")}</p>
                <div className="space-y-2">
                  <Label htmlFor="parent_name" className="text-sm font-medium">
                    {t("students.parentName")}
                  </Label>
                  <Input
                    id="parent_name"
                    name="parent_name"
                    defaultValue={student?.parent_name ?? ""}
                    placeholder={t("students.parentName")}
                    className="h-12 text-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone" className="text-sm font-medium">
                    {t("students.parentPhone")}
                  </Label>
                  <Input
                    id="parent_phone"
                    name="parent_phone"
                    type="tel"
                    defaultValue={student?.parent_phone ?? ""}
                    placeholder="010-0000-0000"
                    className="h-12 text-base rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t("students.notes")}
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={student?.notes ?? ""}
                  placeholder={t("students.notes")}
                  rows={2}
                  className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prayer_request" className="text-sm font-medium">
                  {t("students.prayerRequest")}
                </Label>
                <textarea
                  id="prayer_request"
                  name="prayer_request"
                  defaultValue={student?.prayer_request ?? ""}
                  placeholder={t("students.prayerRequestPlaceholder")}
                  rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
