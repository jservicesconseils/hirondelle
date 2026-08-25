import {
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { env } from './env';

/**
 * Actions Cognito qui exigent des droits d'administration — promouvoir un
 * compte, lui rattacher un groupe — plutôt que celles qu'un utilisateur fait
 * sur lui-même (`amazon-cognito-identity-js`, côté client).
 *
 * Sans `COGNITO_USER_POOL_ID`, ces fonctions ne font rien : c'est le même cas
 * que `authEnabled` dans `security.ts`, le poste de développement où Cognito
 * n'est pas configuré.
 */

const USER_POOL_ID = env('COGNITO_USER_POOL_ID', '');
const REGION = env('AWS_REGION', 'us-east-1');

let client: CognitoIdentityProviderClient | null = null;

function getClient(): CognitoIdentityProviderClient {
  if (!client) client = new CognitoIdentityProviderClient({ region: REGION });
  return client;
}

/** Ajoute le compte au groupe Cognito `GROUP_ADMIN` — un rôle, pas une communauté. */
export async function promoteToGroupAdmin(email: string): Promise<void> {
  if (!USER_POOL_ID) return;

  await getClient().send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      GroupName: 'GROUP_ADMIN',
    }),
  );
}

/** Rattache le compte à sa communauté : c'est cet attribut que le jeton porte ensuite. */
export async function setAccountGroupId(email: string, groupId: string): Promise<void> {
  if (!USER_POOL_ID) return;

  await getClient().send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [{ Name: 'custom:groupId', Value: groupId }],
    }),
  );
}
