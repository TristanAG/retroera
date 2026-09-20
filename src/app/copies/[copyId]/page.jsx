"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CopyDetail from "@/components/CopyDetail";
import { getPublicCopy } from "@/lib/copyService";

export default function PublicCopyDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const copyId = String(params.copyId ?? "");

  const [copy, setCopy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCopy() {
      setLoading(true);
      setError("");
      try {
        const loaded = await getPublicCopy(copyId);
        if (!active) return;
        if (!loaded || loaded.visibility !== "public") {
          setError("This copy is not available.");
          setCopy(null);
        } else {
          setCopy(loaded);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load copy.");
          setCopy(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (copyId) loadCopy();
    return () => {
      active = false;
    };
  }, [copyId]);

  const handleBack = () => {
    const from = searchParams.get("from");
    if (from === "game" && copy) {
      const query = new URLSearchParams({
        from: "browse",
        title: copy.title,
        console: copy.console,
      });
      router.push(
        `/games/${copy.igdbId}/${copy.igdbPlatformId}?${query.toString()}`
      );
      return;
    }
    router.back();
  };

  if (loading) {
    return (
      <section className="section">
        <div style={{ padding: "15px" }}>
          <p>Loading copy…</p>
        </div>
      </section>
    );
  }

  if (error || !copy) {
    return (
      <section className="section">
        <div style={{ padding: "15px" }}>
          <p>{error || "Copy not found."}</p>
          <button type="button" className="button is-small mt-3" onClick={handleBack}>
            Go back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div
        className="is-flex is-justify-content-center"
        style={{ maxWidth: "800px", width: "100%", margin: "0 auto", padding: "15px" }}
      >
        <CopyDetail copy={copy} onBack={handleBack} />
      </div>
    </section>
  );
}
