import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getGoogleLoginUrl } from "../../api/campusApi";
import Button from "../common/Button";
import GoogleLogo from "./GoogleLogo";

const links = [
  { label: "Home", to: "/", end: true },
  { label: "Features", to: "/features" },
  { label: "Modules", to: "/modules" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

function navClass(isActive) {
  return [
    "rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive ? "bg-white text-[color:var(--brand)] shadow-sm" : "text-white/85 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/15 bg-[color:var(--navy-deep)]/78 px-4 py-3 shadow-2xl backdrop-blur-lg md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/12 text-sm font-bold text-cyan-300">
            SC
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">Smart Campus</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => navClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            size="sm"
            variant="secondary"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            onClick={() => (window.location.href = getGoogleLoginUrl())}
          >
            <GoogleLogo />
            Sign In
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white transition hover:bg-white/10 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-white/15 bg-[color:var(--navy-deep)]/88 p-3 shadow-2xl backdrop-blur-lg lg:hidden">
          <nav className="grid gap-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3 w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setOpen(false);
              window.location.href = getGoogleLoginUrl();
            }}
          >
            <GoogleLogo />
            Sign in with Google
          </Button>
        </div>
      ) : null}

      {location.pathname === "/" ? (
        <div className="pointer-events-none absolute left-0 right-0 top-full h-28 bg-gradient-to-b from-[color:var(--navy-deep)]/40 to-transparent" />
      ) : null}
    </header>
  );
}

export default PublicNavbar;
