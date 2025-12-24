'use client';

interface HabiHeroProps {
  maxPrice: number;
  propertyData: {
    valorMercado: number;
    direccion: string;
    tipoInmueble: string;
    area: string;
  };
  onStart: () => void;
}

export default function HabiHero({ maxPrice, propertyData, onStart }: HabiHeroProps) {
  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-CO')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-white pt-16">
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        {/* Título principal */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
          Tu Oferta Formal
        </h1>

        {/* Subtítulo */}
        <p className="text-xl text-gray-600 mb-3 max-w-2xl mx-auto">
          Personaliza tu oferta de compra según tus preferencias.
        </p>
        <p className="text-base font-medium text-purple-600 mb-12">
          Válida por 3 días.
        </p>

        {/* Información de la propiedad - estilo Habi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-white border border-purple-100">
            <div className="text-sm text-gray-600 mb-1">Dirección</div>
            <div className="font-medium text-gray-900">{propertyData.direccion}</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-white border border-purple-100">
            <div className="text-sm text-gray-600 mb-1">Tipo</div>
            <div className="font-medium text-gray-900">{propertyData.tipoInmueble}</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-white border border-purple-100">
            <div className="text-sm text-gray-600 mb-1">Área</div>
            <div className="font-medium text-gray-900">{propertyData.area}</div>
          </div>
        </div>

        {/* Precio máximo - estilo Habi */}
        <div className="mb-12 p-8 rounded-2xl bg-white border border-purple-200 shadow-sm max-w-2xl mx-auto">
          <p className="text-sm text-purple-600 uppercase tracking-wider mb-3 font-semibold">
            Hasta
          </p>
          <div className="text-6xl md:text-7xl font-bold mb-2 text-gray-900 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            {formatPrice(maxPrice)}
          </div>
          <p className="text-sm text-gray-600">
            Precio máximo según opciones
          </p>
        </div>

        {/* CTA - estilo Habi */}
        <button 
          onClick={onStart}
          className="bg-purple-600 text-white px-16 py-4 rounded-lg text-base font-medium hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          Personalizar Oferta
        </button>
      </div>
    </div>
  );
}
