"use client";

import StorageImage from "./StorageImage";

const CopyCard = ({ copy, displayName, onSelect }) => (
  <button
    type="button"
    className="copy-card"
    onClick={() => onSelect(copy)}
    aria-label={`View ${displayName}'s ${copy.title} copy`}
  >
    <StorageImage
      path={copy.photoPaths?.[0]}
      alt={`${copy.title} owned by ${displayName}`}
      className="copy-card__image"
    />
    <span className="copy-card__body">
      <strong>{displayName}</strong>
      <span>{copy.condition}</span>
      <span className="tag is-light">Not for sale</span>
    </span>
  </button>
);

export default CopyCard;
