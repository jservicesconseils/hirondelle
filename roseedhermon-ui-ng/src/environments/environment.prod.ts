/**
 * Configuration des builds de production, y compris les paquets iOS et Android.
 *
 * L'API publique de ce projet passe par la passerelle ECS, derrière l'Application
 * Load Balancer : https://api.hirondelle.app
 *
 * Cette URL est utilisée pour les appels métier (membres, groupes, événements) et
 * pour les flux de données qui passent par le gateway.
 */
export const environment = {
  production: true,

  host: 'https://api.hirondelle.app',
  memberHost: 'https://api.hirondelle.app',

  /**
   * Amazon Cognito. `domain` reste vide : la connexion Google (Hosted UI) n'est
   * pas encore activée, seul le formulaire courriel/mot de passe fonctionne.
   */
  cognito: {
    userPoolId: 'us-east-1_atbIxF284',
    clientId: '5vo28853100fa873hve1untd02',
    region: 'us-east-1',
    domain: '',
    redirectUri: ''
  }
};
