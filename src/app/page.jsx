"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/collection" : "/login");
  }, [user, loading, router]);

  return (
    <div
      className="section is-flex is-justify-content-center is-align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <p>Loading...</p>
    </div>
  );
}
