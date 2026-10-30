import { ImageResponse } from 'next/og'

export const alt = 'Desconto do Dono | O Clube de Descontos e Negócios Locais'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage:
            'radial-gradient(circle at 50% 40%, rgba(0, 92, 45, 0.6) 0%, rgba(15, 23, 42, 0.95) 70%, #0f172a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '40px 60px',
        }}
      >
        {/* Faixa decorativa com as cores nacionais */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: 'linear-gradient(90deg, #009B3A 33%, #FEDF00 33%, #FEDF00 66%, #002776 66%)',
          }}
        />

        {/* Escudo / Badge DD Dourado */}
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: 36,
            background: 'radial-gradient(circle, #009B3A 0%, #005C2D 100%)',
            border: '4px solid #FEDF00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 45px rgba(254, 223, 0, 0.45)',
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 50, fontWeight: 900, color: '#FEDF00' }}>DD</span>
        </div>

        {/* Título da Marca */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '-0.02em',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span>Desconto</span>
          <span style={{ color: '#FEDF00' }}>do Dono</span>
        </div>

        {/* Subtítulo / Tagline */}
        <div
          style={{
            fontSize: 26,
            color: '#e2e8f0',
            textAlign: 'center',
            maxWidth: 950,
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          A ponte que conecta os melhores empreendedores do Brasil. Networking e vantagens exclusivas.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

