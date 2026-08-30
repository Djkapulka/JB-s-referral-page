import { prisma } from "@/lib/db";
import { isJobberConfigured } from "@/lib/jobber/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function JobberStatus() {
  const configured = isJobberConfigured();
  const connection = configured
    ? await prisma.jobberConnection.findUnique({ where: { id: "singleton" } })
    : null;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Jobber Integration</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!configured && (
          <>
            <Badge variant="muted">Not Configured</Badge>
            <p className="text-muted-foreground">
              This is a Phase 2 feature. Set JOBBER_CLIENT_ID,
              JOBBER_CLIENT_SECRET, and JOBBER_REDIRECT_URI in your
              environment to enable connecting Jobber here.
            </p>
          </>
        )}
        {configured && !connection && (
          <>
            <Badge variant="default">Ready to Connect</Badge>
            <a href="/api/jobber/connect" className="font-medium text-brand hover:underline">
              Connect Jobber
            </a>
          </>
        )}
        {configured && connection && (
          <>
            <Badge variant="success">Connected</Badge>
            <p className="text-muted-foreground">
              Token expires {connection.expiresAt.toLocaleString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
