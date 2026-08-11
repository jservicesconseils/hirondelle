/**
 * Configuration des builds de production, y compris les paquets iOS et Android.
 *
 * ATTENTION — `host` doit être l'URL publique et absolue de la passerelle.
 * Dans une application Capacitor, la page est servie depuis `capacitor://localhost`
 * (iOS) ou `https://localhost` (Android) : une URL vide ou relative interrogerait
 * l'application elle-même, jamais votre serveur. L'adresse doit en outre être en
 * HTTPS, sinon Android bloque l'appel (trafic en clair interdit par défaut) et iOS
 * le refuse au titre d'App Transport Security.
 */
export const environment = {
  production: true,

  // À REMPLACER par l'URL publique de la passerelle avant tout déploiement.
  host: 'https://api.a-configurer.example',

  // Le service membre passe par la même passerelle.
  memberHost: 'https://api.a-configurer.example',

  /**
   * Amazon Cognito. Les trois valeurs viennent du pool créé sur AWS ; le client
   * doit être un client « public » (sans secret), seul type utilisable depuis un
   * navigateur ou une application mobile.
   */
  cognito: {
    userPoolId: 'ca-central-1_A_CONFIGURER',
    clientId: 'A_CONFIGURER',
    region: 'ca-central-1',

    /**
     * Domaine de l'interface hébergée, sans schéma ni barre finale. Il est requis
     * pour la connexion par Google, et seulement pour elle : le formulaire par
     * courriel fonctionne sans lui.
     */
    domain: '',

    /**
     * Adresse de retour après Google, à déclarer à l'identique dans les
     * « Allowed callback URLs » du client Cognito. Vide = `<origine>/auth/callback`.
     */
    redirectUri: ''
  }
};
