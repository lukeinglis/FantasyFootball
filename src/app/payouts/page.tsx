import { redirect } from "next/navigation";

export default function PayoutsRedirect() {
  redirect("/league?tab=payouts");
}
