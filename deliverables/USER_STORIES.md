# Backlog Recovery - OWASP Juice Shop
## User Stories Extracted from Code Analysis

**Fecha:** 2 de Febrero, 2026
**Proyecto:** OWASP Juice Shop v19.1.1
**Método:** AI-Driven Reverse Engineering

---

## Convención de Trazabilidad

Cada User Story incluye:
- **ID:** Identificador único (BC-XXX donde BC = Bounded Context)
- **Prioridad:** Must/Should/Could/Won't (MoSCoW)
- **Archivos:** Rutas a archivos de implementación
- **Endpoints:** APIs relacionadas

---

## 1. Identity Context (Gestión de Identidad)

### ID-001: Registro de Usuario
> **Como** visitante
> **Quiero** crear una cuenta con email y contraseña
> **Para** poder acceder a las funcionalidades de la tienda

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/register.ts`, `models/user.ts` |
| Frontend | `frontend/src/app/register/` |
| Endpoint | `POST /api/Users` |

---

### ID-002: Login de Usuario
> **Como** usuario registrado
> **Quiero** iniciar sesión con mis credenciales
> **Para** acceder a mi cuenta y realizar compras

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/login.ts`, `lib/insecurity.ts` |
| Frontend | `frontend/src/app/login/` |
| Endpoint | `POST /api/Users/login` |

---

### ID-003: Login con OAuth (Google)
> **Como** usuario
> **Quiero** iniciar sesión con mi cuenta de Google
> **Para** acceder sin crear una contraseña nueva

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/login.ts`, `config/default.yml` |
| Frontend | `frontend/src/app/oauth/` |
| Endpoint | `POST /api/Users/login` (with OAuth token) |

---

### ID-004: Cambio de Contraseña
> **Como** usuario autenticado
> **Quiero** cambiar mi contraseña actual
> **Para** mejorar la seguridad de mi cuenta

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/changePassword.ts` |
| Frontend | `frontend/src/app/change-password/` |
| Endpoint | `GET /rest/user/change-password` |

---

### ID-005: Recuperación de Contraseña
> **Como** usuario que olvidó su contraseña
> **Quiero** resetearla mediante pregunta de seguridad
> **Para** recuperar acceso a mi cuenta

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/resetPassword.ts`, `models/securityAnswer.ts` |
| Frontend | `frontend/src/app/forgot-password/` |
| Endpoint | `POST /rest/user/reset-password` |

---

### ID-006: Autenticación de Dos Factores (2FA)
> **Como** usuario preocupado por la seguridad
> **Quiero** habilitar 2FA con TOTP
> **Para** añadir una capa extra de protección

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/2fa.ts`, `lib/insecurity.ts` |
| Frontend | `frontend/src/app/two-factor-auth-enter/`, `frontend/src/app/two-factor-auth/` |
| Endpoints | `POST /rest/2fa/setup`, `POST /rest/2fa/verify`, `POST /rest/2fa/disable` |

---

### ID-007: Ver Perfil de Usuario
> **Como** usuario autenticado
> **Quiero** ver y editar mi información de perfil
> **Para** mantener mis datos actualizados

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/currentUser.ts`, `routes/userProfile.ts` |
| Frontend | `frontend/src/app/profile/` |
| Endpoint | `GET /rest/user/whoami` |

---

### ID-008: Subir Imagen de Perfil
> **Como** usuario autenticado
> **Quiero** subir una foto de perfil
> **Para** personalizar mi cuenta

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/profileImageFileUpload.ts`, `routes/profileImageUrlUpload.ts` |
| Frontend | `frontend/src/app/profile/` |
| Endpoints | `POST /rest/user/profileImage`, `POST /rest/user/profileImage/url` |

---

## 2. Shopping Context (Compras)

### SH-001: Ver Catálogo de Productos
> **Como** visitante o usuario
> **Quiero** ver la lista de productos disponibles
> **Para** explorar lo que puedo comprar

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `models/product.ts`, `server.ts` (finale-rest) |
| Frontend | `frontend/src/app/search-result/` |
| Endpoint | `GET /api/Products` |

