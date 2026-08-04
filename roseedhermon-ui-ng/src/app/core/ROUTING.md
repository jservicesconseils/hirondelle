# Configuration du Routing Mobile

## 🛣️ Routes configurées

### **Routes principales :**
- `/` → **PlatformRedirectComponent** (détection automatique)
- `/web` → **VisitorEventsComponent** (interface web)
- `/mobile` → **MobileTabsComponent** (interface mobile)

### **Routes mobiles :**
- `/mobile` → Redirige vers `/mobile/events`
- `/mobile/events` → **MobileEventsComponent**
- `/mobile/members` → **MobileMembersComponent**
- `/mobile/profile` → **MobileProfileComponent**

### **Routes web :**
- `/web` → **VisitorEventsComponent**
- `/app/dashboard` → **Dashboard**
- `/app/members` → **ListMemberComponent**
- `/app/events` → **ListEventsComponent**

## 🔄 Détection de plateforme

### **PlatformService :**
- `isMobile()` : Détecte si c'est un appareil mobile
- `isWeb()` : Détecte si c'est un navigateur web
- `getDefaultRoute()` : Retourne la route par défaut selon la plateforme

### **PlatformRedirectComponent :**
- Affiche un spinner de chargement
- Détecte automatiquement la plateforme
- Redirige vers `/mobile` ou `/web` selon l'appareil

## 📱 Navigation mobile

### **MobileTabsComponent :**
- Navigation par onglets en bas
- Onglets : Événements, Membres, Profil
- Utilise `ion-router-outlet` pour le routing

### **Fonctionnalités :**
- ✅ **Détection automatique** de plateforme
- ✅ **Navigation par onglets** mobile
- ✅ **Routing séparé** web/mobile
- ✅ **Redirection intelligente**

## 🎯 URLs d'accès

- **Web** : `http://localhost:4200/web`
- **Mobile** : `http://localhost:4200/mobile`
- **Auto** : `http://localhost:4200` (détection automatique)