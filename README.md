# Editor - Aplicación Frontend React con Funcionalidad Offline

## Descripción General

Editor es una aplicación web desarrollada en React y TypeScript que permite a los usuarios gestionar notas con funcionalidad offline. La aplicación proporciona una experiencia fluida incluso sin conexión a internet, permitiendo a los usuarios seguir creando y editando contenido después de autenticarse, y sincronizando automáticamente los cambios cuando se restablece la conexión.

![MEK Editor](./src/assets/react.svg)

## Índice

1. [Características Principales](#características-principales)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
   - [Sistema de Enrutamiento](#sistema-de-enrutamiento)
   - [Autenticación](#autenticación)
   - [Gestión del Estado](#gestión-del-estado)
   - [Funcionalidad Offline](#funcionalidad-offline)
   - [Sincronización de Datos](#sincronización-de-datos)
5. [Componentes Principales](#componentes-principales)
   - [Páginas](#páginas)
   - [Componentes de Autenticación](#componentes-de-autenticación)
6. [Configuración del Proyecto](#configuración-del-proyecto)
7. [Guía de Instalación](#guía-de-instalación)
8. [Uso de la Aplicación](#uso-de-la-aplicación)
9. [Desarrollo y Contribución](#desarrollo-y-contribución)

## Características Principales

- **Autenticación de usuarios**: Sistema completo de registro e inicio de sesión.
- **Funcionalidad offline**: Permite seguir trabajando sin conexión después de la autenticación.
- **Sincronización automática**: Envía los cambios realizados offline cuando se recupera la conexión.
- **Editor Markdown**: Soporte completo para creación y edición de notas con formato Markdown.
- **Interfaz responsiva**: Diseñada para funcionar en dispositivos de diferentes tamaños.
- **Personalización visual**: Permite establecer colores personalizados para cada nota.
- **Exportación de contenido**: Capacidad para exportar notas en formatos PDF y Markdown.
- **Gestión eficiente del estado**: Implementación reactiva usando Jotai.
- **Detección de estado de conexión**: Notificaciones y adaptación de la interfaz según la conectividad.

## Tecnologías Utilizadas

- **React**: Biblioteca para construir interfaces de usuario
- **TypeScript**: Superset tipado de JavaScript para desarrollo robusto
- **Jotai**: Biblioteca minimalista para gestión de estado
- **React Router**: Navegación y enrutamiento de la aplicación
- **Axios**: Cliente HTTP para comunicación con el backend
- **Tailwind CSS**: Framework de utilidades CSS para diseño responsivo
- **MDEditor**: Editor Markdown con vista previa en tiempo real
- **jsPDF**: Biblioteca para generación de archivos PDF
- **localStorage**: API nativa del navegador para almacenamiento offline

## Estructura del Proyecto

```
├── src/                        # Código fuente principal
│   ├── assets/                 # Imágenes, iconos y recursos estáticos
│   ├── components/             # Componentes reutilizables
│   │   └── AuthRoutes.tsx      # Componentes de protección de rutas
│   │
│   ├── pages/                  # Páginas principales de la aplicación
│   │   ├── login.tsx           # Página de inicio de sesión
│   │   ├── register.tsx        # Página de registro
│   │   ├── notes.tsx           # Lista de notas
│   │   └── notedetails.tsx     # Detalle y edición de notas
│   │
│   ├── services/               # Servicios para comunicación con APIs
│   │   ├── authServices.tsx    # Servicios de autenticación
│   │   └── offlineStore.ts     # Gestión del almacenamiento offline
│   │
│   ├── state/                  # Gestión del estado global
│   │   ├── authStore.ts        # Estado de autenticación
│   │   ├── notes.ts            # Estado y operaciones de notas
│   │   └── user.ts             # Estado del usuario
│   │
│   ├── utils/                  # Utilidades y helpers
│   │   └── onlineStatus.tsx    # Detección del estado de conexión
│   │
│   ├── index.css               # Estilos globales
│   ├── main.tsx                # Punto de entrada de la aplicación
│   └── router.tsx              # Configuración de rutas
│
├── public/                     # Archivos públicos estáticos
├── vite.config.ts              # Configuración de Vite
├── tsconfig.json               # Configuración de TypeScript
└── package.json                # Dependencias y scripts
```

## Arquitectura de la Aplicación

### Sistema de Enrutamiento (`/src/router.tsx`)

La aplicación utiliza React Router (v6) para manejar la navegación entre diferentes páginas. El sistema de enrutamiento está configurado con un enfoque en la seguridad y experiencia de usuario.

#### Características del Router:

- **Rutas públicas**: Login y registro accesibles sin autenticación (`PublicRoute`)
- **Rutas protegidas**: Acceso a notas solo para usuarios autenticados (`ProtectedRoute`)
- **Redirección inicial**: La ruta raíz redirige al login
- **Manejo de rutas no encontradas**: Componente NotFoundPage para URLs inválidas
- **Inicialización de autenticación**: Componente `AuthInitializer` que gestiona el estado de autenticación en toda la aplicación
- **Rutas parametrizadas**: Uso de parámetros en URL para acceder a notas específicas (`/notes/:id`)

### Autenticación

#### Componentes de Autenticación (`/src/components/AuthRoutes.tsx`)

La aplicación implementa un sistema robusto de autenticación y protección de rutas usando React Router y Jotai para la gestión del estado. Este componente contiene tres elementos clave:

##### 1. AuthInitializer

Componente que inicializa el estado de autenticación al cargar la aplicación:

- Se ejecuta una única vez al montar el componente
- Verifica la existencia de tokens de autenticación almacenados
- Carga el estado inicial del usuario si está autenticado
- Establece el estado de autenticación en toda la aplicación

##### 2. ProtectedRoute

Envuelve las rutas que requieren autenticación:

- Verifica si el usuario está autenticado antes de mostrar el contenido
- Muestra un indicador de carga durante la verificación de autenticación
- Redirige automáticamente a la página de login si el usuario no está autenticado
- Preserva la ruta original a la que el usuario intentaba acceder para redirigir después del login

##### 3. PublicRoute

Gestiona las rutas públicas (login y registro):

- Permite acceso a usuarios no autenticados
- Redirige automáticamente a usuarios ya autenticados hacia la página principal de notas
- Gestiona la redirección inteligente: si el usuario llegó a login después de intentar acceder a una ruta protegida, lo devuelve a esa ruta tras autenticarse

#### Gestión del Estado de Autenticación (`/src/state/authStore.ts`)

El sistema de autenticación utiliza Jotai como biblioteca de gestión de estado, proporcionando una solución elegante y reactiva para manejar el estado de autenticación en toda la aplicación.

##### Átomos y Estado

- **tokenAtom**: Almacena el token JWT de autenticación con persistencia en localStorage
- **userAtom**: Mantiene los datos del usuario autenticado
- **loadingAtom**: Indica cuándo se están realizando operaciones de autenticación
- **errorAtom**: Captura mensajes de error durante procesos de autenticación
- **isAuthenticatedAtom**: Estado derivado que determina si hay un usuario autenticado
- **authStateAtom**: Combina todos los estados anteriores en un objeto único para facilitar su uso

##### Configuración HTTP

- **setupAxiosAuth**: Configura automáticamente los headers de autorización para todas las solicitudes HTTP con Axios

##### Inicialización

- **initAuthAtom**: Verifica la autenticación al iniciar la aplicación:
  - Recupera el token almacenado
  - Valida el token con una solicitud al backend
  - Establece el estado de usuario si el token es válido
  - Limpia los datos si el token ha expirado o es inválido

##### Acciones de Autenticación

- **loginAtom**: Maneja el proceso de inicio de sesión
  - Envía credenciales al servidor
  - Almacena token y datos de usuario en caso de éxito
  - Captura y gestiona errores de autenticación
- **registerAtom**: Gestiona el registro de nuevos usuarios

  - Envía datos de registro al servidor
  - Autentica automáticamente al usuario tras un registro exitoso
  - Maneja errores durante el proceso de registro

- **logoutAtom**: Cierra la sesión del usuario
  - Elimina datos de usuario y token
  - Limpia headers de autorización

### Gestión del Estado

#### Gestión de Estado de Notas (`/src/state/notes.ts`)

Este archivo implementa la gestión completa del estado de las notas, incluyendo la sincronización offline, utilizando la biblioteca Jotai para un manejo reactivo y eficiente del estado.

##### Modelo de datos robusto

- Interfaces tipadas para notas, entradas de notas y actualizaciones offline
- Distinción clara entre notas del servidor y notas creadas localmente
- Metadatos completos para seguimiento de estado (creación, actualización, sincronización)

##### Átomos de estado

- `notesAtom`: Almacena las notas recuperadas del servidor
- `offlineNotesAtom`: Gestiona notas creadas/modificadas sin conexión con persistencia en localStorage
- `pendingUpdatesAtom`: Registro de operaciones pendientes de sincronización
- `allNotesAtom`: Combina notas del servidor y offline con estado de sincronización

##### Operaciones CRUD completas

- `fetchNotesAtom`: Recupera notas del servidor con manejo de errores y modo offline
- `createNoteAtom`: Crea notas en el servidor o localmente según la conectividad
- `updateNoteAtom`: Actualiza notas existentes con estrategia offline first
- `deleteNoteAtom`: Elimina notas con soporte para eliminación en background

##### Sistema de sincronización sofisticado

- `syncOfflineChangesAtom`: Sincroniza cambios pendientes cuando hay conexión
- Procesamiento en orden cronológico de operaciones pendientes
- Manejo de conflictos y recuperación de errores
- Limpieza automática de entradas obsoletas tras sincronización exitosa

##### Capacidades avanzadas

- Migración de datos legacy (`migrateLegacyPendingNotesAtom`)
- Estado de carga y manejo centralizado de errores
- Hook personalizado `useNotesService` para acceso simplificado a la funcionalidad
- Detección automática del estado de la conexión para adaptarse dinámicamente

### Funcionalidad Offline

La aplicación implementa una estrategia sofisticada de almacenamiento local que permite:

1. **Detección de conectividad**: Monitoreo constante del estado de conexión del usuario
2. **Almacenamiento local**: Guardado automático de cambios en localStorage cuando no hay conexión
3. **Cola de operaciones**: Registro ordenado de operaciones pendientes para sincronización futura
4. **Experiencia fluida**: Interfaz adaptativa que informa al usuario sobre el estado offline
5. **Resolución de conflictos**: Estrategias para manejar cambios concurrentes offline y online

### Sincronización de Datos

El sistema de sincronización implementa:

1. **Sincronización automática**: Detección de recuperación de conectividad y sincronización inmediata
2. **Sincronización manual**: Opción para que el usuario inicie manualmente la sincronización
3. **Priorización de operaciones**: Procesamiento ordenado de operaciones (creación, actualización, eliminación)
4. **Gestión de errores**: Manejo robusto de fallos durante la sincronización
5. **Feedback visual**: Indicadores del estado de sincronización para cada nota

## Componentes Principales

### Páginas

#### Página de Login (`/src/pages/login.tsx`)

La página de inicio de sesión proporciona una interfaz de usuario limpia y responsiva para que los usuarios accedan a la aplicación.

##### Características principales:

- **Diseño responsivo**:

  - Visualización a pantalla completa en dispositivos grandes con una sección de imagen
  - Adaptación automática para dispositivos móviles
  - Utiliza Tailwind CSS para estilos y adaptabilidad

- **Gestión de formularios**:

  - Captura de email y contraseña mediante estados de React
  - Validación básica de campos antes del envío
  - Manejo de errores con retroalimentación visual

- **Experiencia de usuario mejorada**:

  - Feedback visual de errores de autenticación
  - Enlace directo a la página de registro para nuevos usuarios
  - Estilos interactivos (hover) para elementos accionables

- **Integración con el sistema de autenticación**:

  - Utiliza el hook personalizado `useAuthService` para comunicarse con el backend
  - Preserva la URL original a la que el usuario intentaba acceder antes de autenticarse
  - Redirige automáticamente a la sección de notas tras un login exitoso

- **Seguridad**:
  - Campo de contraseña enmascarado
  - Gestión centralizada de la autenticación a través de servicios dedicados
  - Redirección inteligente post-autenticación

#### Página de Registro (`/src/pages/register.tsx`)

La página de registro permite a nuevos usuarios crear una cuenta para acceder a la aplicación, con un diseño coherente con la página de login para mantener una experiencia uniforme.

##### Características principales:

- **Interfaz consistente**:

  - Mantiene la misma estructura visual que la página de login
  - División en dos secciones en pantallas grandes: imagen y formulario
  - Adaptación a diferentes tamaños de pantalla gracias a Tailwind CSS

- **Formulario de registro**:

  - Campos para email y contraseña con gestión de estados
  - Manejo de errores con feedback visual para el usuario
  - Botón de envío de formulario con estilos interactivos

- **Integración con autenticación**:

  - Utiliza el hook `useAuthService` para manejar el registro de usuarios
  - Tras un registro exitoso, autentica automáticamente al usuario
  - Preserva la ruta de destino original si el usuario llegó desde otra página

- **Navegación fluida**:

  - Enlace directo a la página de login para usuarios ya registrados
  - Redirección automática a la sección de notas tras completar el registro
  - Gestión del estado de ubicación para mantener el contexto de navegación

- **Experiencia de usuario cuidada**:
  - Feedback visual de errores
  - Consistencia con el resto de la aplicación
  - Flujo simplificado para minimizar la fricción en el proceso de registro

#### Página de Notas (`/src/pages/notes.tsx`)

La página principal de notas es el núcleo de la aplicación, donde los usuarios pueden ver, crear y administrar sus notas con soporte completo para funcionamiento offline.

##### Características principales:

- **Gestión completa de notas**:

  - Listado de notas en un diseño de tarjetas responsivo
  - Creación de nuevas notas mediante un modal interactivo
  - Editor Markdown integrado con vista previa en tiempo real
  - Personalización del color de fondo para cada nota
  - Navegación a la vista detallada de cada nota

- **Funcionalidad offline robusta**:

  - Indicador visual del estado de conexión
  - Almacenamiento local automático de notas cuando no hay conexión
  - Contador de notas almacenadas offline
  - Sistema de sincronización al recuperar la conexión
  - Botón para sincronización manual con contador de cambios pendientes

- **Experiencia de usuario mejorada**:

  - Indicadores visuales del estado de sincronización de cada nota
  - Animaciones para operaciones en curso (carga, sincronización)
  - Mensajes informativos sobre el estado de la aplicación
  - Estados vacíos con llamadas a la acción intuitivas
  - Formateo automático de fechas para mejor legibilidad

- **Integración con el sistema de estado**:

  - Uso de átomos Jotai para la gestión del estado
  - Manejo eficiente de las operaciones CRUD
  - Detección automática de cambios pendientes
  - Flujo optimizado de sincronización de datos

- **Características de seguridad**:
  - Saneamiento de contenido Markdown para prevenir XSS
  - Manejo de sesiones expiradas con redirección al login
  - Preservación de datos locales en caso de desconexión
  - Función de logout con limpieza de estado

#### Página de Detalle de Notas (`/src/pages/notedetails.tsx`)

La página de detalle de notas proporciona una interfaz completa para ver, editar y gestionar notas individuales, con soporte total para funcionalidad offline y capacidades avanzadas de exportación.

##### Características principales:

- **Visualización enriquecida de notas**:

  - Renderizado de contenido Markdown con formato visual completo
  - Indicadores de estado de sincronización para notas offline
  - Información detallada de metadatos (fechas de creación y actualización)
  - Adaptación de interfaz según el estado de la conexión

- **Edición completa de notas**:

  - Editor Markdown integrado con vista previa en tiempo real
  - Actualización de título, contenido y color de fondo
  - Saneamiento automático de contenido para prevenir vulnerabilidades XSS
  - Gestión de estado local durante la edición para evitar pérdidas

- **Funcionalidad offline robusta**:

  - Soporte para editar notas sin conexión con guardado local
  - Manejo inteligente de notas locales vs. notas del servidor
  - Adaptación de operaciones según el estado de la conexión
  - Sincronización automática al recuperar la conexión

- **Capacidades de exportación avanzadas**:

  - Exportación a formato PDF con formato preservado
  - Exportación a archivo Markdown para compatibilidad universal
  - Interfaz intuitiva con menú desplegable de opciones
  - Generación de nombres de archivo basados en el título de la nota

- **Experiencia de usuario mejorada**:
  - Indicadores visuales de carga y estado de guardado
  - Confirmaciones para operaciones destructivas (eliminación)
  - Notificaciones sobre el estado de la conexión
  - Navegación fluida entre vistas de detalle y lista

### Componentes de Autenticación

La aplicación implementa componentes especializados para gestionar el flujo de autenticación y protección de rutas:

- **AuthInitializer**: Inicializa el estado de autenticación y verifica la validez de las sesiones.
- **ProtectedRoute**: Envuelve rutas que requieren autenticación y redirige si es necesario.
- **PublicRoute**: Gestiona rutas accesibles sin autenticación y redirige a usuarios ya autenticados.
- **useAuthService**: Hook personalizado que proporciona acceso a todas las funciones de autenticación.

## Configuración del Proyecto

Este proyecto está configurado con:

- **TypeScript**: Configuración en `tsconfig.json`, `tsconfig.app.json` y `tsconfig.node.json`
- **ESLint**: Configuración en `eslint.config.js`
- **Vite**: Configuración en `vite.config.ts` para un desarrollo rápido
- **TailwindCSS**: Utilidades CSS para un diseño eficiente y responsivo
- **Axios**: Cliente HTTP configurado para incluir automáticamente tokens de autenticación

## Guía de Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/Cryp01/mek_prueba_frontend.git
   cd MEK_PRUEBA/EDITOR
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar variables de entorno (si es necesario):

   ```bash
   cp .env.example .env
   # Editar .env con los valores adecuados
   ```

4. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abrir [http://localhost:5173](http://localhost:5173) en el navegador.

## Uso de la Aplicación

1. **Registro/Login**: Crea una cuenta nueva o inicia sesión con credenciales existentes.
2. **Gestión de notas**:
   - Visualiza tu lista de notas en la página principal.
   - Crea nuevas notas con el botón "New Note".
   - Edita notas existentes haciendo clic en ellas.
   - Personaliza el color de cada nota para mejor organización.
3. **Funcionalidad offline**:
   - La aplicación seguirá funcionando sin conexión después de iniciar sesión.
   - Un indicador mostrará el estado de la conexión.
   - Los cambios se almacenarán localmente y se sincronizarán cuando vuelva la conexión.
4. **Exportación de notas**:
   - Exporta tus notas a formato PDF o Markdown desde la vista de detalle.
