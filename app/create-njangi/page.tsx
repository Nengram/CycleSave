import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CreateNjangiForm from "./CreateNjangiForm";

export default async function CreateNjangiPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/create-njangi");
  }

  return <CreateNjangiForm userName={session.name} />;
}
