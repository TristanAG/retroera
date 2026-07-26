import { MAX_COPY_PHOTOS, validatePhotoFile } from "../storageService";
import StorageImage from "./StorageImage";

const PhotoManager = ({ items, setItems, disabled = false }) => {
  const addFiles = (event) => {
    const files = [...event.target.files];
    event.target.value = "";
    if (items.length + files.length > MAX_COPY_PHOTOS) {
      alert(`You can add up to ${MAX_COPY_PHOTOS} photos.`);
      return;
    }

    try {
      files.forEach(validatePhotoFile);
      setItems((current) => [
        ...current,
        ...files.map((file) => ({
          id:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
    } catch (error) {
      alert(error.message);
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

  return (
    <div className="field photo-manager">
      <label className="label">Photos</label>
      <p className="help mb-2">
        Add up to five photos. The first image is the primary preview. Location
        metadata is removed during processing.
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
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Move photo ${index + 1} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="button is-small"
                  disabled={disabled || index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Move photo ${index + 1} later`}
                >
                  →
                </button>
                <button
                  type="button"
                  className="button is-danger is-small"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="file is-small mt-2">
        <label className="file-label">
          <input
            className="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={disabled || items.length >= MAX_COPY_PHOTOS}
            onChange={addFiles}
          />
          <span className="file-cta">
            <span className="file-label">Choose photos</span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default PhotoManager;
