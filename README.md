# 🏠 Configurador Habi - Landing Page

Configurador interactivo para ofertas de compra de inmuebles con diseño inspirado en Tesla y asistente de voz con IA.

## ✨ Características

### 🎨 Diseño y UX
- **Diseño Tesla-like**: Interfaz minimalista y moderna con degradados morados
- **Animaciones suaves**: Casa flotante y cards con transiciones elegantes
- **Precio animado**: Contador dinámico que se anima al cambiar opciones
- **Responsive**: Optimizado para todos los dispositivos

### 🤖 Asistente de Voz con IA
- **Guía conversacional**: Agente de voz que explica cada sección
- **Powered by ElevenLabs**: Síntesis de voz natural en español
- **No intrusivo**: Se puede activar/desactivar fácilmente
- **Contextual**: Habla según las decisiones del usuario

### ⚙️ Funcionalidades del Configurador
- **Cards flotantes**: Trámites y remodelación con transiciones
- **Cálculo dinámico**: Precio actualizado en tiempo real
- **4 formas de pago**: Contado, 3, 6 y 9 cuotas
- **Opciones personalizables**: Trámites y remodelación

### 📄 Página de Alternativas
- **Video explicativo**: Costo de oportunidad de no vender con Habi
- **Folleto descargable**: Guía completa para vender por cuenta propia
- **Tono empático**: Sin presión, ofreciendo ayuda genuina

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/EstebanCastel/landing-habi.git
cd landing-habi

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🎤 Configurar Asistente de Voz

### 1. Obtener API Key de ElevenLabs

1. Crea una cuenta en [elevenlabs.io](https://elevenlabs.io)
2. Ve a [Settings → API Keys](https://elevenlabs.io/app/settings/api-keys)
3. Genera una nueva API key

### 2. Elegir una Voz

1. Ve al [Voice Lab](https://elevenlabs.io/app/voice-lab)
2. Explora las voces disponibles en español
3. Copia el Voice ID de la voz que elijas

**Voces recomendadas:**
- `EXAVITQu4vr4xnSDxMaL` - Sarah (femenina, profesional)
- `pNInz6obpgDQGcFmaJgB` - Adam (masculina, cálida)

### 3. Crear archivo de configuración

Crea un archivo `.env.local` en la raíz del proyecto:

```env
ELEVENLABS_API_KEY=tu_api_key_aqui
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

### 4. Reiniciar servidor

```bash
npm run dev
```

## 📂 Estructura del Proyecto

```
tesla/
├── app/
│   ├── components/
│   │   └── VoiceAgent.tsx          # Asistente de voz
│   ├── habi/
│   │   ├── components/
│   │   │   ├── AnimatedPrice.tsx   # Precio con contador animado
│   │   │   ├── ConfiguratorRight.tsx # Opciones de configuración
│   │   │   ├── HabiHero.tsx        # Sección hero
│   │   │   ├── StickyPrice.tsx     # Barra de precio fija
│   │   │   └── VisualLeft.tsx      # Casa y cards flotantes
│   │   └── page.tsx                # Página del configurador
│   ├── alternativas/
│   │   └── page.tsx                # Página de alternativas
│   ├── api/
│   │   └── elevenlabs/
│   │       └── route.ts            # API endpoint para voz
│   ├── types/
│   │   └── habi.ts                 # Tipos TypeScript
│   ├── page.tsx                    # Página principal
│   └── layout.tsx                  # Layout raíz
├── public/
│   ├── casa.svg                    # Ilustración de casa
│   ├── remo.svg                    # Ícono remodelación cliente
│   ├── habiremo.svg                # Ícono remodelación Habi
│   ├── tutramites.svg              # Ícono trámites cliente
│   ├── tramiteshabi.svg            # Ícono trámites Habi
│   ├── folleto.svg                 # Folleto guía
│   └── Costo_De_Oportunidad_De_No_Vender.mp4
└── ENV_SETUP.md                    # Guía de configuración
```

## 🎯 Uso del Asistente de Voz

### Activar/Desactivar
- Haz clic en el botón flotante en la esquina inferior izquierda
- Cuando está activo, el botón se vuelve morado
- Cuando habla, verás animaciones de ondas

### Secciones con Voz
El asistente habla automáticamente en:
1. **Hero**: Bienvenida inicial
2. **Inicio**: Explicación de la construcción del precio
3. **Trámites**: Guía según la opción elegida
4. **Remodelación**: Explicación de cada opción
5. **Forma de pago**: Recomendaciones
6. **Precio final**: Confirmación del precio
7. **Alternativas**: Orientación en la página

### Personalización
Para personalizar los mensajes, edita el objeto `messages` en `/app/components/VoiceAgent.tsx`.

## 🎨 Personalización de Colores

Los colores están centralizados en Tailwind CSS:
- **Morado principal**: `purple-600` (#9333ea)
- **Morado claro**: `purple-50` (#faf5ff)
- **Degradados**: `from-purple-50 to-white`

Para cambiar, modifica las clases en los componentes.

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
# ELEVENLABS_API_KEY
# ELEVENLABS_VOICE_ID
```

### Otras plataformas
Compatible con cualquier plataforma que soporte Next.js 16:
- Netlify
- AWS Amplify
- Railway
- Render

## 📊 Lógica de Precios

### Precio Base
```typescript
precioBase = valorMercado * 0.782  // 78.2% del valor de mercado
```

### Incrementos
- **Trámites cliente**: +4%
- **Remodelación cliente**: +3%
- **3 cuotas**: +0.8%
- **6 cuotas**: +2.1%
- **9 cuotas**: +3.4%

### Costos Fijos (asumidos por Habi)
- **Comisión**: 4.4%
- **Gastos mensuales**: 0.8%

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

## 🛠️ Tecnologías

- **Framework**: Next.js 16.1.0 (Turbopack)
- **UI**: React 19, Tailwind CSS v4
- **Lenguaje**: TypeScript
- **API de Voz**: ElevenLabs Text-to-Speech
- **Hosting**: Vercel-ready

## 📝 Notas de Desarrollo

### Tailwind CSS v4
Este proyecto usa Tailwind CSS v4, que tiene sintaxis diferente:
- `@import "tailwindcss"` en lugar de `@tailwind`
- `theme()` en lugar de `@apply`

### Animaciones
Las animaciones de flotación usan CSS custom con `@keyframes` en JSX.

### Estado Global
El estado se maneja con React Hooks (useState, useEffect) sin libraries adicionales.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es propiedad de Habi.

## 🆘 Soporte

Para preguntas o soporte, contacta al equipo de desarrollo de Habi.

---

Hecho con 💜 por el equipo de Habi
