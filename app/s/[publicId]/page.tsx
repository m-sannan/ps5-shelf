import { PublicShelf } from "@/components/public-shelf";

export default async function PublicShelfPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <PublicShelf publicId={publicId} />;
}
