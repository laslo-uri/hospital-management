import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/server/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homeForRole(user.role));
}
