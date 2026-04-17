"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/stores/venueStore'; // 👈

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setLoaded } = useAppStore(); // 👈

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      if (typeof window !== 'undefined') {
        const maxAge = 60 * 60 * 24 * 30; // 30 días
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `session=1; path=/; max-age=${maxAge}; SameSite=Strict${secure}`;
      }

      // ✅ Forzar recarga del store con el nuevo token
      setLoaded(false);

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ozio-dark flex items-center justify-center">
      <section className="w-full max-w-md bg-ozio-card rounded-3xl p-8 shadow-xl" aria-labelledby="login-title">
        <h2 id="login-title" className="text-2xl font-bold text-ozio-text mb-6">Iniciar sesión</h2>

        {error && (
          <div className="bg-ambience-high/10 border border-ambience-high/50 text-ambience-high rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="tu@email.com"
              className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
            />
          </div>

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
              placeholder="Tu contraseña"
              className="w-full bg-ozio-dark border border-ozio-card rounded-xl px-4 py-3 text-ozio-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ozio-blue focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-ozio-blue hover:text-ozio-purple transition">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ozio-blue hover:bg-ozio-purple text-ozio-text font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/profile" className="text-ozio-blue hover:text-ozio-purple font-semibold transition">
            Regístrate
          </Link>
        </p>
      </section>
    </div>
  );
}
