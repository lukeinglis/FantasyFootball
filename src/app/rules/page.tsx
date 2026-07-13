import { redirect } from "next/navigation";

export default function RulesRedirect() {
  redirect("/league?tab=rules");
}
