# Context Map - OWASP Juice Shop
## Domain-Driven Design Analysis

**Fecha:** 2 de Febrero, 2026
**Proyecto:** OWASP Juice Shop v19.1.1

---

## 1. Context Map Overview (MermaidJS)

```mermaid
flowchart TB
    subgraph Core["CORE DOMAIN"]
        direction TB
        SHOP["Shopping Context<br/>━━━━━━━━━━━━━━<br/>Basket, Products<br/>Orders, Payments"]
        USER["Identity Context<br/>━━━━━━━━━━━━━━<br/>Users, Auth<br/>Profiles, Security"]
    end

    subgraph Supporting["SUPPORTING DOMAINS"]
        direction TB
        DELIVERY["Delivery Context<br/>━━━━━━━━━━━━━━<br/>Shipping Methods<br/>Address Management"]
        FEEDBACK["Feedback Context<br/>━━━━━━━━━━━━━━<br/>Reviews, Complaints<br/>Customer Support"]
        PRIVACY["Privacy Context<br/>━━━━━━━━━━━━━━<br/>GDPR, Data Export<br/>Data Erasure"]
    end

    subgraph Generic["GENERIC SUBDOMAINS"]
        direction TB
        CHALLENGE["Challenge Context<br/>━━━━━━━━━━━━━━<br/>Security Challenges<br/>Gamification"]
        ADMIN["Administration Context<br/>━━━━━━━━━━━━━━<br/>User Management<br/>System Config"]
        WEB3["Blockchain Context<br/>━━━━━━━━━━━━━━<br/>NFT, Wallet<br/>Smart Contracts"]
        CHATBOT["Chatbot Context<br/>━━━━━━━━━━━━━━<br/>Customer Service<br/>AI Responses"]
        I18N["Localization Context<br/>━━━━━━━━━━━━━━<br/>Translations<br/>44 Languages"]
    end

    %% Core Domain Relationships
    USER -->|"Customer/Conformist"| SHOP
    SHOP -->|"Shared Kernel"| USER

    %% Supporting Domain Relationships
    SHOP -->|"Customer/Supplier"| DELIVERY
    SHOP -->|"Published Language"| FEEDBACK
    USER -->|"Customer/Supplier"| PRIVACY

    %% Generic Subdomain Relationships
    USER -->|"Conformist"| ADMIN
    SHOP -->|"ACL"| WEB3
    USER -->|"ACL"| CHATBOT
    SHOP -->|"Conformist"| CHALLENGE

    %% Cross-cutting
    I18N -.->|"Open Host Service"| SHOP
    I18N -.->|"Open Host Service"| USER
    I18N -.->|"Open Host Service"| FEEDBACK

    classDef core fill:#4a90d9,stroke:#2e5d8c,color:white
    classDef supporting fill:#7cb342,stroke:#558b2f,color:white
    classDef generic fill:#ff9800,stroke:#e65100,color:white

    class SHOP,USER core
    class DELIVERY,FEEDBACK,PRIVACY supporting
    class CHALLENGE,ADMIN,WEB3,CHATBOT,I18N generic
```

---

## 2. Bounded Contexts Detailed

### 2.1 CORE DOMAIN

#### Identity Context (Gestión de Identidad)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Autenticación, autorización, gestión de usuarios |
| **Modelos** | `User`, `SecurityQuestion`, `SecurityAnswer` |
| **Rutas** | `/routes/login.ts`, `/routes/currentUser.ts`, `/routes/changePassword.ts`, `/routes/resetPassword.ts`, `/routes/2fa.ts` |
| **Agregados** | User (root), SecurityAnswer (child) |
| **Ubiquitous Language** | User, Login, Token, 2FA, Password Reset, Security Question |

```mermaid
classDiagram
    class User {
        +id: number
        +email: string
        +password: string
        +role: enum
        +totpSecret: string
        +isActive: boolean
        +login()
        +changePassword()
        +enable2FA()
    }
    class SecurityQuestion {
        +id: number
        +question: string
    }
    class SecurityAnswer {
        +id: number
        +answer: string
        +verifyAnswer()
    }
    User "1" --> "*" SecurityAnswer
    SecurityQuestion "1" --> "*" SecurityAnswer
```

#### Shopping Context (Compras)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Catálogo, carrito, órdenes, pagos |
| **Modelos** | `Product`, `Basket`, `BasketItem`, `Card`, `Quantity` |
| **Rutas** | `/routes/basket.ts`, `/routes/basketItems.ts`, `/routes/order.ts`, `/routes/payment.ts`, `/routes/coupon.ts` |
| **Agregados** | Basket (root), Product (root), Order (root) |
| **Ubiquitous Language** | Product, Basket, Order, Payment, Coupon, Checkout |

