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

interface StudentFormProps {
  departmentId: string;
  student?: Student;
}

export function StudentForm({ departmentId, student }: StudentFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(student?.photo_url ?? null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
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
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function removePhoto() {
    setPreview(null);
    setCroppedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("department_id", departmentId);

    if (croppedBlob) {
      formData.delete("photo");
      formData.set("photo", croppedBlob, "photo.jpg");
    } else if (student?.photo_url && !croppedBlob) {
      formData.set("existing_photo_url", student.photo_url);
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
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t("students.notes")}
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={student?.notes ?? ""}
                  placeholder={t("students.notes")}
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
