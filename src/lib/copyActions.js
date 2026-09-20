import {
  deleteCopyRecord,
  markCopyPrivate,
} from "@/lib/copyService";
import { deletePhotos } from "@/lib/storageService";

export async function deleteOwnedCopy(game) {
  if (!window.confirm(`Remove "${game.title}" from your collection?`)) {
    return false;
  }

  await markCopyPrivate(game.id);
  await deletePhotos(game.photoPaths ?? []);
  await deleteCopyRecord(game.id);
  return true;
}
