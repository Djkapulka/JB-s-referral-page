import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <span className="text-sm font-semibold uppercase tracking-wide text-brand">
        JB&apos;s Exterior Cleaning
      </span>
      <h1 className="text-4xl font-extrabold leading-tight">
        Give $25. Get $50.
      </h1>
      <p className="text-muted-foreground">
        Every JB&apos;s customer has a personal referral link. If you were
        sent here without one, ask your JB&apos;s technician or check your
        latest invoice for your link.
      </p>
      <Card className="w-full">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Looking for the admin dashboard?{" "}
          <Link href="/admin/login" className="font-semibold text-brand">
            Log in here
          </Link>
          .
        </CardContent>
      </Card>
    </main>
  );
}
