import { redirect } from "next/navigation";

export default function DraftTrendsRedirect() {
  redirect("/draft?tab=trends");
}
