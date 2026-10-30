import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #005C2D 0%, #009B3A 100%)',
          borderRadius: '25%',
          border: '1.5px solid #FEDF00',
          boxShadow: '0 0 4px rgba(254, 223, 0, 0.4)',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#FEDF00',
            fontFamily: 'sans-serif',
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          D
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}

