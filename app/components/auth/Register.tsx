"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getToken } from '@/lib/hooks/getToken';

// Importar Leaflet dinámicamente solo en el cliente
const MapWithNoSSR = dynamic(
  () => import('@/components/auth/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ozio-blue"></div>
      </div>
    )
  }
);

export default function Register({ onRegisterSuccess }: { onRegisterSuccess?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar los 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      setFormData({
        ...formData,
        profileImage: file,
        profileImagePreview: URL.createObjectURL(file),
      });
      setError('');
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.name.trim()) {
        setError('El nombre es requerido');
        return;
      }
      if (!formData.email.trim()) {
        setError('El email es requerido');
        return;
      }
    }

    if (step === 2) {
      if (formData.profileType === 'user') {
        if (!formData.username.trim()) {
          setError('El nombre de usuario es requerido');
          return;
        }
        if (formData.username.length < 3) {
          setError('El nombre de usuario debe tener al menos 3 caracteres');
          return;
        }
      } else {
        if (!formData.address.trim()) {
          setError('La dirección es requerida');
          return;
        }
      }
    }

    if (step === 3) {
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
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
        submitData.append('description', formData.address);
        submitData.append('latitude', formData.latitude.toString());
        submitData.append('longitude', formData.longitude.toString());
      }

      if (formData.profileImage) {
        submitData.append('avatar', formData.profileImage);
        setUploadProgress(50);
      }

      if (formData.profileType === 'user') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
          method: 'POST',
          body: submitData,
        });

        setUploadProgress(100);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al registrarse');
        }

        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          router.push('/');
        }
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues`, {
          method: 'POST',
          body: submitData,
        });
        setUploadProgress(100);

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error al registrar el establecimiento');
        }
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ozio-dark flex items-center justify-center min-h-[600px]">
      <div className="w-full max-w-md">
        <div className="bg-ozio-card rounded-3xl p-8 shadow-xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((num, idx) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition ${
                  step >= num ? 'bg-ozio-blue text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {num}
                </div>
                {idx < 3 && (
                  <div className={`w-8 h-1 rounded transition ${
                    step > num ? 'bg-ozio-blue' : 'bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 1 && 'Datos básicos'}
            {step === 2 && (formData.profileType === 'user' ? 'Tu perfil' : 'Ubicación')}
            {step === 3 && 'Seguridad'}
            {step === 4 && (formData.profileType === 'user' ? 'Foto de perfil' : 'Logo del local')}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Paso {step} de {totalSteps}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* PASO 1: Datos básicos */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre {formData.profileType === 'user' ? 'completo' : 'del establecimiento'}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                  placeholder={formData.profileType === 'user' ? 'Tu nombre' : 'Nombre del local'}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="profileType" className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de cuenta
                </label>
                <select
                  id="profileType"
                  name="profileType"
                  value={formData.profileType}
                  onChange={handleChange}
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                >
                  <option value="user">👤 Usuario</option>
                  <option value="venue">🏢 Establecimiento</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-3 px-6 rounded-xl transition mt-6"
              >
                Continuar →
              </button>
            </form>
          )}

          {/* PASO 2: Usuario - Username y Descripción */}
          {step === 2 && formData.profileType === 'user' && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    minLength={3}
                    pattern="[a-zA-Z0-9_]+"
                    className="w-full bg-ozio-dark border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                    placeholder="tunombre"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Mínimo 3 caracteres, sin espacios</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={150}
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition resize-none"
                  placeholder="Cuéntanos sobre ti..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.description.length}/150
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-3 px-6 rounded-xl transition"
                >
                  Continuar →
                </button>
              </div>
            </form>
          )}

          {/* PASO 2: Venue - Dirección y Mapa */}
          {step === 2 && formData.profileType === 'venue' && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                  placeholder="Calle, número, ciudad"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ubicación en el mapa
                </label>
                <p className="text-xs text-gray-400 mb-2">Haz clic en el mapa para seleccionar tu ubicación</p>
                <div className="rounded-xl overflow-hidden border border-gray-700 h-64">
                  <MapWithNoSSR 
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onPositionChange={(lat, lng) => {
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-xs text-gray-400">
                    Lat: {formData.latitude.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Lng: {formData.longitude.toFixed(6)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-3 px-6 rounded-xl transition"
                >
                  Continuar →
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: Contraseña */}
          {step === 3 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full bg-ozio-dark border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
                  placeholder="Repite tu contraseña"
                />
              </div>

              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 6 ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
                    <div className={`h-1 flex-1 rounded ${formData.password.length >= 10 ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formData.password.length < 6 && 'Demasiado corta'}
                    {formData.password.length >= 6 && formData.password.length < 8 && 'Débil'}
                    {formData.password.length >= 8 && formData.password.length < 10 && 'Media'}
                    {formData.password.length >= 10 && 'Fuerte'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-3 px-6 rounded-xl transition"
                >
                  Continuar →
                </button>
              </div>
            </form>
          )}

          {/* PASO 4: Foto de perfil / Logo */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {formData.profileImagePreview ? (
                    <img
                      src={formData.profileImagePreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-ozio-blue"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-ozio-blue to-ozio-purple border-4 border-gray-600 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-ozio-blue p-2 rounded-full border-2 border-ozio-dark hover:bg-ozio-purple transition"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <p className="text-sm text-gray-300 mb-2">
                  {formData.profileType === 'user' ? 'Foto de perfil' : 'Logo del establecimiento'}
                </p>
                <p className="text-xs text-gray-400 text-center">
                  Opcional. Formatos: JPG, PNG (máx. 5MB)
                </p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition"
                >
                  {formData.profileImagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </button>

                {loading && uploadProgress > 0 && (
                  <div className="w-full mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-ozio-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Subiendo imagen... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </span>
                  ) : '✓ Finalizar'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-gray-400 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-ozio-blue hover:text-ozio-purple font-semibold transition">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}