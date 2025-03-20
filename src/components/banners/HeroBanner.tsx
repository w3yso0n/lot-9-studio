
import Image from 'next/image';

const HeroBanner = () => {
  return (
    <section className="relative w-full h-[500px] flex items-center justify-center bg-gray-100 overflow-hidden">
      {/* Imagen de fondo */}
      <Image
        src="/images/background.png" // Asegúrate de colocar la imagen en /public/images/
        alt="Moda para hombres"
        fill
        className="absolute inset-0 z-0"
        priority
      />
      {/* Contenido del Hero */}
      <div className="relative z-10 text-center text-white px-6">
        <h1 className="text-4xl sm:text-6xl font-bold drop-shadow-md">
          Estilo & Elegancia
        </h1>
        <p className="mt-2 text-lg sm:text-xl drop-shadow-md">
          Descubre nuestra nueva colección de ropa para hombres
        </p>


      </div>

      {/* Filtro oscuro para mejorar la visibilidad del texto */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>
    </section>
  );
};

export default HeroBanner;
