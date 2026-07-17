import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginScene } from "@/components/login-scene";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return <LoginScene />;
}
