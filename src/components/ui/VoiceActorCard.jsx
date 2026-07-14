import { Heart } from 'lucide-react';

export function VoiceActorCard({ person, index }) {
  if (!person) return null;

  return (
    <div className="group relative bg-bg-secondary rounded-2xl overflow-hidden border border-border-color hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      
      {/* Rank Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`
          flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm shadow-lg backdrop-blur-md border border-white/10
          ${index < 3 ? 'bg-primary text-white' : 'bg-black/60 text-gray-300'}
        `}>
          #{index + 1}
        </span>
      </div>

      {/* Image Container */}
      <div className="aspect-[3/4] overflow-hidden relative">
        <img 
          src={person.images?.jpg?.image_url} 
          alt={person.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="p-4 relative">
        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {person.name}
        </h3>
        
        {person.given_name && (
          <p className="text-xs text-text-secondary font-medium mb-3">
            {person.given_name} {person.family_name}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border-color/50">
          <div className="flex items-center gap-1.5 text-text-secondary text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            {person.favorites?.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
