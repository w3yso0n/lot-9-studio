"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CartNavLink = dynamic(
  () => import("@/components/layout/CartNavLink").then((mod) => ({ default: mod.CartNavLink })),
  {
    ssr: false,
    loading: () => (
      <Link href="/cart" className="relative block p-1" aria-label="Ver carrito">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 text-foreground sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      </Link>
    ),
  }
);

const navLinkClass =
  "text-foreground/80 hover:text-foreground transition-colors font-medium relative inline-block after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-foreground after:transition-[width] after:duration-300 hover:after:w-full";

const mobileRowClass =
  "block border-b border-border py-2 text-foreground/80 transition-colors hover:text-foreground";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 text-foreground sm:h-5 sm:w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

const Navbar = () => {
  const pathname = usePathname();
  const isAdminDashboard = pathname.startsWith("/admin/dashboard");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-border/60 bg-background/95 py-3 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={isAdminDashboard ? "/admin/dashboard" : "/"}
            className="flex shrink-0 items-center gap-2 text-xl font-bold sm:gap-3"
          >
            <img
              src="/images/logo.png"
              alt="lot 9 studio"
              width={120}
              height={48}
              className="h-10 w-auto sm:h-11"
              fetchPriority="high"
              decoding="async"
            />
            {isAdminDashboard ? (
              <span className="hidden whitespace-nowrap border-l border-border pl-2 text-xs font-semibold tracking-tight text-foreground sm:inline sm:pl-3 sm:text-sm">
                Admin
              </span>
            ) : null}
          </Link>
        </div>

        <div className="ml-8 hidden space-x-8 md:flex">
          {isAdminDashboard ? (
            <Link href="/admin/dashboard" className={navLinkClass}>
              Catálogo
            </Link>
          ) : (
            <Link href="/products" className={navLinkClass}>
              Productos
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
          <ThemeToggle />

          {isAdminDashboard ? (
            <>
              <Link
                href="/"
                className={`${navLinkClass} hidden text-sm whitespace-nowrap md:inline-block`}
              >
                Ver tienda
              </Link>
              <form action="/api/admin/logout" method="post" className="hidden md:block">
                <button
                  type="submit"
                  className="whitespace-nowrap text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <CartNavLink />
          )}

          <button
            type="button"
            className="p-1 md:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <MenuIcon open={isOpen} />
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out md:hidden ${
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="absolute left-0 top-full w-full border-b border-border bg-background shadow-md">
          <div className="flex flex-col space-y-3 px-3 py-3 sm:px-4">
            {isAdminDashboard ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className={mobileRowClass}
                  onClick={() => setIsOpen(false)}
                >
                  Catálogo
                </Link>
                <Link href="/" className={mobileRowClass} onClick={() => setIsOpen(false)}>
                  Ver tienda
                </Link>
                <form action="/api/admin/logout" method="post">
                  <button
                    type="submit"
                    className={`${mobileRowClass} w-full text-left font-medium`}
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/products"
                className={mobileRowClass}
                onClick={() => setIsOpen(false)}
              >
                Productos
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
