import type { Metadata } from 'next'
import LegalDocument from '@/components/legal/LegalDocument'
import { privacySections } from '@/lib/legal/legal-content'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Desconto do Dono',
  description:
    'Saiba como o Desconto do Dono coleta, utiliza, compartilha e protege dados pessoais em conformidade com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      updatedAt="30 de outubro de 2026"
      sections={privacySections}
    />
  )
}
