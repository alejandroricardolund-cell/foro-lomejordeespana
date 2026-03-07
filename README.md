# Foro Privado "Lo Mejor De España"

Foro privado exclusivo con acceso solo por invitación.

## Requisitos para Hostinger

1. **Plan VPS o Cloud Hosting** (necesario para Node.js)
2. Node.js 18+ instalado
3. Acceso SSH al servidor

## Instalación en Hostinger

### Paso 1: Subir archivos
Sube todos los archivos a tu servidor (por ejemplo en `/home/usuario/foro/`)

### Paso 2: Configurar entorno
```bash
cd /home/usuario/foro
cp .env.example .env
```

### Paso 3: Instalar dependencias
```bash
npm install
```

### Paso 4: Inicializar base de datos
```bash
npx prisma generate
npx prisma db push
```

### Paso 5: Compilar para producción
```bash
npm run build
```

### Paso 6: Iniciar el servidor
```bash
PORT=3000 npm start
```

## Configurar como servicio (PM2)

Para que el foro se ejecute siempre:

```bash
npm install -g pm2
pm2 start npm --name "foro" -- start
pm2 save
pm2 startup
```

## Configurar dominio

1. Ve al panel de Hostinger
2. Configura tu dominio apuntando al puerto 3000
3. O usa el proxy inverso de Hostinger

## Usar el foro

1. Accede a tu dominio
2. Haz clic en "Inicializar Sistema"
3. Guarda la clave de administrador
4. Entra y comienza a crear temas e invitar miembros

## Estructura del proyecto

```
├── prisma/
│   └── schema.prisma    # Esquema de base de datos
├── src/
│   ├── app/
│   │   ├── api/         # APIs del foro
│   │   ├── page.tsx     # Página principal
│   │   └── layout.tsx   # Layout
│   ├── components/ui/   # Componentes de interfaz
│   └── lib/             # Utilidades
├── public/              # Archivos estáticos
└── package.json
```

## Características

- ✅ Acceso solo por clave personal
- ✅ Sistema de seguridad (bloqueo tras 3 errores)
- ✅ Panel de administración
- ✅ Temas y subtemas
- ✅ Chat de brainstorming
- ✅ Sistema Like/Dislike
- ✅ Correo interno
- ✅ Gestión de perfil

## Soporte

Para problemas técnicos, revisa los logs:
```bash
pm2 logs foro
```
