/**
 * Navbar - Main navigation component with language toggle and active link indicator
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMoon, FiSun, FiMenu, FiX } from "react-icons/fi";
import { useTheme } from "@/features/app/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/features/auth/AuthContext";
import { LanguageToggle } from "@/features/common/LanguageToggle";
import { Button } from "@/components/ui/button";

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const getDashboardPath = () => {
    switch (user?.role) {
      case "admin":
        return "/admin";
      case "instructor":
        return "/instructor";
      case "learner":
        return "/learner";
      case "parent":
        return "/parent";
      default:
        return "/login";
    }
  };

  const navLinks = [
    { href: "/", label: t.home },
    { href: "/about", label: t.about },
    { href: "/curriculum", label: t.curriculum },
    { href: "/gallery", label: t.gallery },
    { href: "/quiz", label: t.quiz },
    { href: "/blog", label: t.blog },
    { href: "/contact", label: t.contact },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Daarul Hidayah logo"
              className="h-10 w-10 rounded-full object-cover ring-1 ring-border bg-white"
            />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-foreground">
                Daarul Hidayah
              </h1>
              <p className="text-xs text-muted-foreground">
                Islamic & Arabic School
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative py-1 transition-colors font-medium ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LanguageToggle />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <FiMoon className="w-5 h-5 text-foreground" />
              ) : (
                <FiSun className="w-5 h-5 text-foreground" />
              )}
            </button>

            {isAuthenticated ? (
              <Link to={getDashboardPath()} className="hidden md:block">
                <Button size="sm">{t.dashboard || "Dashboard"}</Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button variant="outline" size="sm">
                  {t.portalLogin}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <FiX className="w-6 h-6 text-foreground" />
              ) : (
                <FiMenu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2.5 rounded-lg transition-colors font-medium ${
                    isActive(link.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full mt-2">
                    {t.dashboard || "Dashboard"}
                  </Button>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full mt-2">
                    {t.portalLogin}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
