import { redirect } from "next/navigation";

export default function DraftInsightsRedirect() {
  redirect("/draft?tab=insights");
}
