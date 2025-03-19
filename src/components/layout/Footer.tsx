import Link from "next/link";
import { FaEnvelope, FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-6">
      <div className="container mx-auto flex flex-col items-center space-y-4">
        {/* Redes Sociales */}
        <div className="flex space-x-6">
          <Link href="https://www.instagram.com/lot9studio" target="_blank" rel="noopener noreferrer">
            <FaInstagram className="w-6 h-6 hover:text-gray-400 transition" />
          </Link>
          <Link href="https://wa.me/3318592665" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp className="w-6 h-6 hover:text-gray-400 transition" />
          </Link>
          <Link href="https://www.facebook.com/tu_facebook" target="_blank" rel="noopener noreferrer">
            <FaFacebook className="w-6 h-6 hover:text-gray-400 transition" />
          </Link>
          <Link href="mailto:contacto@tutienda.com">
            <FaEnvelope className="w-6 h-6 hover:text-gray-400 transition" />
          </Link>
        </div>

        {/* Texto del Footer */}
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} lot 9 studio - Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
