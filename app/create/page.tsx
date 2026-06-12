import { CreateExperience } from "@/components/create-experience";
import { getCurrentUser, isUserAdmin } from "@/lib/admin";

export default async function CreatePage() {
  const user = await getCurrentUser();
  const admin = await isUserAdmin(user?.id);
  return <CreateExperience isAdmin={admin} />;
}
