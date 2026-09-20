"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { logIn, logOut, signUp } from "@/lib/authService";
import {
  migrateLegacyGames,
  subscribeToOwnedCopies,
} from "@/lib/copyService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [migrationIssues, setMigrationIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeCopies = null;
    let authGeneration = 0;

    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      const generation = ++authGeneration;
      unsubscribeCopies?.();
      unsubscribeCopies = null;
      setUser(currentUser);

      if (currentUser) {
        try {
          const result = await migrateLegacyGames();
          setMigrationIssues(result.errors);
          if (result.errors.length > 0) {
            console.warn(
              "Some collection records need migration attention",
              result.errors
            );
          }
        } catch (error) {
          console.error("Error migrating collection:", error);
        }

        if (
          generation !== authGeneration ||
          auth.currentUser?.uid !== currentUser.uid
        ) {
          return;
        }

        unsubscribeCopies = subscribeToOwnedCopies(
          setGames,
          (error) => console.error("Error loading collection:", error)
        );
      } else {
        setGames([]);
        setMigrationIssues([]);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeCopies?.();
    };
  }, []);

  const handleSignUp = async (email, password) => {
    const newUser = await signUp(email, password);
    setUser(newUser);
    return newUser;
  };

  const handleLogIn = async (email, password) => {
    const loggedInUser = await logIn(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const handleLogOut = async () => {
    await logOut();
    setUser(null);
    setGames([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        games,
        migrationIssues,
        loading,
        signUp: handleSignUp,
        logIn: handleLogIn,
        logOut: handleLogOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
