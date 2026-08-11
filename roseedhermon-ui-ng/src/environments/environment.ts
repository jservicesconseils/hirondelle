export const environment = {
  production: false,
  host: "http://localhost:8080",
  /**
   * L'annuaire passe par la passerelle, comme le reste : viser ms-member en
   * direct court-circuite l'intercepteur d'identité, et le service répond 401.
   */
  memberHost: "http://localhost:8080",

  /**
   * Amazon Cognito. Laisser vide en développement : l'application et les services
   * fonctionnent alors sans authentification, avec les droits de super administrateur.
   */
  cognito: {
    userPoolId: '',
    clientId: '',
    region: 'ca-central-1',

    /**
     * Domaine de l'interface hébergée, sans schéma ni barre finale — par exemple
     * `hirondelle.auth.ca-central-1.amazoncognito.com`. Il porte la connexion par
     * Google : tant qu'il est vide, le bouton l'annonce au lieu d'échouer.
     */
    domain: '',

    /**
     * Adresse de retour après Google. Vide = `<origine>/auth/callback`, ce qui
     * convient en développement. Elle doit être déclarée à l'identique dans les
     * « Allowed callback URLs » du client Cognito.
     */
    redirectUri: ''
  }
};
