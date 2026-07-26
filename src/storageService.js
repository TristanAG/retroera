import { storage } from "./firebase";
import {
  deleteObject,
  getBlob,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

export const MAX_COPY_PHOTOS = 5;
export const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1800;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const validatePhotoFile = (file) => {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Photos must be JPEG, PNG, or WebP images");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Each original photo must be 12 MB or smaller");
  }
};

const loadImage = async (file) => {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const preparePhoto = async (file) => {
  validatePhotoFile(file);
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to process this image");
  context.drawImage(image, 0, 0, width, height);
  image.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Unable to compress this image"));
      },
      "image/webp",
      0.84
    );
  });
  return blob;
};

const photoId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const uploadCopyPhoto = async (
  ownerId,
  copyId,
  file,
  onProgress = () => {}
) => {
  const blob = await preparePhoto(file);
  const path = `users/${ownerId}/copies/${copyId}/${photoId()}.webp`;
  const upload = uploadBytesResumable(ref(storage, path), blob, {
    contentType: "image/webp",
    customMetadata: { copyId, ownerId },
  });

  await new Promise((resolve, reject) => {
    upload.on(
      "state_changed",
      (snapshot) =>
        onProgress(
          snapshot.totalBytes
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0
        ),
      reject,
      resolve
    );
  });
  return path;
};

export const getStorageImageUrl = async (path) => {
  if (!path) return null;
  return getDownloadURL(ref(storage, path));
};

export const loadStorageImage = async (path, maxBytes = 8 * 1024 * 1024) => {
  try {
    return await getStorageImageUrl(path);
  } catch {
    const blob = await getBlob(ref(storage, path), maxBytes);
    return URL.createObjectURL(blob);
  }
};

export const deletePhoto = async (path) => {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (error?.code !== "storage/object-not-found") throw error;
  }
};

export const deletePhotos = async (paths = []) => {
  const results = await Promise.allSettled(paths.map(deletePhoto));
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    throw new Error(`Unable to delete ${failures.length} photo(s)`);
  }
};
