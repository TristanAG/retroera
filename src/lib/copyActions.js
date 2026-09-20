import {
  createCopyDraft,
  deleteCopyRecord,
  finalizeCopy,
  markCopyPrivate,
  removeDraftCopy,
  updateCopy,
} from "@/lib/copyService";
import { CONSOLE_TO_IGDB_PLATFORM } from "@/lib/igdbService";
import { deletePhotos, uploadCopyPhoto } from "@/lib/storageService";

export async function deleteOwnedCopy(game) {
  if (!window.confirm(`Remove "${game.title}" from your collection?`)) {
    return false;
  }

  await markCopyPrivate(game.id);
  await deletePhotos(game.photoPaths ?? []);
  await deleteCopyRecord(game.id);
  return true;
}

export async function addOwnedCopy({
  userId,
  gameTitle,
  consoleName,
  condition,
  estimatedValue,
  igdbId,
  visibility,
  photoItems,
  onProgress,
}) {
  if (!gameTitle || !consoleName || !estimatedValue) {
    throw new Error("Fill in all fields!");
  }
  if (!igdbId) {
    throw new Error("Select a game with a valid IGDB ID.");
  }

  const platformId = CONSOLE_TO_IGDB_PLATFORM[consoleName];
  if (!platformId) {
    throw new Error("This console does not have a valid IGDB platform.");
  }

  let copyId = null;
  const uploadedPaths = [];

  try {
    copyId = await createCopyDraft({
      title: gameTitle,
      console: consoleName,
      condition,
      estimatedValue: parseFloat(estimatedValue),
      igdbId,
      igdbPlatformId: platformId,
    });

    for (let index = 0; index < photoItems.length; index += 1) {
      const item = photoItems[index];
      const path = await uploadCopyPhoto(
        userId,
        copyId,
        item.file,
        (progress) =>
          onProgress?.(
            Math.round(((index + progress / 100) / photoItems.length) * 100)
          )
      );
      uploadedPaths.push(path);
    }

    await finalizeCopy(copyId, {
      condition,
      estimatedValue: parseFloat(estimatedValue),
      visibility,
      photoPaths: uploadedPaths,
    });

    return {
      igdbId: String(igdbId),
      igdbPlatformId: platformId,
      title: gameTitle,
      console: consoleName,
    };
  } catch (error) {
    await deletePhotos(uploadedPaths).catch(console.error);
    if (copyId) await removeDraftCopy(copyId);
    throw error;
  }
}

export async function saveOwnedCopyEdit({
  userId,
  editingGame,
  condition,
  estimatedValue,
  visibility,
  photoItems,
  onProgress,
}) {
  if (!editingGame || !estimatedValue) {
    throw new Error("Fill in all fields!");
  }

  const newlyUploaded = [];

  try {
    if (editingGame.visibility === "public") {
      await markCopyPrivate(editingGame.id);
    }

    const finalPaths = [];
    const newItems = photoItems.filter((item) => item.file);
    let uploadedCount = 0;

    for (const item of photoItems) {
      if (item.path) {
        finalPaths.push(item.path);
        continue;
      }
      const path = await uploadCopyPhoto(
        userId,
        editingGame.id,
        item.file,
        (progress) =>
          onProgress?.(
            Math.round(
              ((uploadedCount + progress / 100) / Math.max(1, newItems.length)) *
                100
            )
          )
      );
      uploadedCount += 1;
      newlyUploaded.push(path);
      finalPaths.push(path);
    }

    await updateCopy(editingGame.id, {
      condition,
      estimatedValue: parseFloat(estimatedValue),
      visibility,
      photoPaths: finalPaths,
    });

    const removedPaths = (editingGame.photoPaths ?? []).filter(
      (path) => !finalPaths.includes(path)
    );
    await deletePhotos(removedPaths).catch((cleanupError) => {
      console.warn("Copy saved, but some removed photos need cleanup", cleanupError);
      throw new Error(
        "Your copy was saved, but one or more removed photos could not be cleaned up."
      );
    });

    return {
      igdbId: String(editingGame.igdbId ?? editingGame.igdb_id),
      igdbPlatformId: editingGame.igdbPlatformId ?? editingGame.igdb_platform_id,
      title: editingGame.title,
      console: editingGame.console,
    };
  } catch (error) {
    await deletePhotos(newlyUploaded).catch(console.error);
    if (editingGame.visibility === "public") {
      await updateCopy(editingGame.id, {
        condition: editingGame.condition,
        estimatedValue: editingGame.estimated_value,
        visibility: "public",
        photoPaths: editingGame.photoPaths ?? [],
      }).catch(console.error);
    }
    throw error;
  }
}

export function revokePhotoPreviewUrls(photoItems) {
  photoItems.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
}
