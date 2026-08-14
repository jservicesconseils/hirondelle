/**
 * Configuration des builds de production, y compris les paquets iOS et Android.
 *
 * L'API publique de ce projet passe par la passerelle ECS :
 * http://44.212.11.174:8080
 *
 * Cette URL est utilisée pour les appels métier (membres, groupes, événements) et
 * pour les flux de données qui passent par le gateway.
 */
export const environment = {
  production: true,

  host: 'http://44.212.11.174:8080',
  memberHost: 'http://44.212.11.174:8080',

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
