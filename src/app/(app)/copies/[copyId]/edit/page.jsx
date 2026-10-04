"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EditGame from "@/components/EditGame";
import { useAuth } from "@/context/AuthContext";
import {
  revokePhotoPreviewUrls,
  saveOwnedCopyEdit,
} from "@/lib/copyActions";
import { buildGamePath } from "@/lib/gamePaths";

export default function EditCopyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, games } = useAuth();
  const copyId = String(params.copyId ?? "");

  const editingGame = useMemo(
    () => games.find((game) => game.id === copyId) ?? null,
    [games, copyId]
  );

  const [condition, setCondition] = useState("CIB");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [photoItems, setPhotoItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!editingGame || initialized) return;
    setCondition(editingGame.condition);
    setEstimatedValue(String(editingGame.estimated_value ?? ""));
    setVisibility(editingGame.visibility ?? "private");
    setPhotoItems(
      (editingGame.photoPaths ?? []).map((path) => ({ id: path, path }))
    );
    setUploadProgress(0);
    setInitialized(true);
  }, [editingGame, initialized]);

  useEffect(() => {
    if (games.length > 0 && !editingGame) {
      router.replace("/collection");
    }
  }, [games, editingGame, router]);

  const handleCancel = () => {
    revokePhotoPreviewUrls(photoItems);
    setPhotoItems([]);
    router.back();
  };

  const handleSave = async () => {
    if (!editingGame || !user) return;
    setIsSaving(true);
    setUploadProgress(0);
    try {
      const saved = await saveOwnedCopyEdit({
        userId: user.uid,
        editingGame,
        condition,
        estimatedValue,
        visibility,
        photoItems,
        onProgress: setUploadProgress,
      });
      revokePhotoPreviewUrls(photoItems);
      setPhotoItems([]);
      router.push(
        buildGamePath({
          platformId: saved.igdbPlatformId,
          consoleName: saved.console,
          name: saved.title,
        })
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editingGame) {
    return <p>Loading copy…</p>;
  }

  return (
    <div
      className="is-flex is-justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        <EditGame
          game={editingGame}
          condition={condition}
          setCondition={setCondition}
          estimatedValue={estimatedValue}
          setEstimatedValue={setEstimatedValue}
          visibility={visibility}
          setVisibility={setVisibility}
          photoItems={photoItems}
          setPhotoItems={setPhotoItems}
          isSaving={isSaving}
          uploadProgress={uploadProgress}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