---

### SH-002: Buscar Productos
> **Como** usuario
> **Quiero** buscar productos por nombre
> **Para** encontrar rápidamente lo que necesito

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/search.ts` |
| Frontend | `frontend/src/app/search-result/` |
| Endpoint | `GET /rest/products/search?q=` |

---

### SH-003: Agregar Producto al Carrito
> **Como** usuario autenticado
> **Quiero** agregar productos a mi carrito
> **Para** preparar mi compra

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/basketItems.ts`, `models/basketitem.ts` |
| Frontend | `frontend/src/app/basket/` |
| Endpoint | `POST /api/BasketItems` |

---

### SH-004: Ver Carrito de Compras
> **Como** usuario autenticado
> **Quiero** ver los productos en mi carrito
> **Para** revisar antes de comprar

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/basket.ts`, `models/basket.ts` |
| Frontend | `frontend/src/app/basket/` |
| Endpoint | `GET /rest/basket/:id` |

---

### SH-005: Modificar Cantidad en Carrito
> **Como** usuario autenticado
> **Quiero** cambiar la cantidad de un producto en mi carrito
> **Para** ajustar mi pedido

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/basketItems.ts` |
| Frontend | `frontend/src/app/basket/` |
| Endpoint | `PUT /api/BasketItems/:id` |

---

### SH-006: Eliminar Producto del Carrito
> **Como** usuario autenticado
> **Quiero** eliminar un producto del carrito
> **Para** quitar algo que no quiero comprar

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/basketItems.ts` |
| Frontend | `frontend/src/app/basket/` |
| Endpoint | `DELETE /api/BasketItems/:id` |

---

### SH-007: Aplicar Cupón de Descuento
> **Como** usuario con un código de cupón
> **Quiero** aplicarlo a mi carrito
> **Para** obtener un descuento

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/coupon.ts` |
| Frontend | `frontend/src/app/basket/` |
| Endpoint | `PUT /rest/basket/:id/coupon/:coupon` |

---

### SH-008: Proceso de Checkout
> **Como** usuario autenticado
> **Quiero** completar el proceso de compra
> **Para** finalizar mi pedido

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/order.ts` |
| Frontend | `frontend/src/app/order-summary/`, `frontend/src/app/order-completion/` |
| Endpoint | `POST /rest/basket/:id/checkout` |

---

### SH-009: Seleccionar Método de Pago
> **Como** usuario en checkout
> **Quiero** seleccionar cómo pagar
> **Para** completar mi compra con mi método preferido

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/payment.ts`, `models/card.ts` |
| Frontend | `frontend/src/app/payment/`, `frontend/src/app/payment-method/` |
| Endpoint | `GET /api/Cards`, `POST /api/Cards` |

---

### SH-010: Guardar Tarjeta de Crédito
> **Como** usuario frecuente
> **Quiero** guardar mi tarjeta para futuras compras
> **Para** agilizar el proceso de pago

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/payment.ts`, `models/card.ts` |
| Frontend | `frontend/src/app/saved-payment-methods/` |
| Endpoints | `POST /api/Cards`, `DELETE /api/Cards/:id` |

---

### SH-011: Ver Historial de Pedidos
> **Como** usuario autenticado
> **Quiero** ver mis pedidos anteriores
> **Para** revisar mi historial de compras

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/orderHistory.ts` |
| Frontend | `frontend/src/app/order-history/` |
| Endpoint | `GET /rest/order-history` |

---

### SH-012: Descargar Factura PDF
> **Como** usuario que realizó una compra
> **Quiero** descargar la factura en PDF
> **Para** tener un comprobante de mi pedido

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/order.ts` (PDF generation) |
| Frontend | `frontend/src/app/order-history/` |
| Endpoint | `GET /ftp/order_:id.pdf` |

---

### SH-013: Membresía Deluxe
> **Como** usuario frecuente
> **Quiero** obtener membresía Deluxe
> **Para** acceder a precios especiales y beneficios

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/deluxe.ts` |
| Frontend | `frontend/src/app/deluxe-user/` |
| Endpoints | `GET /rest/deluxe-membership`, `POST /rest/deluxe-membership` |

