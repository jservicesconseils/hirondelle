/**
 * Connexion par un fournisseur externe (Google) via l'interface hébergée de Cognito.
 *
 * Le navigateur ne peut pas garder un secret : on utilise donc le flot
 * « authorization code + PKCE », le seul recommandé pour un client public. Le
 * déroulé tient en trois temps :
 *
 *   1. `authorizeUrl()` fabrique un secret éphémère (`code_verifier`), n'en envoie
 *      que l'empreinte (`code_challenge`) et redirige vers Google ;
 *   2. Cognito renvoie le navigateur sur `redirectUri` avec un code à usage unique ;
 *   3. `exchangeCode()` échange ce code contre les jetons, en présentant le secret
 *      d'origine — preuve que c'est bien la même page qui avait lancé la demande.
 *
 * Tout ceci reste inerte tant que `domain` n'est pas renseigné : aucune requête
 * n'est faite et le bouton se contente de l'annoncer.
 */

/** Ce qu'il faut connaître du pool pour parler à l'interface hébergée. */
export interface HostedUiConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
}

/** Jetons rendus par `/oauth2/token`. */
export interface HostedUiTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const VERIFIER_KEY = 'rdh.oauth.verifier';
const RETURN_KEY = 'rdh.oauth.return';
const STATE_KEY = 'rdh.oauth.state';

/**
 * Assemble la configuration, ou rend `null` si l'interface hébergée n'est pas
 * utilisable. `redirectUri` vide retombe sur l'origine courante, ce qui suffit en
 * développement.
 */
export function hostedUiConfig(
  cognito: { clientId?: string; domain?: string; redirectUri?: string } | undefined,
  origin: string
): HostedUiConfig | null {
  const domain = (cognito?.domain ?? '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const clientId = cognito?.clientId ?? '';
  if (!domain || !clientId) return null;

  return { domain, clientId, redirectUri: cognito?.redirectUri || `${origin}/auth/callback` };
}

/**
 * Adresse vers laquelle envoyer le navigateur. `afterLogin` est la page à rouvrir
 * une fois la connexion faite ; elle est conservée ici, hors de l'URL, pour qu'on
 * ne puisse pas la manipuler depuis l'extérieur.
 */
export async function authorizeUrl(
  config: HostedUiConfig,
  provider: string,
  afterLogin: string
): Promise<string> {
  const verifier = randomString(64);
  const state = randomString(24);

  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(RETURN_KEY, afterLogin);

  const parameters = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    identity_provider: provider,
    scope: 'openid email profile',
    state,
    code_challenge: await challengeOf(verifier),
    code_challenge_method: 'S256'
  });

  return `https://${config.domain}/oauth2/authorize?${parameters}`;
}

/** Page à rouvrir après la connexion, telle qu'elle avait été mise de côté. */
export function returnUrl(): string {
  return sessionStorage.getItem(RETURN_KEY) ?? '';
}

/** Vrai si l'état rendu par Cognito est bien celui que nous avions émis. */
export function stateMatches(state: string | null): boolean {
  const expected = sessionStorage.getItem(STATE_KEY);
  return !!expected && expected === state;
}

/**
 * Échange le code contre les jetons. Le point d'accès `/oauth2/token` attend un
 * formulaire, pas du JSON ; et le code ne vaut qu'une fois, d'où le nettoyage
 * systématique qui suit.
 */
export async function exchangeCode(config: HostedUiConfig, code: string): Promise<HostedUiTokens> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("La demande de connexion a expiré. Recommencez depuis la page de connexion.");

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: verifier
  });

  try {
    const response = await fetch(`https://${config.domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const payload = (await response.json()) as Record<string, string | number>;
    if (!response.ok) {
      throw new Error(String(payload['error_description'] ?? payload['error'] ?? 'La connexion a été refusée.'));
    }

    return {
      idToken: String(payload['id_token'] ?? ''),
      accessToken: String(payload['access_token'] ?? ''),
      refreshToken: String(payload['refresh_token'] ?? ''),
      expiresIn: Number(payload['expires_in'] ?? 0)
    };
  } finally {
    forget();
  }
}

/** Efface les trois valeurs de travail : elles ne servent qu'à un aller-retour. */
export function forget(): void {
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(RETURN_KEY);
}

// --- PKCE ------------------------------------------------------------------------------

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes).slice(0, length);
}

async function challengeOf(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** Base64 « URL-safe », sans remplissage : la forme imposée par la spécification. */
function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
