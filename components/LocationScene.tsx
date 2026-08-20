import { LocationDefinition } from '@/lib/locations'

export default function LocationScene({
  location,
  size = 'full',
}: {
  location: LocationDefinition
  size?: 'thumbnail' | 'full'
}) {
  const height = size === 'full' ? 'h-64 md:h-80' : 'h-32'

  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden bg-gradient-to-b ${location.gradient} border border-gray-700`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={size === 'full' ? 'text-8xl' : 'text-5xl'} role="img" aria-label={location.name}>
          {location.icon}
        </span>
      </div>
      <div className="absolute inset-0 flex flex-wrap items-end justify-around p-3 opacity-40 text-2xl select-none pointer-events-none">
        {location.sceneEmojis.map((e, i) => <span key={i}>{e}</span>)}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
        <div className="font-bold text-white">{location.name}</div>
        {size === 'full' && <div className="text-xs text-gray-300">{location.tagline}</div>}
      </div>
    </div>
  )
}