'use client';

const DONATION_OPTIONS = [
  { id: '50k', label: '$50.000', amount: 50000 },
  { id: '100k', label: '$100.000', amount: 100000 },
  { id: '200k', label: '$200.000', amount: 200000 },
  { id: '500k', label: '$500.000', amount: 500000 },
];

interface DonationSectionProps {
  selectedDonation: string;
  onDonationChange: (optionId: string, amount: number) => void;
}

export default function DonationSection({ selectedDonation, onDonationChange }: DonationSectionProps) {
  return (
    <div className="px-6 py-6 bg-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Construye un hogar</h3>
        <p className="text-sm text-gray-500">
          Ayuda a construir viviendas para familias colombianas
        </p>
      </div>

      {/* Info card */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">127 hogares construidos</p>
            <p className="text-xs text-gray-500">
              Tu aporte se descuenta del precio final
            </p>
          </div>
        </div>
      </div>

      {/* Donation options */}
      <div className="space-y-2">
        {DONATION_OPTIONS.map((option) => {
          const isSelected = selectedDonation === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onDonationChange(option.id, option.amount)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="font-medium text-gray-900">Donar</span>
              </div>
              <span className="text-gray-600">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Learn more link */}
      <div className="mt-4 text-center">
        <button className="text-sm text-gray-500 hover:text-gray-700 underline">
          Conoce más
        </button>
      </div>
    </div>
  );
}
