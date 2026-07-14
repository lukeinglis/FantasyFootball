import { redirect } from "next/navigation";

export default function PowerRankingsPage() {
  redirect("/stats?tab=power-rankings");
}
