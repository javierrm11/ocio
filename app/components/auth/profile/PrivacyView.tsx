"use client";
import { ChevronLeft } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-ozio-text font-bold text-base">{title}</p>
      <p className="text-ozio-text-muted text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export default function PrivacyView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-5 text-ozio-text-muted hover:text-ozio-text transition text-md font-medium"
      >
        <ChevronLeft size={20} />
        Privacidad
      </button>

      <h2 className="text-ozio-text text-lg font-black">🔒 Política de privacidad</h2>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-5 space-y-5">
        <Section title="1. Datos que recopilamos">
          Recopilamos tu nombre, correo electrónico y datos de uso (check-ins, favoritos, eventos) con el fin de ofrecerte una experiencia personalizada dentro de Ozio.
        </Section>
        <Section title="2. Uso de los datos">
          Tus datos se utilizan exclusivamente para el funcionamiento de la plataforma. No vendemos ni cedemos información personal a terceros sin tu consentimiento.
        </Section>
        <Section title="3. Almacenamiento">
          La información se almacena de forma segura en servidores protegidos. Utilizamos Supabase como proveedor de base de datos, sujeto a sus propias políticas de seguridad.
        </Section>
        <Section title="4. Tus derechos">
          Puedes solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento contactando con nosotros a través del apartado de Contacto.
        </Section>
        <Section title="5. Cookies">
          Usamos una cookie de sesión estrictamente necesaria para mantener tu inicio de sesión. No utilizamos cookies de seguimiento ni publicidad.
        </Section>
      </div>

      <p className="text-center text-ozio-text-dim text-xs pb-2">Última actualización: enero 2025</p>
    </div>
  );
}
