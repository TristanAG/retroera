"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Login from "@/components/Login";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading, logIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/collection");
    }
  }, [user, loading, router]);

  const handleSignUp = async () => {
    setError("");
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogIn = async () => {
    setError("");
    try {
      await logIn(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading || user) {
    return (
      <div
        className="section is-flex is-justify-content-center is-align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="section is-flex is-justify-content-center is-align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto" }}>
        <h1 className="is-size-1 has-text-link-90">RetroEra</h1>
        <p style={{ textAlign: "center" }}>Stay Retro.</p>
        {error ? (
          <div className="notification is-danger is-light">{error}</div>
        ) : null}
        <Login
          onLogin={handleLogIn}
          onSignUp={handleSignUp}
          setPassword={setPassword}
          password={password}
          setEmail={setEmail}
          email={email}
        />
      </div>
    </div>
  );
}
