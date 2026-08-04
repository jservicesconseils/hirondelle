# Architecture du projet Hirondelle

**Date :** Février 2026

---

## 1. Vue d'ensemble

Le projet **Hirondelle** est une application **monorepo** comprenant :

- **1 frontend** Angular (web + mobile)
- **2 microservices** Spring Boot
- **MongoDB** comme base de données

---

## 2. Structure globale du projet

```
hirondelle/
├── roseedhermon-ui-ng/          # Frontend Angular (Ionic, Capacitor)
├── roseedhermon-ms-event/       # Microservice Événements (Spring Boot)
├── roseedhermon-ms-member/      # Microservice Membres (Spring Boot)
├── roseedhermon-services-node/  # Portage Node.js des deux microservices + passerelle
└── start-mongodb.sh             # Script de démarrage MongoDB
```

---

## 3. Frontend — roseedhermon-ui-ng

### 3.1 Technologies

- **Angular** 19
- **Ionic** 8
- **PrimeNG** 19
- **Tailwind CSS**
- **Capacitor** (iOS / Android)

### 3.2 Structure des dossiers

```
src/
├── app/
│   ├── api/                     # Clients générés (OpenAPI)
│   ├── core/                    # Configuration, guards, interceptors
│   ├── layout/                  # Layout principal (AppLayout)
│   ├── shared/                  # Services, modèles, composants partagés
│   │   ├── services/            # members, events
│   │   └── api/                 # Modèles et API générés
│   ├── pages/                   # Landing, auth, notfound
│   ├── web/                     # Interface web (desktop/admin)
│   │   └── pages/
│   │       ├── members/         # CRUD membres
│   │       └── events/          # CRUD événements
│   ├── mobile/                  # Interface mobile (Ionic)
│   │   ├── components/          # mobile-tabs, mobile-footer
│   │   └── pages/
│   │       ├── dashboard/
│   │       ├── events/
│   │       ├── members/
│   │       ├── profile/
│   │       └── ticket/
│   └── app/                     # Dashboard
├── assets/
├── environments/
└── index.html
```

### 3.3 Routes principales

| Chemin       | Description                    |
|--------------|--------------------------------|
| `/`          | Redirection (mobile / web)     |
| `/mobile/*`  | Application mobile             |
| `/app/*`     | Administration                 |
| `/web/*`     | Site public événements         |

---

## 4. Backend — roseedhermon-ms-event

### 4.1 Technologies

- Spring Boot 3
- Spring Data MongoDB

### 4.2 Architecture

```
controller/
├── EventController
├── EventFileController
├── EventRegistrationController
├── EventFeedbackController
├── FileController
└── AdminController

service/
├── EventService
├── EventFileService
├── EventRegistrationService
├── EventFeedbackService
└── FileStorageService

entity/, repository/, dto/
```

### 4.3 Ports

- **Par défaut :** 8081
- **Profil local :** 8081

---

## 5. Backend — roseedhermon-ms-member

### 5.1 Technologies

- Spring Boot 2.6
- Spring Data MongoDB

### 5.2 Architecture

```
controller/
├── MemberController     # /api/v1/members
└── GroupController      # /api/v1/groups

service/
├── MemberService
└── GroupService

model/, repository/, dto/
```

### 5.3 Ports

- **Par défaut :** 8082
- **Profil local :** 8080

---

## 6. Schéma des communications

```
┌─────────────────────────────────────────────────────────┐
│              roseedhermon-ui-ng (Angular)               │
│                   Port 4200                             │
└───────────────┬─────────────────────┬───────────────────┘
                │                     │
                ▼                     ▼
┌───────────────────────┐   ┌───────────────────────────┐
│  roseedhermon-ms-event│   │  roseedhermon-ms-member   │
│  localhost:8081       │   │  localhost:8080 (local)   │
│  /api/v1/events       │   │  /api/v1/members          │
│  /api/v1/files        │   │  /api/v1/groups           │
└───────────┬───────────┘   └─────────────┬─────────────┘
            │                             │
            └──────────┬──────────────────┘
                       ▼
              ┌─────────────────┐
              │    MongoDB      │
              │ localhost:27017 │
              │    db_rdh       │
              └─────────────────┘
```

---

## 7. Commandes de démarrage

**MongoDB :**
```bash
./start-mongodb.sh
# ou
mongod
```

**ms-event :**
```bash
cd roseedhermon-ms-event
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

**ms-member :**
```bash
cd roseedhermon-ms-member
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

**Frontend :**
```bash
cd roseedhermon-ui-ng
npm start
```

---

## 8. Portage Node.js — roseedhermon-services-node

Alternative aux deux services Spring, utilisable à leur place sans modifier le
frontend ni migrer la base. Les projets Java restent en place.

### 8.1 Technologies

- Node.js 20, TypeScript, Express 4
- Mongoose 8 (à la place de Spring Data MongoDB)
- multer (uploads) + sharp (vignettes), http-proxy-middleware (passerelle)

### 8.2 Architecture

```
src/
├── common/      env, bootstrap, Mongo, helpers Jackson & Spring Data
├── ms-event/    models / mappers / services / routes
├── ms-member/   models / mappers / services / routes
└── gateway/     proxy HTTP
```

Le découpage reprend celui du code Java : `models` ≙ entités `@Document`,
`mappers` ≙ DTO, `services` ≙ `@Service`, `routes` ≙ `@RestController`.

### 8.3 Ports

- **ms-event :** 8081 (comme le service Spring)
- **ms-member :** 8082
- **gateway :** 8080 — `/api/v1/members` et `/api/v1/groups` vers 8082, tout le reste
  vers 8081. Nécessaire car le front utilise deux bases d'URL différentes (8080 pour
  les membres, 8081 pour les événements) ; la passerelle les rend interchangeables.

### 8.4 Compatibilité

Les routes, ports, noms de propriétés JSON, codes de statut (corps vides inclus) et la
forme des documents MongoDB (`_class`, absence des clés nulles, `ObjectId` vs UUID)
sont identiques à ce que produisaient Jackson, Lombok et Spring Data. Les détails et
les deux écarts assumés sont documentés dans
`roseedhermon-services-node/README.md`.

### 8.5 Démarrage

```bash
cd roseedhermon-services-node
npm install
npm run dev        # ms-event + ms-member + gateway
```

---

*Document généré pour le projet Hirondelle — Rose d'Hermon*
