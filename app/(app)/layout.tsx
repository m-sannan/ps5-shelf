import { ProfileGate } from "@/components/profile-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProfileGate>{children}</ProfileGate>;
}
