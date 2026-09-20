"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CollectionPage() {
  const { user, games, logOut } = useAuth();
  const router = useRouter();

  const handleLogOut = async () => {
    await logOut();
    router.replace("/login");
  };

  return (
    <div>
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
        <h1 className="title mb-0">My Collection</h1>
        <button type="button" className="button is-light" onClick={handleLogOut}>
          Log Out
        </button>
      </div>
      <p className="subtitle">
        Signed in as {user?.email}. {games.length} copies loaded.
      </p>
      <p className="has-text-grey">
        Full collection view ships in Session 2 of the Next.js migration.
      </p>
    </div>
  );
}
