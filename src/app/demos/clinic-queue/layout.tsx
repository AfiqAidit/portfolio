import { ClinicDemoLayoutClient } from "@/components/demos/clinic-queue/ClinicDemoLayoutClient";
import { DemoProjectHeader } from "@/components/shared/DemoProjectHeader";

export default function ClinicQueueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DemoProjectHeader
        title="Clinic queue demo"
        subtitle="Fictional GP clinic booking and live queue"
      />
      <ClinicDemoLayoutClient />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
