import Image from 'next/image';

interface LogoProps {
  src?: string;      // Ruta de la imagen
  alt?: string;      // Texto alternativo
  size?: number;     // Tamaño (ancho y alto)
  className?: string; // Para clases extra de Tailwind
}

export const DynamicIcon = ({ 
  src = "/icons/logoG.png", // Valor por defecto
  alt = "Icono WEAI", 
  size = 32, 
  className = "" 
}: LogoProps) => {
  return (
    <Image 
      src={src} 
      alt={alt} 
      width={size} 
      height={size} 
      className={`object-contain ${className}`}
      priority 
    />
  );
};