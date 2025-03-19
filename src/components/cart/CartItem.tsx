import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import Image from "next/image";

interface CartItemProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
  };
}

const CartItem = ({ product }: CartItemProps) => {
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Image src={product.image} alt={product.name} width={80} height={80} className="rounded-md"/>
        <div>
          <h3 className="text-lg font-bold">{product.name}</h3>
          <p className="text-gray-600">${product.price.toFixed(2)} x {product.quantity}</p>
        </div>
      </div>
      <Button variant="destructive" onClick={() => removeFromCart(product.id)}>
        Eliminar
      </Button>
      
    </div>
  );
};

export default CartItem;
