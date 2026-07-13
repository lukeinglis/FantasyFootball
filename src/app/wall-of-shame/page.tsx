import { redirect } from "next/navigation";

export default function WallOfShameRedirect() {
  redirect("/records?tab=hall-of-shame");
}
