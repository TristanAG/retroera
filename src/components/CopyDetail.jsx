"use client";

import { useEffect, useState } from "react";
import { submitCopyReport } from "@/lib/copyService";
import { getProfile } from "@/lib/profileService";
import StorageImage from "./StorageImage";

const CopyDetail = ({ copy, onBack }) => {
  const [displayName, setDisplayName] = useState("Collector");
  const [reportReason, setReportReason] = useState("incorrect-details");
  const [reportMessage, setReportMessage] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile(copy.ownerId).then((profile) => {
      if (active) setDisplayName(profile.displayName);
    });
    return () => {
      active = false;
    };
  }, [copy.ownerId]);

  const report = async () => {
    setReporting(true);
    setReportMessage("");
    try {
      await submitCopyReport(copy.id, reportReason);
      setReportMessage("Report submitted for review.");
    } catch (error) {
      setReportMessage(error.message || "Unable to submit report.");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="copy-detail">
      <button type="button" className="button is-small mb-4" onClick={onBack}>
        ← Back to game
      </button>
      <div className="copy-detail__header">
        <div>
          <h2 className="title mb-2">{copy.title}</h2>
          <p>
            <strong>Owner:</strong> {displayName}
          </p>
          <p>
            <strong>Console:</strong> {copy.console}
          </p>
          <p>
            <strong>Condition:</strong> {copy.condition}
          </p>
        </div>
        <span className="tag is-medium">Not currently for sale</span>
      </div>

      {copy.photoPaths?.length ? (
        <div className="copy-detail__gallery">
          {copy.photoPaths.map((path, index) => (
            <StorageImage
              key={path}
              path={path}
              alt={`${copy.title} copy photo ${index + 1}`}
              className="copy-detail__image"
            />
          ))}
        </div>
      ) : (
        <p className="has-text-grey mt-4">This collector has not added photos.</p>
      )}

      <details className="copy-detail__report mt-5">
        <summary>Report this copy</summary>
        <div className="field mt-3">
          <label className="label">Reason</label>
          <select
            className="select"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
          >
            <option value="incorrect-details">Incorrect details</option>
            <option value="inappropriate-image">Inappropriate image</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="button"
          className="button is-small"
          disabled={reporting}
          onClick={report}
        >
          {reporting ? "Submitting…" : "Submit report"}
        </button>
        {reportMessage && <p className="help mt-2">{reportMessage}</p>}
      </details>
    </div>
  );
};

export default CopyDetail;
