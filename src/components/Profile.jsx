import { useEffect, useState } from "react";
import { fallbackDisplayName, getProfile, saveMyProfile } from "../profileService";

const Profile = ({ user }) => {
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile(user.uid).then((profile) => {
      if (active) setDisplayName(profile.displayName);
    });
    return () => {
      active = false;
    };
  }, [user.uid]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const profile = await saveMyProfile(displayName);
      setDisplayName(profile.displayName);
      setMessage("Public profile saved.");
    } catch (error) {
      const message =
        error.code === "permission-denied"
          ? "Profile save was blocked by Firestore rules. Deploy the project rules with: npx firebase-tools deploy --only firestore:rules"
          : error.message;
      setMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-form">
      <h2 className="title is-4">Public profile</h2>
      <p className="mb-4">
        This name identifies you beside public collection copies. Your email is
        never shown.
      </p>
      <div className="field">
        <label className="label">Display name</label>
        <input
          className="input"
          value={displayName}
          maxLength={40}
          placeholder={fallbackDisplayName(user.uid)}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      {message && <p className="help mb-3">{message}</p>}
      <button
        type="button"
        className="button is-primary"
        onClick={save}
        disabled={saving}
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
};

export default Profile;