```mermaid
classDiagram
    class Product {
        +id: number
        +name: string
        +price: decimal
        +description: string
        +image: string
    }
    class Basket {
        +id: number
        +coupon: string
        +addItem()
        +removeItem()
        +applyCoupon()
        +checkout()
    }
    class BasketItem {
        +quantity: number
        +updateQuantity()
    }
    class Card {
        +cardNum: string
        +expMonth: int
        +expYear: int
    }
    Basket "1" --> "*" BasketItem
    BasketItem "*" --> "1" Product
    User "1" --> "*" Basket
    User "1" --> "*" Card
```

---

### 2.2 SUPPORTING DOMAINS

#### Delivery Context (Entregas)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Métodos de envío, direcciones |
| **Modelos** | `Delivery`, `Address` |
| **Rutas** | `/routes/delivery.ts`, `/routes/address.ts` |
| **Agregados** | Address (root), Delivery (root) |
| **Ubiquitous Language** | Delivery Method, Address, Shipping, ETA |

```mermaid
classDiagram
    class Delivery {
        +id: number
        +name: string
        +price: decimal
        +eta: string
    }
    class Address {
        +id: number
        +fullName: string
        +streetAddress: string
        +city: string
        +country: string
        +zipCode: string
    }
    User "1" --> "*" Address
```

#### Feedback Context (Retroalimentación)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Reseñas, quejas, feedback |
| **Modelos** | `Feedback`, `Complaint`, `Review` (MongoDB) |
| **Rutas** | `/routes/feedback.ts`, `/routes/createProductReviews.ts`, `/routes/likeProductReviews.ts` |
| **Agregados** | Feedback (root), Complaint (root), Review (root) |
| **Ubiquitous Language** | Review, Rating, Complaint, Feedback, Like |

```mermaid
classDiagram
    class Feedback {
        +id: number
        +comment: string
        +rating: int
        +submit()
    }
    class Complaint {
        +id: number
        +message: string
        +file()
    }
    class Review {
        +id: string
        +message: string
        +author: string
        +likes: int
        +like()
    }
    User "1" --> "*" Feedback
    User "1" --> "*" Complaint
    Product "1" --> "*" Review
```

#### Privacy Context (Privacidad - GDPR)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Exportación de datos, derecho al olvido |
| **Modelos** | `PrivacyRequest` |
| **Rutas** | `/routes/dataExport.ts`, `/routes/dataErasure.ts` |
| **Agregados** | PrivacyRequest (root) |
| **Ubiquitous Language** | Data Export, Data Erasure, Privacy Request, GDPR |

---

### 2.3 GENERIC SUBDOMAINS

#### Challenge Context (Desafíos de Seguridad)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Gamificación, tracking de vulnerabilidades |
| **Modelos** | `Challenge`, `Hint` |
| **Rutas** | `/routes/continueCode.ts`, `/routes/repeatNotification.ts` |
| **Lib** | `/lib/challengeUtils.ts`, `/lib/codingChallenges.ts` |
| **Datos** | `/data/static/challenges.yml` (126 challenges) |

#### Administration Context (Administración)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Panel de admin, gestión de sistema |
| **Rutas** | `/routes/authenticatedUsers.ts`, `/routes/appVersion.ts`, `/routes/appConfiguration.ts` |
| **Roles** | admin, accounting |

#### Blockchain Context (Web3)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | NFT minting, wallet blockchain |
| **Modelos** | `Wallet` |
| **Rutas** | `/routes/nftMint.ts`, `/routes/web3Wallet.ts` |
| **Libs** | ethers.js, web3.js |

#### Chatbot Context (Atención al Cliente)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Servicio automatizado de atención |
| **Rutas** | `/routes/chatbot.ts` |
| **Datos** | `/data/chatbot/` |
| **Lib** | juicy-chat-bot |

#### Localization Context (Internacionalización)
| Aspecto | Detalle |
|---------|---------|
| **Responsabilidad** | Traducciones, soporte multi-idioma |
| **Rutas** | `/routes/languages.ts`, `/routes/countryMapping.ts` |
| **Datos** | `/i18n/` (44 idiomas) |

---

## 3. Context Relationships

```mermaid
flowchart LR
    subgraph Relationships["CONTEXT RELATIONSHIPS"]
        direction TB

        SK["Shared Kernel<br/>Identity ↔ Shopping<br/>━━━━━━━━━━━━━━<br/>User entity shared"]

        CS1["Customer/Supplier<br/>Shopping → Delivery<br/>━━━━━━━━━━━━━━<br/>Orders need shipping"]

        CS2["Customer/Supplier<br/>Identity → Privacy<br/>━━━━━━━━━━━━━━<br/>User data operations"]

        ACL1["Anti-Corruption Layer<br/>Shopping → Web3<br/>━━━━━━━━━━━━━━<br/>Blockchain isolation"]

        ACL2["Anti-Corruption Layer<br/>Identity → Chatbot<br/>━━━━━━━━━━━━━━<br/>Bot authentication"]

        PL["Published Language<br/>Shopping → Feedback<br/>━━━━━━━━━━━━━━<br/>Product/Order refs"]

        OHS["Open Host Service<br/>Localization → All<br/>━━━━━━━━━━━━━━<br/>i18n API"]

        CONF["Conformist<br/>Identity → Admin<br/>━━━━━━━━━━━━━━<br/>Admin follows user model"]
    end
```

