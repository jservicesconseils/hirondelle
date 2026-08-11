# Déploiement sur AWS

Ce document décrit le modèle de rôles, ce qu'il faut créer sur AWS, et comment
configurer l'application. Tout ce qui suit correspond au code présent dans le dépôt.

## 1. Modèle de rôles

| Rôle | Ce qu'il voit et fait |
|---|---|
| `SUPER_ADMIN` | Tous les groupes, tous les membres, tous les événements. Crée et supprime les groupes. |
| `GROUP_ADMIN` | Son seul groupe : crée et importe ses membres, crée ses événements publics ou privés. |
| `MEMBER` | Les membres de son groupe, les événements de son groupe et les événements publics. |

Le rôle vient des **groupes Cognito** portant exactement ces trois noms. Le groupe
d'appartenance vient de l'attribut personnalisé **`custom:groupId`** du compte, dont
la valeur est l'identifiant du document `groups` en base.

Le serveur ne fait jamais confiance au client : le filtrage est appliqué dans les
routes Express, à partir du jeton vérifié cryptographiquement.

## 2. Ce qu'il faut créer sur AWS

### 2.1 Cognito

1. **Un User Pool**, connexion par courriel.
2. **Un attribut personnalisé** `groupId`, de type chaîne, mutable.
3. **Trois groupes** : `SUPER_ADMIN`, `GROUP_ADMIN`, `MEMBER`.
4. **Un client applicatif public** — sans secret : c'est le seul type utilisable
   depuis un navigateur ou une application mobile. Activer le flux
   `ALLOW_USER_PASSWORD_AUTH`.

Créer un compte revient à : créer l'utilisateur avec son courriel, lui poser
`custom:groupId`, puis l'ajouter au groupe correspondant à son rôle. Cognito envoie
un mot de passe provisoire ; l'application demande son remplacement à la première
connexion (`NEW_PASSWORD_REQUIRED`, géré par les deux écrans de connexion).

### 2.2 SNS pour les textos

Le texto d'invitation part par Amazon SNS lors de la création d'un membre.
Sur un compte neuf, SNS est en **bac à sable** : seuls des numéros vérifiés
reçoivent les messages. Il faut demander la sortie du bac à sable pour joindre
n'importe quel numéro, et — pour le Canada et les États-Unis — enregistrer un
numéro d'origine (10DLC ou numéro gratuit).

Le rôle IAM du service doit porter `sns:Publish`.

### 2.3 Base de données

MongoDB reste la base. Deux options : **Amazon DocumentDB** (compatible MongoDB,
dans votre VPC) ou **MongoDB Atlas**. Renseigner l'URI dans `MONGODB_URI`.

### 2.4 Hébergement

- **Services Node** : conteneurs sur ECS Fargate ou App Runner, derrière un
  Application Load Balancer en HTTPS. Seule la passerelle est exposée.
- **Front web** : fichiers statiques de `dist/sakai-ng/browser` sur S3, distribués
  par CloudFront. Rediriger les 404 vers `/index.html` — l'application est en
  routage client.

## 3. Option la plus économique pour un budget quasi nul

Si l'objectif est de limiter les coûts au maximum, la combinaison la plus réaliste est :

- **Frontend** : AWS Amplify Hosting ou S3 + CloudFront
- **Backend** : AWS App Runner avec le conteneur défini dans
  `roseedhermon-services-node/Dockerfile`
- **Base de données** : MongoDB Atlas (plan gratuit M0) pour le stockage
- **Authentification** : Amazon Cognito, gratuit en usage raisonnable

Cette architecture permet généralement de rester dans la catégorie **très faible coût**
ou **gratuit** pour une petite application, à condition de rester sous les limites du
plan gratuit et d'éviter les charges réseau/CPU trop élevées.

### 3.1 Déployer le backend sur App Runner

1. Créer un dépôt ECR : `aws ecr create-repository --repository-name hirondelle-backend`
2. Se connecter à ECR : `aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.ca-central-1.amazonaws.com`
3. Construire l'image :
   ```bash
   cd roseedhermon-services-node
   docker build -t hirondelle-backend .
   docker tag hirondelle-backend:latest <account_id>.dkr.ecr.ca-central-1.amazonaws.com/hirondelle-backend:latest
   docker push <account_id>.dkr.ecr.ca-central-1.amazonaws.com/hirondelle-backend:latest
   ```
4. Dans AWS App Runner, créer un service à partir de cette image et fournir les variables
   d'environnement suivantes : `MONGODB_URI`, `COGNITO_USER_POOL_ID`,
   `COGNITO_CLIENT_ID`, `AWS_REGION`, `SNS_SENDER_ID`, `SMS_ENABLED`, `GATEWAY_PORT`,
   `MS_MEMBER_PORT`, `MS_EVENT_PORT`.
