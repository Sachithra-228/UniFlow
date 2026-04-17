import { Boxes, Home, Info, Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getGoogleLoginUrl } from "../../api/campusApi";
import { useTheme } from "../../hooks/useTheme";
import Button from "../common/Button";

const links = [
  { label: "Home", to: "/", icon: Home },
  { label: "Features", to: "/features", icon: Sparkles },
  { label: "Modules", to: "/modules", icon: Boxes },
  { label: "About", to: "/about", icon: Info },
];

function navClass(isActive) {
  return [
    "inline-flex items-center border-b-2 px-1 py-2 text-sm font-semibold transition",
    isActive
      ? "border-[color:var(--brand)] text-[color:var(--text)] dark:border-cyan-300 dark:text-white"
      : "border-transparent text-[color:var(--text-muted)] hover:text-[color:var(--text)] dark:text-white/80 dark:hover:text-white",
  ].join(" ");
}

function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [showLandingRail, setShowLandingRail] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const hideTopNav = location.pathname === "/" && showLandingRail;

  function isActiveLink(target) {
    if (target === "/") {
      return location.pathname === "/";
    }
    return location.pathname === target;
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (location.pathname !== "/") {
      setShowLandingRail(false);
      return;
    }

    const onScroll = () => {
      setShowLandingRail(window.scrollY > 140);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  return (
    <>
      <header
        className={[
          "fixed left-1/2 top-4 z-50 w-[min(94vw,980px)] -translate-x-1/2 transition-all duration-300",
          hideTopNav ? "-translate-y-16 opacity-0 pointer-events-none" : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)]/90 px-4 py-3 shadow-2xl backdrop-blur-lg dark:border-white/15 dark:bg-[color:var(--navy-deep)]/78 md:px-6">
          <Link to="/" className="inline-flex items-center">
            <span className="text-base font-extrabold uppercase tracking-[0.18em] text-[color:var(--text)] dark:text-white">UNIFLOW</span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {links.map((item) => (
              <Link key={item.to} to={item.to} className={navClass(isActiveLink(item.to))}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] text-[color:var(--text)] transition hover:bg-white dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Button
              size="sm"
              variant="secondary"
              className="!border-white !bg-white !text-slate-800 hover:!bg-slate-100"
              onClick={() => (window.location.href = getGoogleLoginUrl())}
            >
              Sign In
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--text)] transition hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

      </header>

      {showLandingRail ? (
        <aside className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 lg:block">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-soft)]/92 p-2 shadow-2xl backdrop-blur-lg dark:border-white/15 dark:bg-[color:var(--navy-deep)]/78">
            <nav className="flex flex-col gap-1">
              {links.map((item) => {
                const isActive = isActiveLink(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                  to={item.to}
                  className={[
                    "group flex h-12 w-12 items-center overflow-hidden rounded-xl px-3 transition-all duration-300 hover:w-44",
                    isActive
                      ? "bg-[color:var(--brand-soft)] text-[color:var(--text)] dark:bg-white/15 dark:text-white"
                      : "text-[color:var(--text-muted)] hover:bg-black/5 hover:text-[color:var(--text)] dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white",
                  ].join(" ")}
                >
                    <Icon className="h-6 w-6 shrink-0" />
                    <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap text-base font-semibold opacity-0 transition-all duration-300 group-hover:ml-3 group-hover:max-w-[140px] group-hover:opacity-100">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[60] bg-[color:var(--navy-deep)]/96 px-6 pb-10 pt-6 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            <div className="mb-10 flex items-center justify-between border-b border-white/15 pb-4">
              <span className="text-2xl font-extrabold uppercase tracking-[0.2em] text-white">UNIFLOW</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
              {links.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={[
                    "border-b-2 px-1 pb-1 text-3xl font-semibold transition",
                    isActiveLink(item.to) ? "border-cyan-300 text-white" : "border-transparent text-white/80 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mx-auto mt-4 grid w-full max-w-sm gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 text-white transition hover:bg-white/15"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              <Button
                size="lg"
                variant="secondary"
                className="w-full !border-white !bg-white !text-slate-800 hover:!bg-slate-100"
                onClick={() => {
                  setOpen(false);
                  window.location.href = getGoogleLoginUrl();
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default PublicNavbar;

