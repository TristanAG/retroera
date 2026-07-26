import { useEffect, useState } from "react";
import { loadStorageImage } from "../storageService";

const StorageImage = ({ path, alt, className = "", ...props }) => {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setFailed(false);
    setUrl("");

    if (!path) return undefined;
    loadStorageImage(path)
      .then((loadedUrl) => {
        objectUrl = loadedUrl;
        if (active) setUrl(loadedUrl);
        else URL.revokeObjectURL(loadedUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div
        className={`${className} storage-image-placeholder`}
        role="img"
        aria-label={failed ? `${alt} unavailable` : alt}
      />
    );
  }

  if (!url) {
    return <div className={`${className} storage-image-placeholder is-loading`} />;
  }

  return <img src={url} alt={alt} className={className} {...props} />;
};

export default StorageImage;
