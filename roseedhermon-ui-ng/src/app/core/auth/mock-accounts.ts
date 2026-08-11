import { Role, ROLES } from './auth.model';

/**
 * Comptes de démonstration, utilisables **uniquement** quand Amazon Cognito n'est
 * pas configuré.
 *
 * Ils n'existent nulle part en base : la connexion simulée se contente de choisir
 * le rôle et le groupe que le serveur appliquera, via les en-têtes `X-Dev-*` que
 * celui-ci n'écoute que dans ce même cas. Dès que `environment.cognito` est
 * renseigné, ce fichier n'est plus jamais lu et le formulaire devient un vrai
 * formulaire Cognito.
 */
export interface MockAccount {
  email: string;
  password: string;
  role: Role;
  label: string;
  description: string;
  /** Vrai pour les rôles qui n'ont de sens que rattachés à un groupe. */
  needsGroup: boolean;
  icon: string;
  color: string;
}

/** Mot de passe commun aux trois comptes : ils ne protègent rien. */
export const MOCK_PASSWORD = 'demo';

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: 'super@hirondelle.test',
    password: MOCK_PASSWORD,
    role: ROLES.SUPER_ADMIN,
    label: 'Super administrateur',
    description: "Tous les groupes, tous les membres, tous les événements.",
    needsGroup: false,
    icon: 'pi-shield',
    color: '#6d40e8'
  },
  {
    email: 'admin@hirondelle.test',
    password: MOCK_PASSWORD,
    role: ROLES.GROUP_ADMIN,
    label: 'Administrateur de groupe',
    description: 'Son seul groupe : ses membres, ses événements.',
    needsGroup: true,
    icon: 'pi-users',
    color: '#e8490f'
  },
  {
    email: 'membre@hirondelle.test',
    password: MOCK_PASSWORD,
    role: ROLES.MEMBER,
    label: 'Membre',
    description: 'Les membres de son groupe et les événements publics.',
    needsGroup: true,
    icon: 'pi-user',
    color: '#0d8f63'
  }
];

export function findMockAccount(email: string, password: string): MockAccount | null {
  const needle = email.trim().toLowerCase();
  return (
    MOCK_ACCOUNTS.find((account) => account.email === needle && account.password === password.trim()) ?? null
  );
}

export function mockAccountFor(email: string): MockAccount | null {
  const needle = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find((account) => account.email === needle) ?? null;
}
