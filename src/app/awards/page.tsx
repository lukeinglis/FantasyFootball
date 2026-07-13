import { redirect } from "next/navigation";

export default function AwardsRedirect() {
  redirect("/records?tab=awards");
}
