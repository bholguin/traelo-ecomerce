// Productos de Dropi que vende esta tienda.
//
// Cómo encontrar el ID: en dropi.co abre el producto en el catálogo; el número
// aparece en la URL y en la ficha ("ID"). Pégalo aquí y vuelve a desplegar.
//
// price: tu precio de venta en COP. Si lo omites se usa el precio sugerido
// que trae Dropi (suggested_price). regularPrice: precio "antes" tachado (opcional).
//
// Alternativa sin tocar código: la variable de entorno DROPI_PRODUCT_IDS
// ("123,456,789") se suma a esta lista.

export type ProductoTienda = {
  id: number;
  price?: number;
  regularPrice?: number;
  name?: string; // reemplaza el nombre de Dropi
  category?: string; // reemplaza la categoría de Dropi
};

export const PRODUCTOS: ProductoTienda[] = [
  // { id: 123456, price: 89900, regularPrice: 119900 },
];
