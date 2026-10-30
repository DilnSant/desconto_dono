import type { Metadata } from 'next'
import LegalDocument from '@/components/legal/LegalDocument'
import { termsSections } from '@/lib/legal/legal-content'

export const metadata: Metadata = {
  title: 'Termos de Uso — Desconto do Dono',
  description:
    'Conheça as regras de uso da plataforma Desconto do Dono, uma rede de networking e benefícios para negócios locais.',
}

export default function TermosPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      updatedAt="30 de outubro de 2026"
      sections={termsSections}
    />
  )
}
