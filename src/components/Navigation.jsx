"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation = ({ user, onLogOut }) => {
  const pathname = usePathname();

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <Link
          href="/collection"
          className="navbar-item is-size-3"
          style={{ textDecoration: "none" }}
        >
          RetroEra
        </Link>

        <button
          type="button"
          className="navbar-burger"
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarBasicExample"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>

      <div id="navbarBasicExample" className="navbar-menu">
        <div className="navbar-start">
          <Link
            href="/collection/add"
            className={`navbar-item ${isActive("/collection/add") ? "has-text-weight-bold" : ""}`}
          >
            + add copy
          </Link>

          <Link
            href="/browse"
            className={`navbar-item ${isActive("/browse") ? "has-text-weight-bold" : ""}`}
          >
            + explore
          </Link>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            {user && (
              <>
                <Link
                  href="/settings"
                  className={`button is-ghost ${isActive("/settings") ? "has-text-weight-bold" : ""}`}
                >
                  Public profile
                </Link>
                <button type="button" className="button is-light" onClick={onLogOut}>
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
