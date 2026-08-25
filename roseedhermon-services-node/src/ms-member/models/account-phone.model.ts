import { Schema, model } from 'mongoose';

/**
 * Relie un numéro de téléphone au courriel Cognito d'un compte, pour la
 * connexion par téléphone.
 *
 * N'existe que côté Node : Cognito ne peut pas être interrogé par numéro sans
 * des droits IAM d'administration que la tâche ECS ne porte pas, et que cette
 * fonctionnalité ne justifie pas d'ajouter. Une ligne par numéro, posée à
 * l'inscription ; `phoneE164` fait clé, pas `_id`.
 */
const accountPhoneSchema = new Schema(
  {
    phoneE164: { type: String, required: true, unique: true },
    email: { type: String, required: true },
  },
  {
    collection: 'account_phones',
    versionKey: false,
    minimize: false,
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const AccountPhoneModel = model('AccountPhone', accountPhoneSchema);
