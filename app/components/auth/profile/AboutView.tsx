"use client";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";

type SubView = "main" | "privacy" | "terms" | "contact";

function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-5 text-ozio-text-muted hover:text-ozio-text transition text-md font-medium"
    >
      <ChevronLeft size={20} />
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-ozio-text font-bold text-base">{title}</p>
      <p className="text-ozio-text-muted text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function PrivacyView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton label="Acerca de" onClick={onBack} />
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

function TermsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton label="Acerca de" onClick={onBack} />
      <h2 className="text-ozio-text text-lg font-black">📄 Términos y condiciones</h2>
      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-5 space-y-5">
        <Section title="1. Aceptación">
          Al usar Ozio aceptas estos términos. Si no estás de acuerdo, te pedimos que no utilices la plataforma.
        </Section>
        <Section title="2. Uso permitido">
          Ozio está pensado para descubrir locales y eventos nocturnos. Queda prohibido el uso fraudulento, la suplantación de identidad o cualquier actividad ilegal dentro de la plataforma.
        </Section>
        <Section title="3. Cuentas">
          Eres responsable de mantener la seguridad de tu cuenta. Ozio no se hace responsable de accesos no autorizados derivados de una contraseña comprometida.
        </Section>
        <Section title="4. Contenido">
          El contenido que publiques (fotos, descripciones, eventos) es de tu responsabilidad. Ozio se reserva el derecho de eliminar contenido que incumpla estas normas.
        </Section>
        <Section title="5. Modificaciones">
          Podemos actualizar estos términos en cualquier momento. Te notificaremos de cambios relevantes a través de la aplicación.
        </Section>
      </div>
      <p className="text-center text-ozio-text-dim text-xs pb-2">Última actualización: enero 2025</p>
    </div>
  );
}

function ContactView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton label="Acerca de" onClick={onBack} />
      <h2 className="text-ozio-text text-lg font-black">✉️ Contacto</h2>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl divide-y divide-ozio-darker/60">
        {[
          { icon: "📧", label: "Email", value: "hola@ozio.app" },
          { icon: "📸", label: "Instagram", value: "@ozio.app" },
          { icon: "🐦", label: "Twitter / X", value: "@ozioapp" },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-ozio-text-muted text-sm">{label}</span>
            </div>
            <span className="text-ozio-text text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-5">
        <p className="text-ozio-text font-semibold text-sm mb-1">¿Tienes algún problema?</p>
        <p className="text-ozio-text-muted text-sm leading-relaxed">
          Escríbenos a <span className="text-ozio-blue">hola@ozio.app</span> y te respondemos en menos de 48 horas. También puedes contactarnos por redes sociales.
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-ozio-darker/60 last:border-0">
      <span className="text-ozio-text-muted text-sm">{label}</span>
      <span className="text-ozio-text text-sm font-medium">{value}</span>
    </div>
  );
}

export default function AboutView({ onBack }: { onBack: () => void }) {
  const [subView, setSubView] = useState<SubView>("main");

  if (subView === "privacy") return <PrivacyView onBack={() => setSubView("main")} />;
  if (subView === "terms")   return <TermsView   onBack={() => setSubView("main")} />;
  if (subView === "contact") return <ContactView onBack={() => setSubView("main")} />;

  return (
    <div className="space-y-4">
      <BackButton label="Acerca de" onClick={onBack} />

      <div className="flex flex-col items-center gap-2 py-6">
        <div className="rounded-3xl flex items-center justify-center shadow-lg shadow-ozio-blue/20">
          <Image src="/logo.jpeg" alt="Ozio Logo" width={60} height={60} className="rounded-lg" />
        </div>
        <h2 className="text-ozio-text text-xl font-black mt-2">Ozio</h2>
        <span className="text-ozio-text-muted text-xs px-3 py-1 bg-ozio-card rounded-full border border-ozio-card/50">
          Versión 1.0.0
        </span>
      </div>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl px-4">
        <InfoRow label="Versión" value="1.0.0" />
        <InfoRow label="Plataforma" value="Web" />
        <InfoRow label="Desarrollado por" value="Equipo Ozio" />
      </div>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl p-4">
        <p className="text-ozio-text-muted text-sm leading-relaxed">
          Ozio es tu guía para la vida nocturna. Descubre locales, eventos y conecta con la escena de tu ciudad en tiempo real.
        </p>
      </div>

      <div className="bg-ozio-card border border-ozio-card/50 rounded-2xl divide-y divide-ozio-darker/60">
        {[
          { label: "Política de privacidad", icon: "🔒", view: "privacy" as SubView },
          { label: "Términos y condiciones", icon: "📄", view: "terms"   as SubView },
          { label: "Contacto",               icon: "✉️", view: "contact" as SubView },
        ].map(({ label, icon, view }) => (
          <button
            key={label}
            onClick={() => setSubView(view)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-ozio-card/50 transition first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-ozio-text text-sm font-medium">{label}</span>
            </div>
            <svg className="w-4 h-4 text-ozio-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <p className="text-center text-ozio-text-dim text-xs pb-2">© 2025 Ozio. Todos los derechos reservados.</p>
    </div>
  );
}
