import { redirect } from "next/navigation";

// Root path redirects to the default locale (ko)
export default function RootPage() {
  redirect("/ko");
}
