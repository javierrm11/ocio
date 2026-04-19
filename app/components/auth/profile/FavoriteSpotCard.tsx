export default function FavoriteSpotCard({ favorite }: { favorite: any }) {
  return (
    <article className="bg-ozio-card border border-ozio-card/50 rounded-2xl overflow-hidden flex gap-4 p-4 hover:bg-ozio-card/50 transition">
      <img src={favorite?.avatar_path || "https://via.placeholder.com/80"} alt="Venue" className="w-20 h-20 rounded-xl object-cover" />
      <div className="flex-1">
        <h3 className="text-ozio-text font-semibold">{favorite?.name}</h3>
        <address className="text-ozio-text-muted text-sm not-italic">{favorite?.address}</address>
        <button className="mt-2 px-3 py-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text text-xs font-medium rounded-full transition" onClick={() => alert("Función de mapa no implementada")}>
          Ver en mapa
        </button>
      </div>
      <button type="button" aria-label="Quitar de favoritos" className="text-ambience-high hover:text-ambience-high transition">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
      </button>
    </article>
  );
}
