import { Metadata } from "next";
import AnadirGuard from "@/components/anadir/AnadirGuard";

export const metadata: Metadata = {
  title: "Añadir | Ozio",
  description:
    "Crea una historia o un evento en tu local. Comparte el ambiente en tiempo real con tu comunidad.",
  openGraph: {
    title: "Añadir — Ozio",
    description: "Publica una historia o crea un evento en tu local.",
    type: "website",
  },
  robots: { index: false },
};

export default function AnadirPage() {
  return <AnadirGuard />;
}