---

## 3. Delivery Context (Entregas)

### DL-001: Gestionar Direcciones de Envío
> **Como** usuario autenticado
> **Quiero** agregar/editar/eliminar direcciones
> **Para** tener opciones de envío guardadas

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/address.ts`, `models/address.ts` |
| Frontend | `frontend/src/app/address/`, `frontend/src/app/address-create/`, `frontend/src/app/address-select/` |
| Endpoints | `GET /api/Addresss`, `POST /api/Addresss`, `PUT /api/Addresss/:id`, `DELETE /api/Addresss/:id` |

---

### DL-002: Seleccionar Método de Envío
> **Como** usuario en checkout
> **Quiero** elegir el método de envío
> **Para** decidir entre velocidad y costo

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/delivery.ts`, `models/delivery.ts` |
| Frontend | `frontend/src/app/delivery-method/` |
| Endpoint | `GET /api/Deliverys` |
| Opciones | Standard ($5, 5 días), Fast ($10, 3 días), One Day ($15, 1 día) |

---

## 4. Feedback Context (Retroalimentación)

### FB-001: Escribir Reseña de Producto
> **Como** usuario que compró un producto
> **Quiero** escribir una reseña
> **Para** compartir mi opinión con otros compradores

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/createProductReviews.ts` |
| Frontend | `frontend/src/app/product-details/` |
| Endpoint | `PUT /rest/products/:id/reviews` |

---

### FB-002: Ver Reseñas de Producto
> **Como** visitante o usuario
> **Quiero** ver las reseñas de un producto
> **Para** tomar una decisión de compra informada

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/showProductReviews.ts` |
| Frontend | `frontend/src/app/product-details/` |
| Endpoint | `GET /rest/products/:id/reviews` |

---

### FB-003: Dar Like a una Reseña
> **Como** usuario
> **Quiero** marcar una reseña como útil
> **Para** ayudar a otros compradores

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/likeProductReviews.ts` |
| Frontend | `frontend/src/app/product-details/` |
| Endpoint | `POST /rest/products/reviews` |

---

### FB-004: Enviar Feedback General
> **Como** usuario
> **Quiero** enviar comentarios sobre la tienda
> **Para** compartir mi experiencia general

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `models/feedback.ts`, `server.ts` |
| Frontend | `frontend/src/app/contact/` |
| Endpoint | `POST /api/Feedbacks` |

---

### FB-005: Crear Queja/Reclamo
> **Como** usuario insatisfecho
> **Quiero** crear una queja formal
> **Para** reportar un problema con mi pedido

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/fileUpload.ts`, `models/complaint.ts` |
| Frontend | `frontend/src/app/complaint/` |
| Endpoint | `POST /api/Complaints` |

---

### FB-006: Interactuar con Chatbot
> **Como** usuario con dudas
> **Quiero** chatear con el bot de soporte
> **Para** obtener respuestas rápidas

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/chatbot.ts`, `data/chatbot/` |
| Frontend | `frontend/src/app/chatbot/` |
| Endpoint | `POST /rest/chatbot/respond` |

---

## 5. Privacy Context (Privacidad - GDPR)

### PR-001: Exportar Mis Datos
> **Como** usuario
> **Quiero** exportar todos mis datos personales
> **Para** cumplir con mi derecho GDPR de portabilidad

| Campo | Valor |
|-------|-------|
| Prioridad | Must (GDPR) |
| Estado | Implementado |
| Archivos | `routes/dataExport.ts` |
| Frontend | `frontend/src/app/privacy-security/` |
| Endpoint | `GET /rest/user/data-export` |

---

### PR-002: Solicitar Borrado de Datos
> **Como** usuario
> **Quiero** solicitar el borrado de mi cuenta y datos
> **Para** ejercer mi derecho al olvido (GDPR)

| Campo | Valor |
|-------|-------|
| Prioridad | Must (GDPR) |
| Estado | Implementado |
| Archivos | `routes/dataErasure.ts`, `models/privacyRequests.ts` |
| Frontend | `frontend/src/app/privacy-security/` |
| Endpoint | `POST /rest/user/data-export` |

---

### PR-003: Ver Política de Privacidad
> **Como** usuario
> **Quiero** leer la política de privacidad
> **Para** entender cómo se manejan mis datos

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/privacyPolicyProof.ts` |
| Frontend | `frontend/src/app/privacy-policy/` |
| Endpoint | `GET /api/privacy-requests` |

