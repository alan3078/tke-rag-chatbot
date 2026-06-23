import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function Home() {
  const user = await verifySession();

  if (user) {
    redirect("/chat");
  } else {
    redirect("/login");
  }
}
