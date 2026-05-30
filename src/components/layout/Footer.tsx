import Link from "next/link";

const iconClass =
  "h-5 w-5 shrink-0 transition hover:text-gray-400 dark:hover:text-muted-foreground sm:h-6 sm:w-6";

const Footer = () => {
  return (
    <footer className="bg-gray-900 py-4 text-white dark:bg-background sm:py-6">
      <div className="container mx-auto flex flex-col items-center space-y-3 px-3 sm:space-y-4 sm:px-4">
        <div className="flex space-x-4 sm:space-x-6">
          <Link
            href="https://www.instagram.com/lot9studio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden>
              <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" />
            </svg>
          </Link>
          <Link
            href="https://wa.me/3318592665"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.8 12.1l.2.3-.5 1.8-1.8-.5-.3-.2A8 8 0 1 1 12 4zm-1.1 3.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.8 3.3.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.5-.3s-1.6-.8-1.8-.9c-.2-.1-.4-.1-.5.1-.2.2-.6.9-.7 1-.1.2-.3.2-.5.1l-1.5-.7c-1.4-.7-2.3-1.6-2.6-1.9-.2-.3 0-.4.2-.7.2-.2.4-.5.5-.7.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.5-1.2-.7-1.6z" />
            </svg>
          </Link>
          <Link
            href="https://www.facebook.com/tu_facebook"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden>
              <path d="M13 10V7.5c0-.8.7-1.3 1.5-1.3H16V3h-2.2C11.8 3 10 4.8 10 7.2V10H7v3h3v8h3v-8h2.5l.5-3H13z" />
            </svg>
          </Link>
          <Link href="mailto:contacto@tutienda.com" aria-label="Correo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={iconClass}
              aria-hidden
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-muted-foreground sm:text-sm">
          © {new Date().getFullYear()} lot 9 studio - Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
