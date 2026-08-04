# Architecture du Projet

## 📁 Structure des dossiers

```
src/app/
├── web/                    # Composants web (Angular + PrimeNG)
│   ├── pages/
│   │   ├── events/         # Pages événements web
│   │   ├── members/        # Pages membres web
│   │   └── visitor-events/ # Page visiteur événements
│   └── components/         # Composants web spécifiques
├── mobile/                 # Composants mobiles (Ionic + Angular)
│   ├── pages/
│   │   ├── events/         # Pages événements mobiles
│   │   ├── members/        # Pages membres mobiles
│   │   └── profile/        # Page profil mobile
│   ├── components/         # Composants mobiles spécifiques
│   └── services/           # Services mobiles spécifiques
├── shared/                 # Code partagé entre web et mobile
│   ├── services/
│   │   ├── events/         # Service événements
│   │   ├── members/        # Service membres
│   │   └── api/            # Services API
│   ├── models/             # Modèles de données
│   └── utils/              # Utilitaires partagés
└── core/                   # Configuration commune
    ├── guards/             # Guards d'authentification
    ├── interceptors/       # Intercepteurs HTTP
    └── config/             # Configuration
```

## 🎯 Principe de séparation

- **Web** : Interface utilisateur pour navigateurs (PrimeNG)
- **Mobile** : Interface utilisateur pour mobiles (Ionic)
- **Shared** : Logique métier commune (services, modèles)
- **Core** : Configuration et sécurité commune

## 🔄 Réutilisation du code

- Services partagés : 100% réutilisés
- Modèles : 100% réutilisés
- Logique métier : 100% réutilisée
- UI : Adaptée par plateforme