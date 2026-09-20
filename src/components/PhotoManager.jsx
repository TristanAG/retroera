"use client";

import { useState } from "react";
import {
  MAX_COPY_PHOTOS,
  normalizePhotoFile,
  PHOTO_ACCEPT,
} from "../storageService";
import StorageImage from "./StorageImage";

const PhotoManager = ({ items, setItems, disabled = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = async (event) => {
    const files = [...event.target.files];
    event.target.value = "";
    if (files.length === 0) return;
    if (items.length + files.length > MAX_COPY_PHOTOS) {
      alert(`You can add up to ${MAX_COPY_PHOTOS} photos.`);
      return;
    }

    setIsProcessing(true);
    try {
      const normalizedFiles = await Promise.all(files.map(normalizePhotoFile));
      setItems((current) => [
        ...current,
        ...normalizedFiles.map((file) => ({
          id:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const remove = (index) => {
    setItems((current) => {
      const removed = current[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const move = (index, offset) => {
    setItems((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const controlsDisabled = disabled || isProcessing;

  return (
    <div className="field photo-manager">
      <label className="label">Photos</label>
      <p className="help mb-2">
        Add up to five photos in JPEG, PNG, WebP, or iPhone HEIC format. The
        first image is the primary preview. HEIC files are converted automatically,
        and location metadata is removed during processing.
      </p>
      {items.length > 0 && (
        <ol className="photo-manager__list">
          {items.map((item, index) => (
            <li key={item.id ?? item.path} className="photo-manager__item">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={`Selected copy photo ${index + 1}`}
                  className="photo-manager__preview"
                />
              ) : (
                <StorageImage
                  path={item.path}
                  alt={`Copy photo ${index + 1}`}
                  className="photo-manager__preview"
                />
              )}
              <div className="photo-manager__controls">
                {index === 0 && <span className="tag is-primary">Primary</span>}
                <button
                  type="button"
                  className="button is-small"
                  disabled={controlsDisabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move photo ${index + 1} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="button is-small"
                  disabled={controlsDisabled || index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move photo ${index + 1} later`}
                >
                  →
                </button>
                <button
                  type="button"
                  className="button is-danger is-small"
                  disabled={controlsDisabled}
                  onClick={() => remove(index)}
                >
                  remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {isProcessing && <p className="help mt-2">Processing photos…</p>}
      <div className="file is-small mt-2">
        <label className="file-label">
          <input
            className="file-input"
            type="file"
            accept={PHOTO_ACCEPT}
            multiple
            disabled={controlsDisabled || items.length >= MAX_COPY_PHOTOS}
            onChange={addFiles}
          />
          <span className="file-cta">
            <span className="file-label">
              {isProcessing ? "Processing…" : "Choose photos"}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default PhotoManager;
