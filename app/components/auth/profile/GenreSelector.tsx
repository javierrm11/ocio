"use client";
import { useState, useEffect } from "react";
import { Genre } from "./types";

export default function GenreSelector({ selected, onChange }: { selected: number[]; onChange: (ids: number[]) => void }) {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/genres`)
      .then((r) => r.json())
      .then(setGenres)
      .catch(() => {});
  }, []);

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((g) => g !== id) : [...selected, id]);

  if (genres.length === 0) return null;

  return (
    <div>
      <label className="block text-ozio-text font-medium mb-2">Géneros musicales</label>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
        {genres.map((genre) => {
          const isSelected = selected.includes(genre.id);
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggle(genre.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                isSelected
                  ? "bg-ozio-blue border-ozio-blue text-ozio-text scale-105"
                  : "bg-ozio-dark border-ozio-card text-ozio-text-muted hover:border-ozio-blue/50 hover:text-ozio-text"
              }`}
            >
              <span>{genre.emoji}</span>
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-ozio-blue mt-2">
          {selected.length} género{selected.length > 1 ? "s" : ""} seleccionado{selected.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
