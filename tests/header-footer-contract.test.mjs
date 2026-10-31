import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('header presents the requested brand lockup and free announce label', () => {
  const header = source('../src/components/layout/Header.tsx')

  assert.ok(header.includes('Desconto do Dono'))
  assert.ok(header.includes('Vantagens reais. Negócios locais.'))
  assert.ok(header.includes('Gratuito'))
  assert.match(header, /h-13\s+w-auto[^"]*sm:h-16/)
})

test('footer places the complete institutional text beside its logo', () => {
  const footer = source('../src/components/layout/Footer.tsx')
  const normalizedFooter = footer.replace(/\s+/g, ' ')

  assert.ok(footer.includes('flex flex-row items-center gap-6'))
  assert.ok(
    normalizedFooter.includes(
      'Conectamos empreendedores de direita para fortalecer negócios locais e transformar boas parcerias em contratos confiáveis. Nossa plataforma aproxima quem produz, gera empregos e movimenta a economia brasileira'
    )
  )
})

test('message badge uses actual unread count without a hardcoded value', () => {
  const header = source('../src/components/layout/Header.tsx')

  assert.ok(header.includes('getUnreadCount'))
  assert.match(header, /unreadCount\s*>\s*0/)
  assert.ok(!header.includes('>3</span>'))
})
