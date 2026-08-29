import { Router } from 'express';
import { asyncHandler, requireAuth } from '../../common';
import { findEmailByPhone, findPhoneByEmail, registerAccountPhone } from '../services/account-phone.service';
import { findMemberByPhone } from '../services/member.service';

/**
 * Résolution téléphone ↔ compte, montée sur `/api/v1/auth`.
 *
 * Cognito garde `email` comme identifiant : la connexion par téléphone a
 * besoin d'un détour pour retrouver ce courriel à partir du seul numéro, que
 * la personne saisit sans plus rien d'autre.
 */
export const authRouter = Router();

/** Pour préremplir le profil : le numéro déjà enregistré, s'il y en a un. */
authRouter.get(
  '/phone',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = req.auth?.email;
    if (!email) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    res.json({ phone: await findPhoneByEmail(email) });
  }),
);

/** Posé à l'inscription, ou modifié depuis le profil : la session porte déjà l'identité vérifiée. */
authRouter.post(
  '/phone',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = req.auth?.email;
    const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';

    if (!email) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!phone.trim()) {
      res.status(400).json({ error: 'Indiquez un numéro de téléphone.' });
      return;
    }

    await registerAccountPhone(email, phone);
    res.status(204).end();
  }),
);

/**
 * Ouvert sans session, comme la première étape de « mot de passe oublié » :
 * c'est justement parce que la personne n'est pas encore connectée qu'elle a
 * besoin de ce courriel.
 *
 * D'abord sur un compte déjà lié (`account_phones`, posé à une connexion
 * précédente) ; à défaut, sur une fiche déjà importée mais jamais encore
 * utilisée pour se connecter — son numéro y figure déjà, seul le compte
 * Cognito reste à créer, ce que le client fait dans la foulée.
 */
authRouter.get(
  '/phone/:phone',
  asyncHandler(async (req, res) => {
    const linked = await findEmailByPhone(req.params.phone);
    if (linked) {
      res.json({ email: linked });
      return;
    }

    const member = await findMemberByPhone(req.params.phone);
    if (member?.email) {
      res.json({ email: member.email });
      return;
    }

    res.status(404).json({ error: "Aucun compte n'est rattaché à ce numéro." });
  }),
);
