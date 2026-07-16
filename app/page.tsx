import { redirect } from "next/navigation";

export default function Home() {
  // The (app) layout guard bounces unauthenticated users to /login.
  redirect("/dashboard");
}
