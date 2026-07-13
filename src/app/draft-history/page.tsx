import { redirect } from "next/navigation";

export default function DraftHistoryRedirect() {
  redirect("/draft?tab=history");
}
