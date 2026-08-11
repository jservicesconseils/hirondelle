export const environment = {
  production: false,
  host: "http://localhost:8080",
  /** API ms-member - port 8080 avec profil local, 8082 avec profil par défaut */
  memberHost: "http://localhost:8080",

  /**
   * Amazon Cognito. Laisser vide en développement : l'application et les services
   * fonctionnent alors sans authentification, avec les droits de super administrateur.
   */
  cognito: {
    userPoolId: '',
    clientId: '',
    region: 'ca-central-1'
  }
};
