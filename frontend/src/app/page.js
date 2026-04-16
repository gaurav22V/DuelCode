import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Path to your NextAuth config
import ArenaClient from "@/components/ArenaClient";

export default async function ArenaPage() {
  // Fetch session on the server
  const session = await getServerSession(authOptions);

  return (
    <main className="p-8">
      {/* Pass only the session data the client actually needs */}
      <ArenaClient user={session?.user || null} />
    </main>
  );
}