---

## 6. Administration Context (Administración)

### AD-001: Ver Panel de Administración
> **Como** administrador
> **Quiero** acceder al panel de admin
> **Para** gestionar usuarios y feedback

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `server.ts` (admin routes) |
| Frontend | `frontend/src/app/administration/` |
| Endpoint | `GET /administration` |
| Rol requerido | `admin` |

---

### AD-002: Gestionar Usuarios (Admin)
> **Como** administrador
> **Quiero** ver y gestionar usuarios registrados
> **Para** administrar la base de usuarios

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `routes/authenticatedUsers.ts` |
| Frontend | `frontend/src/app/administration/` |
| Endpoint | `GET /rest/admin/application-users` |
| Rol requerido | `admin` |

---

### AD-003: Ver Feedback (Admin)
> **Como** administrador
> **Quiero** ver todo el feedback de usuarios
> **Para** monitorear la satisfacción del cliente

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `models/feedback.ts`, `server.ts` |
| Frontend | `frontend/src/app/administration/` |
| Endpoint | `GET /api/Feedbacks` |
| Rol requerido | `admin` |

---

### AD-004: Acceso a Contabilidad
> **Como** usuario de contabilidad
> **Quiero** acceder al módulo de accounting
> **Para** revisar información financiera

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `routes/b2bOrder.ts` |
| Frontend | `frontend/src/app/accounting/` |
| Endpoint | `GET /accounting` |
| Rol requerido | `accounting` |

---

## 7. Challenge Context (Gamificación)

### CH-001: Ver Scoreboard de Desafíos
> **Como** participante de CTF
> **Quiero** ver el scoreboard con todos los desafíos
> **Para** trackear mi progreso

| Campo | Valor |
|-------|-------|
| Prioridad | Must |
| Estado | Implementado |
| Archivos | `lib/challengeUtils.ts`, `models/challenge.ts` |
| Frontend | `frontend/src/app/score-board/` |
| Endpoint | `GET /api/Challenges` |

---

### CH-002: Ver Hints de Desafíos
> **Como** participante que está atascado
> **Quiero** ver hints para un desafío
> **Para** obtener ayuda sin la solución completa

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `models/hint.ts`, `data/static/challenges.yml` |
| Frontend | `frontend/src/app/score-board/` |
| Endpoint | `GET /api/Challenges` (includes hints) |

---

### CH-003: Resolver Coding Challenges
> **Como** participante
> **Quiero** resolver desafíos de código (find it/fix it)
> **Para** aprender sobre código seguro

| Campo | Valor |
|-------|-------|
| Prioridad | Should |
| Estado | Implementado |
| Archivos | `lib/codingChallenges.ts`, `routes/vulnCodeSnippet.ts`, `routes/vulnCodeFixes.ts` |
| Frontend | `frontend/src/app/code-snippet/`, `frontend/src/app/code-fixes/` |
| Endpoints | `GET /snippets`, `POST /snippets/verdict` |

---

