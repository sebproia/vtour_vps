import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PersonalRecaps from "@/components/PersonalRecaps";
export default async function PersonalRecapsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fmes-recaps");
  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-bold text-sm"
        >
          ← Accueil
        </Link>
        <header>
          <h1 className="font-display font-black text-3xl">Mon carnet</h1>
          <p className="mt-2 text-sm text-foreground/75">
            Ton carnet personnel de découvertes culinaires, construit uniquement
            à partir de tes avis enregistrés.
          </p>
        </header>
        <PersonalRecaps />
      </div>
    </main>
  );
}
