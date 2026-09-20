"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/context/AuthContext";

export default function AppShellLayout({ children }) {
  const { user, loading, migrationIssues, logOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const handleLogOut = async () => {
    await logOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div
        className="section is-flex is-justify-content-center is-align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="section">
      <Navigation user={user} onLogOut={handleLogOut} />
      {migrationIssues.length > 0 && (
        <div className="notification is-warning">
          <strong>Some legacy games need migration attention.</strong>
          <ul className="mt-2">
            {migrationIssues.map((issue) => (
              <li key={issue.legacyGameId}>
                {issue.title}: {issue.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ padding: "15px" }}>{children}</div>
    </section>
  );
}
