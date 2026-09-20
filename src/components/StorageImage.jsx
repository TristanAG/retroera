"use client";

import { useEffect, useState } from "react";
import { getStorageImageUrl } from "../storageService";

const StorageImage = ({ path, alt, className = "", ...props }) => {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUrl("");

    if (!path) return undefined;

    getStorageImageUrl(path)
      .then((loadedUrl) => {
        if (active) setUrl(loadedUrl);
      })
      .catch((error) => {
        console.error("Unable to load storage image", path, error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
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
