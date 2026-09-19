import type { Metadata } from "next";
import { PublicShelf } from "@/components/public-shelf";
import { publicShelf } from "@/lib/cloud/engine";
import { readCloud } from "@/lib/cloud/persist";
import { crateStats, diaryLine } from "@/lib/crate";

type Props = { params: Promise<{ publicId: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  try {
    const data = await readCloud((blob) => publicShelf(blob, publicId));
    if (!data || data.privateShelf) {
      return { title: "Crate", description: "A private PS5 shelf." };
    }
    const stats = crateStats(data.games);
    const diary = diaryLine(data.games);
    const name = data.profile.name.trim() || "Crate";
    const count = stats.discs
      ? `${stats.discs} PS5 disc${stats.discs === 1 ? "" : "s"}`
      : `${stats.total} games`;
    const description = [count, diary, data.profile.city.trim()].filter(Boolean).join(" · ");
    return {
      title: `${name} — Crate`,
      description: description || "A public PS5 shelf.",
      openGraph: {
        title: `${name} — Crate`,
        description: description || "A public PS5 shelf.",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} — Crate`,
        description: description || "A public PS5 shelf.",
      },
    };
  } catch {
    return { title: "Crate" };
  }
}

export default async function PublicShelfPage({ params }: Props) {
  const { publicId } = await params;
  return <PublicShelf publicId={publicId} />;
}