### CH-004: Obtener Continue Code
> **Como** participante
> **Quiero** obtener un código para continuar mi progreso
> **Para** no perder mi avance si cambio de dispositivo

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/continueCode.ts` |
| Frontend | `frontend/src/app/score-board/` |
| Endpoint | `GET /rest/continue-code`, `PUT /rest/continue-code/apply/:code` |

---

## 8. Blockchain Context (Web3)

### BC-001: Ver Balance de Wallet
> **Como** usuario con wallet
> **Quiero** ver mi balance de criptomonedas
> **Para** saber cuánto tengo disponible

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/wallet.ts`, `models/wallet.ts` |
| Frontend | `frontend/src/app/wallet/` |
| Endpoint | `GET /rest/wallet/balance` |

---

### BC-002: Mintear NFT
> **Como** usuario
> **Quiero** mintear un NFT exclusivo
> **Para** obtener un coleccionable digital

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/nftMint.ts` |
| Frontend | `frontend/src/app/nft-unlock/` |
| Endpoints | `GET /rest/nft/verify`, `POST /rest/nft/mint` |

---

## 9. Recycle Context (Reciclaje)

### RC-001: Solicitar Reciclaje
> **Como** usuario consciente del ambiente
> **Quiero** solicitar reciclaje de envases
> **Para** contribuir a la sostenibilidad

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/recycles.ts`, `models/recycle.ts` |
| Frontend | `frontend/src/app/recycle/` |
| Endpoint | `POST /api/Recycles` |

---

## 10. File Management Context

### FM-001: Descargar Archivos Públicos
> **Como** usuario
> **Quiero** descargar archivos del servidor FTP
> **Para** obtener documentos legales y otros recursos

| Campo | Valor |
|-------|-------|
| Prioridad | Could |
| Estado | Implementado |
| Archivos | `routes/fileServer.ts` |
| Frontend | `frontend/src/app/about/` |
| Endpoint | `GET /ftp/:file` |

---

## Resumen del Backlog

| Contexto | Total | Must | Should | Could |
|----------|-------|------|--------|-------|
| Identity | 8 | 4 | 3 | 1 |
| Shopping | 13 | 7 | 5 | 1 |
| Delivery | 2 | 2 | 0 | 0 |
| Feedback | 6 | 0 | 4 | 2 |
| Privacy | 3 | 3 | 0 | 0 |
| Administration | 4 | 2 | 2 | 0 |
| Challenge | 4 | 1 | 2 | 1 |
| Blockchain | 2 | 0 | 0 | 2 |
| Recycle | 1 | 0 | 0 | 1 |
| File Management | 1 | 0 | 0 | 1 |
| **TOTAL** | **44** | **19** | **16** | **9** |

---

## Matriz de Trazabilidad

| User Story | Backend Route | Model | Frontend Component |
|------------|---------------|-------|-------------------|
| ID-001 | `routes/register.ts` | `user.ts` | `register/` |
| ID-002 | `routes/login.ts` | `user.ts` | `login/` |
| ID-006 | `routes/2fa.ts` | `user.ts` | `two-factor-auth/` |
| SH-001 | `server.ts` | `product.ts` | `search-result/` |
| SH-003 | `routes/basketItems.ts` | `basketitem.ts` | `basket/` |
| SH-008 | `routes/order.ts` | `basket.ts` | `order-summary/` |
| DL-001 | `routes/address.ts` | `address.ts` | `address/` |
| DL-002 | `routes/delivery.ts` | `delivery.ts` | `delivery-method/` |
| FB-001 | `routes/createProductReviews.ts` | (MongoDB) | `product-details/` |
| PR-001 | `routes/dataExport.ts` | `privacyRequests.ts` | `privacy-security/` |
| CH-001 | `lib/challengeUtils.ts` | `challenge.ts` | `score-board/` |

---

## Notas de Implementación

### Vulnerabilidades Intencionales
Muchas User Stories contienen vulnerabilidades de seguridad deliberadas para propósitos educativos:

- **ID-002 (Login):** SQL Injection posible
- **SH-002 (Búsqueda):** XSS Reflected
- **FB-004 (Feedback):** XSS Stored
- **FM-001 (Archivos):** Path Traversal

Estas vulnerabilidades son **intencionalmente** parte del diseño del proyecto OWASP Juice Shop para entrenamiento en seguridad.
