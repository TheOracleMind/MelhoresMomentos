import { CreateExperience } from "@/components/create-experience";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreateExperience mode="edit" pageId={id} />;
}
