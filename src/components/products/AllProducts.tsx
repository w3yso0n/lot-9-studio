import NewDropsCarousel from "@/components/products/NewDropsCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { products } from "@/lib/data";

const AllProducts = () => {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-10">
      {/* Sección de Nuevos Drops */}
      <NewDropsCarousel />



      {/* Video mejorado */}
      <div className="my-12 relative aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-lg bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen"
          className="w-full h-full object-cover"
        >
          <source src="/video1.mp4" type="video/mp4" />
          Tu navegador no soporta la etiqueta de video.
        </video>
        
        {/* Capa semitransparente para mejorar legibilidad
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <h3 className="text-white text-2xl sm:text-3xl font-bold px-4 text-center">
            Descubre nuestra nueva colección
          </h3>
        </div> */}
      </div>

            {/* Encabezado y controles
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-12 mb-8">
        <h2 className="text-3xl font-bold">Nuestros Productos</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-10 w-full"
            />
          </div>
          
          <Select>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Nuevos</SelectItem>
              <SelectItem value="popular">Populares</SelectItem>
              <SelectItem value="price-low">Precio: Menor a mayor</SelectItem>
              <SelectItem value="price-high">Precio: Mayor a menor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div> */}

      {/* Grid de Productos con skeleton loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            className="hover:scale-[1.02] transition-transform duration-200"
          />
        ))}
      </div>

      {/* Paginación
      <div className="flex justify-center mt-12 gap-2">
        <Button variant="outline" size="sm">
          Anterior
        </Button>
        <Button variant="outline" size="sm">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          Siguiente
        </Button>
      </div> */}
    </section>
  );
};

export default AllProducts;
