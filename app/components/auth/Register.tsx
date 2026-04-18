"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(
  () => import('@/components/auth/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-ozio-card rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    )
  }
);

interface Genre {
  id: number;
  name: string;
  slug: string;
  emoji: string;
}

interface ScheduleDay {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

const DAYS: string[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS.map(day => ({ day, open: '21:00', close: '04:00', is_closed: false }));

function ScheduleEditor({ schedule, onChange }: { schedule: ScheduleDay[]; onChange: (s: ScheduleDay[]) => void }) {
  const update = (i: number, field: keyof ScheduleDay, value: any) => {
    const next = [...schedule];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      {schedule.map((d, i) => (
        <div key={d.day} className="flex items-center gap-2 bg-ozio-dark rounded-xl px-3 py-2">
          <span className="w-20 text-ozio-text text-xs capitalize font-medium">{d.day}</span>
          <button
            type="button"
            aria-label={d.is_closed ? `Abrir ${d.day}` : `Cerrar ${d.day}`}
            onClick={() => update(i, 'is_closed', !d.is_closed)}
            className={`w-9 h-5 rounded-full relative transition flex-shrink-0 ${d.is_closed ? 'bg-ozio-card' : 'bg-ozio-blue'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform ${d.is_closed ? 'translate-x-0.5' : 'translate-x-4'}`} />
          </button>
          {d.is_closed ? (
            <span className="text-ozio-text-muted text-xs flex-1">Cerrado</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-1">
              <input type="time" value={d.open} onChange={e => update(i, 'open', e.target.value)}
                title={`Hora de apertura ${d.day}`} aria-label={`Hora de apertura ${d.day}`}
                className="bg-ozio-card/50 text-ozio-text text-xs rounded-lg px-2 py-1 border border-ozio-card focus:border-ozio-blue focus:outline-none w-24" />
              <span className="text-ozio-text-muted text-xs">–</span>
              <input type="time" value={d.close} onChange={e => update(i, 'close', e.target.value)}
                title={`Hora de cierre ${d.day}`} aria-label={`Hora de cierre ${d.day}`}
                className="bg-ozio-card/50 text-ozio-text text-xs rounded-lg px-2 py-1 border border-ozio-card focus:border-ozio-blue focus:outline-none w-24" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Register({ onRegisterSuccess }: { onRegisterSuccess?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileType: 'user',
    username: '',
    description: '',
    address: '',
    latitude: 37.8787857,
    longitude: -4.766206,
    password: '',
    confirmPassword: '',
    profileImage: null as File | null,
    profileImagePreview: '' as string,
    selectedGenres: [] as number[],
    schedule: DEFAULT_SCHEDULE,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Total de pasos según tipo
  const totalSteps = formData.profileType === 'venue' ? 6 : 4;

  // Cargar géneros al montar
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/genres`)
      .then(r => r.json())
      .then(setGenres)
      .catch(() => {});
  }, []);

  const toggleGenre = (id: number) => {
    setFormData(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(id)
        ? prev.selectedGenres.filter(g => g !== id)
        : [...prev.selectedGenres, id],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede superar los 5MB'); return; }
      if (!file.type.startsWith('image/')) { setError('Solo se permiten archivos de imagen'); return; }
      setFormData({ ...formData, profileImage: file, profileImagePreview: URL.createObjectURL(file) });
      setError('');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.name.trim()) { setError('El nombre es requerido'); return; }
      if (!formData.email.trim()) { setError('El email es requerido'); return; }
    }

    if (step === 2) {
      if (formData.profileType === 'user') {
        if (!formData.username.trim()) { setError('El nombre de usuario es requerido'); return; }
        if (formData.username.length < 3) { setError('El nombre de usuario debe tener al menos 3 caracteres'); return; }
      } else {
        if (!formData.address.trim()) { setError('La dirección es requerida'); return; }
      }
    }

    // Paso 3 para venue = géneros (sin validación obligatoria)
    // Paso 3 para user = contraseña
    if (step === 3 && formData.profileType === 'user') {
      if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
      if (formData.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    }

    // Paso 5 para venue = contraseña
    if (step === 5 && formData.profileType === 'venue') {
      if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
      if (formData.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    }

    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('role', formData.profileType);
      submitData.append('type', formData.profileType);

      if (formData.profileType === 'user') {
        submitData.append('username', formData.username);
        submitData.append('description', formData.description);
      } else {
        submitData.append('username', formData.name.toLowerCase().replace(/\s+/g, '_'));
        submitData.append('description', formData.description);
        submitData.append('address', formData.address);
        submitData.append('latitude', formData.latitude.toString());
        submitData.append('longitude', formData.longitude.toString());
        submitData.append('genre_ids', JSON.stringify(formData.selectedGenres));
        submitData.append('schedule', JSON.stringify(formData.schedule));
      }

      if (formData.profileImage) {
        submitData.append('avatar', formData.profileImage);
        setUploadProgress(50);
      }

      const endpoint = formData.profileType === 'user'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`
        : `${process.env.NEXT_PUBLIC_APP_URL}/api/venues`;

      const response = await fetch(endpoint, { method: 'POST', body: submitData });
      setUploadProgress(100);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al registrarse');
      router.push('/mapa');
    } catch (err: any) {
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Títulos dinámicos por paso y tipo
  const stepTitle = () => {
    if (formData.profileType === 'venue') {
      return ['Datos básicos', 'Ubicación', 'Géneros musicales', 'Horarios', 'Seguridad', 'Logo del local'][step - 1];
    }
    return ['Datos básicos', 'Tu perfil', 'Seguridad', 'Foto de perfil'][step - 1];
  };

  return (
    <div className="bg-ozio-dark flex items-center justify-center min-h-[600px]">
      <div className="w-full max-w-md">
        <section className="bg-ozio-card rounded-3xl p-8 shadow-xl" aria-labelledby="register-title">

          {/* Progress indicator */}
          <ol className="flex items-center justify-center gap-2 mb-6 list-none p-0 m-0" aria-label="Pasos del registro">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((num, idx) => (
              <li key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition border-2 ${
                  step >= num ? 'bg-ozio-blue text-ozio-text border-ozio-blue' : 'bg-ozio-card text-ozio-text-muted border-gray-600'
                }`}>
                  {num}
                </div>
                {idx < totalSteps - 1 && (
                  <div className={`w-8 h-1 rounded transition ${step > num ? 'bg-ozio-blue' : 'bg-ozio-card'}`} />
                )}
              </li>
            ))}
          </ol>

          <h2 id="register-title" className="text-2xl font-bold text-ozio-text mb-2">{stepTitle()}</h2>
          <p className="text-ozio-text-muted text-sm mb-6">Paso {step} de {totalSteps}</p>

          {error && (
            <div className="bg-ambience-high/10 border border-ambience-high/50 text-ambience-high rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* PASO 1: Datos básicos */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">
                  Nombre {formData.profileType === 'user' ? 'completo' : 'del establecimiento'}
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition"
                  placeholder={formData.profileType === 'user' ? 'Tu nombre' : 'Nombre del local'} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition"
                  placeholder="tu@email.com" />
              </div>
              <div>
                <label htmlFor="profileType" className="block text-sm font-medium text-ozio-text-secondary mb-2">Tipo de cuenta</label>
                <select id="profileType" name="profileType" value={formData.profileType} onChange={handleChange}
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text focus:outline-none focus:ring-2 focus:ring-ozio-blue transition">
                  <option value="user">👤 Usuario</option>
                  <option value="venue">🏢 Establecimiento</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition mt-6">
                Continuar →
              </button>
            </form>
          )}

          {/* PASO 2: Usuario → perfil */}
          {step === 2 && formData.profileType === 'user' && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Nombre de usuario</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ozio-text-muted">@</span>
                  <input type="text" name="username" value={formData.username} onChange={handleChange}
                    required minLength={3} pattern="[a-zA-Z0-9_]+"
                    className="w-full bg-ozio-dark border border-ozio-card rounded-xl pl-8 pr-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition"
                    placeholder="tunombre" autoFocus />
                </div>
                <p className="text-xs text-ozio-text-muted mt-1">Mínimo 3 caracteres, sin espacios</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Descripción (opcional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  rows={4} maxLength={150}
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition resize-none"
                  placeholder="Cuéntanos sobre ti..." />
                <p className="text-xs text-ozio-text-muted mt-1 text-right">{formData.description.length}/150</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-xl transition">← Atrás</button>
                <button type="submit" className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition">Continuar →</button>
              </div>
            </form>
          )}

          {/* PASO 2: Venue → ubicación */}
          {step === 2 && formData.profileType === 'venue' && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Dirección</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} required
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition"
                  placeholder="Calle, número, ciudad" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Ubicación en el mapa</label>
                <p className="text-xs text-ozio-text-muted mb-2">Haz clic en el mapa para seleccionar tu ubicación</p>
                <div className="rounded-xl overflow-hidden border border-ozio-card h-64">
                  <MapWithNoSSR latitude={formData.latitude} longitude={formData.longitude}
                    onPositionChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <p className="text-xs text-ozio-text-muted">Lat: {formData.latitude.toFixed(6)}</p>
                  <p className="text-xs text-ozio-text-muted">Lng: {formData.longitude.toFixed(6)}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-xl transition">← Atrás</button>
                <button type="submit" className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition">Continuar →</button>
              </div>
            </form>
          )}

          {/* PASO 3: Venue → géneros musicales ✨ NUEVO */}
          {step === 3 && formData.profileType === 'venue' && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <p className="text-sm text-ozio-text-muted mb-4">
                  Selecciona los géneros que suenan en tu local. Ayuda a los usuarios a encontrarte.
                </p>
                <ul className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1 list-none p-0 m-0">
                  {genres.map(genre => {
                    const selected = formData.selectedGenres.includes(genre.id);
                    return (
                      <li key={genre.id}>
                        <button
                          type="button"
                          onClick={() => toggleGenre(genre.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                            selected
                              ? 'bg-ozio-blue border-ozio-blue text-ozio-text scale-105'
                              : 'bg-ozio-dark border-ozio-card text-ozio-text-secondary hover:border-ozio-blue/50 hover:text-ozio-text'
                          }`}
                        >
                          <span>{genre.emoji}</span>
                          <span>{genre.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {formData.selectedGenres.length > 0 && (
                  <p className="text-xs text-ozio-blue mt-3">
                    {formData.selectedGenres.length} género{formData.selectedGenres.length > 1 ? 's' : ''} seleccionado{formData.selectedGenres.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-xl transition">← Atrás</button>
                <button type="submit" className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition">Continuar →</button>
              </div>
            </form>
          )}

          {/* PASO 4: Venue → horarios */}
          {step === 4 && formData.profileType === 'venue' && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <p className="text-sm text-ozio-text-muted mb-2">
                Configura el horario de apertura de tu local. Puedes ajustarlo después desde tu perfil.
              </p>
              <ScheduleEditor
                schedule={formData.schedule}
                onChange={s => setFormData(prev => ({ ...prev, schedule: s }))}
              />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(3)} className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-xl transition">← Atrás</button>
                <button type="submit" className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition">Continuar →</button>
              </div>
            </form>
          )}

          {/* PASO 3: User / PASO 5: Venue → contraseña */}
          {((step === 3 && formData.profileType === 'user') || (step === 5 && formData.profileType === 'venue')) && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  required minLength={6}
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition"
                  placeholder="Mínimo 6 caracteres" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-ozio-text-secondary mb-2">Confirmar contraseña</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  required minLength={6}
                  className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue transition"
                  placeholder="Repite tu contraseña" />
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 6 ? 'bg-ozio-orange' : 'bg-ozio-card'}`} />
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-orange-500' : 'bg-ozio-card'}`} />
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 10 ? 'bg-ambience-low' : 'bg-ozio-card'}`} />
                  </div>
                  <p className="text-xs text-ozio-text-muted">
                    {formData.password.length < 6 && 'Demasiado corta'}
                    {formData.password.length >= 6 && formData.password.length < 8 && 'Débil'}
                    {formData.password.length >= 8 && formData.password.length < 10 && 'Media'}
                    {formData.password.length >= 10 && 'Fuerte'}
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(step - 1)} className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-xl transition">← Atrás</button>
                <button type="submit" className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition">Continuar →</button>
              </div>
            </form>
          )}

          {/* PASO 4: User / PASO 6: Venue → foto */}
          {((step === 4 && formData.profileType === 'user') || (step === 6 && formData.profileType === 'venue')) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center">
                <figure className="relative mb-4 m-0">
                  {formData.profileImagePreview ? (
                    <img src={formData.profileImagePreview} alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-ozio-blue" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-ozio-blue to-ozio-purple border-4 border-ozio-card flex items-center justify-center">
                      <svg className="w-16 h-16 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <button type="button" aria-label="Cambiar foto de perfil" onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-ozio-blue p-2 rounded-full border-2 border-ozio-dark hover:bg-ozio-purple transition">
                    <svg className="w-4 h-4 text-ozio-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </figure>
                <input ref={fileInputRef} type="file" accept="image/*" aria-label="Seleccionar imagen de perfil" onChange={handleImageChange} className="hidden" />
                <p className="text-sm text-ozio-text-secondary mb-2">
                  {formData.profileType === 'user' ? 'Foto de perfil' : 'Logo del establecimiento'}
                </p>
                <p className="text-xs text-ozio-text-muted text-center">Opcional. Formatos: JPG, PNG (máx. 5MB)</p>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-2 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-medium rounded-xl transition">
                  {formData.profileImagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </button>
                {loading && uploadProgress > 0 && (
                  <div className="w-full mt-4">
                    <div className="w-full bg-ozio-card rounded-full h-2">
                      <div className="bg-ozio-blue h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-ozio-text-muted text-center mt-2">Subiendo imagen... {uploadProgress}%</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setStep(step - 1)} disabled={loading}
                  className="flex-1 bg-ozio-card hover:bg-ozio-card/70 text-ozio-text font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50">
                  ← Atrás
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creando...
                    </span>
                  ) : '✓ Finalizar'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-ozio-text-muted text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/profile" className="text-ozio-blue hover:text-ozio-purple font-semibold transition">
              Inicia sesión
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}