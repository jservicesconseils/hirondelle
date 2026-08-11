/**
 * `amazon-cognito-identity-js` et ses dépendances (`buffer`, `isomorphic-unfetch`)
 * sont écrites pour Node : elles référencent l'objet `global`, qui n'existe pas
 * dans un navigateur. On l'aliase sur `globalThis` avant tout autre chargement,
 * sans quoi le premier `require` échoue et l'application ne démarre pas.
 */
(globalThis as unknown as { global: typeof globalThis }).global = globalThis;