5. App Runner génère une URL publique. Renseigner cette URL dans la configuration du
   frontend comme `host` et `memberHost`.

### 3.2 Déployer le frontend sur Amplify ou S3/CloudFront

Pour le frontend Angular :

```bash
cd roseedhermon-ui-ng
npm run build
```

Puis publier le contenu de `dist/sakai-ng/browser` sur :

- **AWS Amplify Hosting** (le plus simple), ou
- **S3 + CloudFront** (plus manuel, mais souvent plus économique)

Dans `src/environments/environment.prod.ts`, remplacer `host` et `memberHost` par
l'URL publique du backend App Runner, avec HTTPS.

### 3.3 Budget réaliste

- **MongoDB Atlas M0** : souvent gratuit au démarrage
- **Cognito** : gratuit jusqu'à un certain volume
- **App Runner** : très faible coût si le service reste peu sollicité
- **Amplify/S3/CloudFront** : généralement gratuit ou très faible coût pour un petit trafic

> Si vous cherchez un modèle vraiment à **0$/mois**, il faut rester strictement sous
> les limites de gratuité et éviter les charges CPU/MongoDB constantes. Pour une
> première version, l'objectif réaliste est **très faible coût**, parfois proche de **0$**.

## 4. Variables d'environnement des services Node

```
# Authentification : sans ces deux valeurs, la vérification est désactivée
# et toute requête obtient les droits de super administrateur.
COGNITO_USER_POOL_ID=ca-central-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_TOKEN_USE=id

# Texto d'invitation
AWS_REGION=ca-central-1
MOBILE_APP_LINK=https://app.votre-domaine.com
SNS_SENDER_ID=
SMS_ENABLED=true

# Base
MONGODB_URI=mongodb://...

# Ports
GATEWAY_PORT=8080
MS_MEMBER_PORT=8082
MS_EVENT_PORT=8081
```

**Le point le plus important** : tant que `COGNITO_USER_POOL_ID` et
`COGNITO_CLIENT_ID` sont vides, l'API est **ouverte**. C'est voulu pour le
développement local, mais cela signifie qu'un déploiement sans ces variables
serait sans protection.

## 4. Configuration du front

`src/environments/environment.prod.ts` :

```ts
host: 'https://api.votre-domaine.com',
cognito: {
  userPoolId: 'ca-central-1_XXXXXXXXX',
  clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  region: 'ca-central-1'
}
```

L'URL doit être **absolue et en HTTPS** : dans l'application mobile, la page est
servie depuis `capacitor://localhost`, et une adresse en clair serait bloquée par
Android comme par iOS.

## 5. Parcours couverts par le code

**L'administrateur de groupe** se connecte, arrive sur `/app/dashboard`, crée ou
importe ses membres depuis `/app/members`. Chaque création rattache le membre à son
groupe et déclenche le texto d'invitation. Il crée ses événements depuis
`/app/events`, en choisissant à l'étape « Visibilité » entre *Public* et *Réservé au
groupe*.

**Le membre** reçoit le texto, installe l'application, se connecte avec son courriel
et son mot de passe provisoire, en choisit un nouveau, puis voit les membres de son
groupe et les événements — ceux de son groupe et les publics.

**Le super administrateur** dispose en plus de `/app/groups` : effectifs par groupe,
fiches sans groupe, création d'un groupe, et l'annuaire de chaque groupe dans un
tiroir latéral.

## 6. Points d'entrée ajoutés

| Méthode | Chemin | Qui |
|---|---|---|
| `GET` | `/api/v1/me` | Toute session — renvoie identité, rôles, groupe et fiche membre |
| `GET` | `/api/v1/groups/overview` | `SUPER_ADMIN` — effectifs par groupe |
| `GET` | `/api/v1/groups/:id/members` | Le groupe concerné ou `SUPER_ADMIN` |

Les routes existantes ont été bornées : les listes de membres et d'événements sont
filtrées par groupe, la création et la modification exigent un rôle d'administration,
et un événement privé d'un autre groupe répond `404` plutôt que `403` — on ne révèle
pas son existence.

## 7. Compatibilité avec les services Java

Les champs ajoutés (`visibility` et `groupId` sur les événements) sont **additifs**.
Spring Data ignore les propriétés inconnues à la lecture : les services Java
d'origine peuvent être redémarrés sur la même base sans migration. Les documents
créés avant l'introduction des groupes n'ont pas de champ `visibility` et sont
traités comme publics.
