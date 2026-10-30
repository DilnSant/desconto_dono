import type { LegalSection } from '@/lib/legal/legal-content'

interface LegalDocumentProps {
  title: string
  updatedAt: string
  sections: LegalSection[]
}

export default function LegalDocument({
  title,
  updatedAt,
  sections,
}: LegalDocumentProps) {
  return (
    <article className="min-h-[70vh] bg-gray-900 px-4 py-12 text-gray-300 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 border-b border-gray-700 pb-7 sm:mb-12">
          <p className="text-sm font-bold text-green-400">Desconto do Dono</p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Última atualização: {updatedAt}
          </p>
        </header>

        <div className="space-y-9">
          {sections.map((section, index) => {
            const headingId = `legal-section-${index + 1}`

            return (
              <section key={section.title} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="mb-3 text-xl font-bold text-yellow-400 sm:text-2xl"
                >
                  {section.title}
                </h2>
                <div className="max-w-prose space-y-3 text-sm leading-7 text-gray-300 sm:text-base">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${section.title}-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </article>
  )
}
