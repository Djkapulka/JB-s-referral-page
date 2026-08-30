import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <span className="text-sm font-semibold uppercase tracking-wide text-brand">
        JB&apos;s Exterior Cleaning
      </span>
      <h1 className="text-3xl font-extrabold">Page Not Found</h1>
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4 p-6 text-sm text-muted-foreground">
          <p>
            That link doesn&apos;t match a referral we have on file. Double-check
            the link, or ask your JB&apos;s technician for your referral link
            again.
          </p>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
