"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddGame from "@/components/AddGame";
import { useAuth } from "@/context/AuthContext";
import { addOwnedCopy, revokePhotoPreviewUrls } from "@/lib/copyActions";
import {
  buildGamePath,
  clearAddCopyPrefill,
  readAddCopyPrefill,
} from "@/lib/gamePaths";

export default function AddCopyPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [gameTitle, setGameTitle] = useState("");
  const [consoleName, setConsoleName] = useState("");
  const [condition, setCondition] = useState("CIB");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [igdbId, setIgdbId] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [photoItems, setPhotoItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;
    const prefill = readAddCopyPrefill();
    if (prefill) {
      if (prefill.title) setGameTitle(prefill.title);
      if (prefill.console) setConsoleName(prefill.console);
      if (prefill.igdbId) setIgdbId(String(prefill.igdbId));
      setCondition("CIB");
      setEstimatedValue("");
      setVisibility("private");
      setPhotoItems([]);
      clearAddCopyPrefill();
    }
    setPrefilled(true);
  }, [prefilled]);

  const handleAddGame = async () => {
    if (!user) return;
    setIsSaving(true);
    setUploadProgress(0);
    try {
      const added = await addOwnedCopy({
        userId: user.uid,
        gameTitle,
        consoleName,
        condition,
        estimatedValue,
        igdbId,
        visibility,
        photoItems,
        onProgress: setUploadProgress,
      });
      revokePhotoPreviewUrls(photoItems);
      setPhotoItems([]);
      router.push(
        buildGamePath({
          platformId: added.igdbPlatformId,
          consoleName: added.console,
          name: added.title,
        })
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="is-flex is-justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        <AddGame
          gameTitle={gameTitle}
          setGameTitle={setGameTitle}
          consoleName={consoleName}
          setConsoleName={setConsoleName}
          condition={condition}
          setCondition={setCondition}
          estimatedValue={estimatedValue}
          setEstimatedValue={setEstimatedValue}
          igdbId={igdbId}
          setIgdbId={setIgdbId}
          visibility={visibility}
          setVisibility={setVisibility}
          photoItems={photoItems}
          setPhotoItems={setPhotoItems}
          isSaving={isSaving}
          uploadProgress={uploadProgress}
          handleAddGame={handleAddGame}
        />
      </div>
    </div>
  );
}
