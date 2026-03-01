"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Register({
  onRegisterSuccess,
}: {
  onRegisterSuccess?: () => void;
}) {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.name.trim()) return setError('El nombre es requerido');
      if (!formData.email.trim()) return setError('El email es requerido');
    }

    if (step === 2) {
      if (formData.profileType === 'user') {
        if (!formData.username.trim()) return setError('El nombre de usuario es requerido');
        if (formData.username.length < 3)
          return setError('El nombre de usuario debe tener al menos 3 caracteres');
      } else {
        if (!formData.address.trim()) return setError('La dirección es requerida');
      }
    }

    if (step === 3) {
      if (formData.password !== formData.confirmPassword)
        return setError('Las contraseñas no coinciden');
      if (formData.password.length < 6)
        return setError('La contraseña debe tener al menos 6 caracteres');
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

      let response: Response;
      let data: any;

      if (formData.profileType === 'user') {
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
          method: 'POST',
          body: submitData,
        });
        setUploadProgress(100);
        data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error al registrarse');

        // Guardar token solo si estamos en el cliente
        if (typeof window !== 'undefined' && data.session?.access_token) {
          localStorage.setItem('token', data.session.access_token);
        }

        if (onRegisterSuccess) onRegisterSuccess();
        else if (typeof window !== 'undefined') window.location.href = '/';
      } else {
        // Para venues
        response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/venues`, {
          method: 'POST',
          body: submitData,
        });
        setUploadProgress(100);
        data = await response.json();

        if (!response.ok)
          throw new Error(data.error || 'Error al registrar el establecimiento');

        if (typeof window !== 'undefined') window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ozio-dark flex items-center justify-center min-h-[600px]">
      <form
        onSubmit={step === totalSteps ? handleSubmit : handleNextStep}
        className="w-full max-w-md bg-ozio-card rounded-3xl p-8 shadow-xl"
      >
        {/* Aquí iría tu UI de pasos con campos según `step` */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ozio-blue hover:bg-ozio-purple text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading
            ? 'Procesando...'
            : step === totalSteps
            ? 'Registrar'
            : 'Siguiente'}
        </button>
      </form>
    </div>
  );
}