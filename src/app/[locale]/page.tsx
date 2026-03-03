import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleRoot({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Root page redirects to dashboard
  redirect({ href: "/dashboard", locale });
}
