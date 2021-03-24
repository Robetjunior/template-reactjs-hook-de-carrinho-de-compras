import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [storagedCart];
  });

  const addProduct = async (productId: number) => {
    try {
      const addingProuct = await api.get<Product>(`/products/${productId}`)
      .then(response => response.data)

      const addingProductStock = await api.get<Stock>(`/stock/${productId}`)
      .then(response => response.data)

      if(cart.some(product => product.id === productId)) {
        const productIndex = cart.findIndex(product => product.id === productId)
        if(cart[productIndex].amount + 1 <= addingProductStock.amount) {
          return updateProductAmount({productId, amount: (cart[productIndex].amount + 1)})
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        setCart(oldState => [...oldState, {...addingProuct, amount: 1}])
        return localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(cart.some(product => product.id === productId)){
        const productIndex = cart.findIndex(product => product.id === productId)
        console.log(productIndex)
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return 
      }
      const {data} = await api.get<Product>(`/stock/${productId}`)

      if(data.amount - amount >= 0){
        const updatedCart = cart.map(product => product.id === productId
        ? { ...product, amount}
        : product
        ) 

        setCart(updatedCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        toast.error('Quantidade solicitada fora de estoque')
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
