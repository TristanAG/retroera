"use client";

import Profile from "@/components/Profile";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div
      className="is-flex is-justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        <Profile user={user} />
      </div>
    </div>
  );
}