---

## 4. Aggregate Boundaries

| Bounded Context | Aggregate Root | Entities | Value Objects |
|-----------------|----------------|----------|---------------|
| Identity | User | SecurityAnswer | Email, Password, Role |
| Shopping | Basket | BasketItem | Coupon, Price |
| Shopping | Product | Quantity | ProductImage, Description |
| Shopping | Order | OrderLine | OrderId, PaymentDetails |
| Delivery | Address | - | ZipCode, Country |
| Delivery | Delivery | - | ETA, ShippingCost |
| Feedback | Review | - | Rating, Comment |
| Feedback | Complaint | - | ComplaintType |
| Privacy | PrivacyRequest | - | RequestType, RequestDate |
| Challenge | Challenge | Hint | Difficulty, Category |
| Blockchain | Wallet | - | WalletAddress, Balance |

---

## 5. Domain Events (Implicit)

```mermaid
sequenceDiagram
    participant User
    participant Identity
    participant Shopping
    participant Delivery
    participant Feedback
    participant Challenge

    User->>Identity: Register
    Identity-->>Shopping: UserCreated Event
    Shopping->>Shopping: Create Basket

    User->>Shopping: Add to Cart
    User->>Shopping: Checkout
    Shopping-->>Delivery: OrderPlaced Event
    Delivery->>Delivery: Select Shipping

    Shopping-->>Challenge: PurchaseCompleted Event
    Challenge->>Challenge: Check Challenges

    User->>Feedback: Submit Review
    Feedback-->>Challenge: ReviewPosted Event
```

---

## 6. Technical Architecture Alignment

```mermaid
flowchart TB
    subgraph Presentation["PRESENTATION LAYER"]
        Angular["Angular 20 SPA<br/>/frontend"]
    end

    subgraph API["API LAYER"]
        Express["Express.js<br/>/routes (62 files)"]
    end

    subgraph Domain["DOMAIN LAYER"]
        Lib["Business Logic<br/>/lib (12 files)"]
    end

    subgraph Infrastructure["INFRASTRUCTURE LAYER"]
        Models["Sequelize Models<br/>/models (22 files)"]
        SQLite["SQLite DB"]
        MongoDB["MarsDB (In-Memory)"]
    end

    Angular --> Express
    Express --> Lib
    Lib --> Models
    Models --> SQLite
    Models --> MongoDB
```

---

## 7. Mapping to Files

| Bounded Context | Key Files |
|-----------------|-----------|
| **Identity** | `models/user.ts`, `routes/login.ts`, `routes/2fa.ts`, `lib/insecurity.ts` |
| **Shopping** | `models/basket.ts`, `models/product.ts`, `routes/basket.ts`, `routes/order.ts` |
| **Delivery** | `models/delivery.ts`, `models/address.ts`, `routes/delivery.ts`, `routes/address.ts` |
| **Feedback** | `models/feedback.ts`, `models/complaint.ts`, `routes/createProductReviews.ts` |
| **Privacy** | `models/privacyRequests.ts`, `routes/dataExport.ts`, `routes/dataErasure.ts` |
| **Challenge** | `models/challenge.ts`, `lib/challengeUtils.ts`, `data/static/challenges.yml` |
| **Admin** | `routes/appConfiguration.ts`, `routes/authenticatedUsers.ts` |
| **Blockchain** | `models/wallet.ts`, `routes/nftMint.ts`, `routes/web3Wallet.ts` |
| **Chatbot** | `routes/chatbot.ts`, `data/chatbot/` |
| **Localization** | `routes/languages.ts`, `i18n/`, `frontend/src/assets/i18n/` |

---

## 8. Conclusión

El Context Map revela que OWASP Juice Shop tiene una arquitectura de dominio bien definida con:

- **2 Core Domains:** Identity y Shopping (el negocio principal)
- **3 Supporting Domains:** Delivery, Feedback, Privacy (soporte al core)
- **5 Generic Subdomains:** Challenge, Admin, Blockchain, Chatbot, Localization

La relación más crítica es el **Shared Kernel** entre Identity y Shopping, donde el modelo `User` es compartido y debe mantenerse consistente entre ambos contextos.
