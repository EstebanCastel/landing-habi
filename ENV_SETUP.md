# Configuración de Variables de Entorno

## ElevenLabs API Configuration

Para activar el agente de voz, necesitas configurar las credenciales de ElevenLabs:

### Paso 1: Crear archivo `.env.local`

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

### Paso 2: Obtener credenciales de ElevenLabs

1. Crea una cuenta en [https://elevenlabs.io](https://elevenlabs.io)
2. Obtén tu API key en [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)
3. Elige una voz en [https://elevenlabs.io/app/voice-lab](https://elevenlabs.io/app/voice-lab)
4. Copia el Voice ID de la voz que elijas

### Paso 3: Configurar

Reemplaza `your_elevenlabs_api_key_here` con tu API key real.

### Paso 4: Reiniciar servidor

Después de crear el archivo `.env.local`, reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Voces Recomendadas (Español)

- **EXAVITQu4vr4xnSDxMaL** - Sarah (Voz femenina profesional)
- **pNInz6obpgDQGcFmaJgB** - Adam (Voz masculina cálida)
- **TxGEqnHWrfWFTfGW9XjX** - Josh (Voz masculina clara)

## Nota de Seguridad

⚠️ **IMPORTANTE**: Nunca subas el archivo `.env.local` a Git. Este archivo está en `.gitignore` por seguridad.

