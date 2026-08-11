import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { env } from '../../common';
import { GroupModel } from '../models/group.model';
import { springIdFilter } from '../../common';

/**
 * Texto d'invitation envoyé à la création d'un membre.
 *
 * Le message annonce le groupe qui vient de l'inscrire et donne le lien de
 * l'application mobile. L'envoi passe par Amazon SNS ; sans configuration AWS, le
 * message est seulement journalisé pour que le développement reste possible.
 */

const REGION = env('AWS_REGION', 'ca-central-1');
const APP_LINK = env('MOBILE_APP_LINK', 'https://app.exemple.com');
const SENDER_ID = env('SNS_SENDER_ID', '');
const SMS_ENABLED = env('SMS_ENABLED', 'true') !== 'false';

let client: SNSClient | null = null;

function getClient(): SNSClient {
  // Le client lit les identifiants de la chaîne AWS habituelle : variables
  // d'environnement, profil, ou rôle IAM de la tâche ECS / de l'instance EC2.
  if (!client) client = new SNSClient({ region: REGION });
  return client;
}

/** Format E.164 attendu par SNS : indicatif pays obligatoire. */
export function toE164(phoneNumber: string | null | undefined, defaultCountryCode = '1'): string | null {
  if (!phoneNumber) return null;
  const trimmed = phoneNumber.trim();
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits.length >= 8 ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 8) return null;
  // 10 chiffres = numéro nord-américain sans indicatif.
  return digits.length === 10 ? `+${defaultCountryCode}${digits}` : `+${digits}`;
}

async function groupName(groupId: string | null): Promise<string> {
  if (!groupId) return 'votre communauté';
  try {
    const group = await GroupModel.findOne(springIdFilter(groupId)).exec();
    return (group?.get('name') as string | undefined) ?? 'votre communauté';
  } catch {
    return 'votre communauté';
  }
}

export function buildInvitationMessage(firstName: string | null, group: string): string {
  const hello = firstName ? `Bonjour ${firstName}, ` : 'Bonjour, ';
  return `${hello}vous avez été ajouté au groupe ${group}. Installez l'application pour voir les membres et les événements : ${APP_LINK}`;
}

/**
 * Envoie l'invitation. N'échoue jamais bruyamment : la création du membre ne doit
 * pas être annulée parce que l'opérateur télécom a refusé le message.
 */
export async function sendInvitationSms(member: {
  firstName?: string | null;
  phoneNumber?: string | null;
  groupId?: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!SMS_ENABLED) return { sent: false, reason: 'envoi désactivé' };

  const destination = toE164(member.phoneNumber ?? null);
  if (!destination) return { sent: false, reason: 'numéro absent ou invalide' };

  const message = buildInvitationMessage(member.firstName ?? null, await groupName(member.groupId ?? null));

  if (!process.env.AWS_REGION && !process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
    console.log(`[invitation] (simulation) vers ${destination} : ${message}`);
    return { sent: false, reason: 'AWS non configuré' };
  }

  try {
    await getClient().send(
      new PublishCommand({
        PhoneNumber: destination,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
          ...(SENDER_ID
            ? { 'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: SENDER_ID } }
            : {}),
        },
      }),
    );
    console.log(`[invitation] texto envoyé à ${destination}`);
    return { sent: true };
  } catch (error) {
    console.error('[invitation] envoi impossible :', (error as Error).message);
    return { sent: false, reason: (error as Error).message };
  }
}
