import { Router } from 'express';
import { ALL_FEATURES, asyncHandler, featuresOfGroup, isSuperAdmin, requireAuth, toStringOrNull } from '../../common';
import { memberToJson } from '../mappers/member.mapper';
import { groupToJson } from '../mappers/group.mapper';
import * as memberService from '../services/member.service';
import * as groupService from '../services/group.service';

/**
 * Profil de l'utilisateur connecté, monté sur `/api/v1/me`.
 *
 * Le jeton Cognito porte l'identité, mais pas la fiche membre : ce point d'entrée
 * fait le lien entre les deux par le courriel, et renvoie du même coup le groupe et
 * les rôles. C'est ce que le front appelle juste après la connexion.
 */
export const meRouter = Router();

meRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = req.auth?.email ?? null;
    const member = email ? await memberService.findMemberByEmail(email) : null;
    const profile = member ? memberToJson(member) : null;

    // Le groupe du jeton fait foi ; à défaut, celui de la fiche.
    const groupId = req.auth?.groupId ?? profile?.groupId ?? null;
    const group = groupId ? await groupService.getGroupById(groupId) : null;

    /**
     * Modules ouverts à cette personne. Le super administrateur n'appartient à
     * aucun groupe en particulier et les a tous ; les autres héritent de ceux du
     * leur. Le client s'en sert pour n'afficher que les sections utilisables —
     * le refus, lui, reste appliqué par le serveur sur chaque route.
     */
    const features = isSuperAdmin(req) ? [...ALL_FEATURES] : await featuresOfGroup(groupId);

    res.json({
      sub: req.auth?.sub ?? null,
      email,
      roles: req.auth?.roles ?? [],
      groupId,
      group: group ? groupToJson(group) : null,
      member: profile,
      features,
    });
  }),
);

/**
 * Prénom et nom de la personne connectée.
 *
 * Un compte n'a pas forcément de fiche membre — un super administrateur en
 * particulier, qui n'appartient à aucun groupe. Sans elle, l'application
 * retombe sur le préfixe du courriel faute d'autre identité disponible : cette
 * route permet à chacun de fixer son propre nom, qu'une fiche existe déjà ou non.
 */
meRouter.put(
  '/name',
  requireAuth,
  asyncHandler(async (req, res) => {
    const email = req.auth?.email ?? null;
    if (email === null) {
      res.status(400).json({ error: 'Aucun courriel associé à la session.' });
      return;
    }

    const firstName = toStringOrNull((req.body as Record<string, unknown> | undefined)?.firstName);
    const lastName = toStringOrNull((req.body as Record<string, unknown> | undefined)?.lastName);
    if (firstName === null && lastName === null) {
      res.status(400).json({ error: 'Indiquez un prénom ou un nom.' });
      return;
    }

    const existing = await memberService.findMemberByEmail(email);
    const saved = existing
      ? await memberService.updateMember(String(existing._id), { ...memberToJson(existing), firstName, lastName })
      : await memberService.addMember({ email, firstName, lastName });

    res.json(memberToJson(saved));
  }),
);
