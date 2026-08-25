import { Router } from 'express';
import { asyncHandler, requireAuth } from '../../common';
import { findEmailByPhone, registerAccountPhone } from '../services/account-phone.service';

/**
 * Résolution téléphone ↔ compte, montée sur `/api/v1/auth`.
 *
 * Cognito garde `email` comme identifiant : la connexion par téléphone a
 * besoin d'un détour pour retrouver ce courriel à partir du seul numéro, que
 * la personne saisit sans plus rien d'autre.
 */
export const authRouter = Router();

/** Posé juste après l'inscription : la session porte déjà l'identité vérifiée. */
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
 */
authRouter.get(
  '/phone/:phone',
  asyncHandler(async (req, res) => {
    const email = await findEmailByPhone(req.params.phone);
    if (!email) {
      res.status(404).json({ error: "Aucun compte n'est rattaché à ce numéro." });
      return;
    }
    res.json({ email });
  }),
);
