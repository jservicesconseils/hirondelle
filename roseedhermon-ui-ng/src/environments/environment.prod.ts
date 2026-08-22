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
   * Amazon Cognito. Laisser vide pour le moment tant que le pool n'est pas
   * configuré dans AWS. En production, il faut remplir ces valeurs avec le bon
   * client Cognito public.
   */
  cognito: {
    userPoolId: '',
    clientId: '',
    region: 'ca-central-1',
    domain: '',
    redirectUri: ''
  }
};
