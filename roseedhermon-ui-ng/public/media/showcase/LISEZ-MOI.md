# Photos du diaporama d'accueil

Déposez ici les sept photos, avec **exactement** ces noms de fichier. L'ordre du
tableau est celui d'affichage sur la page.

| Ordre | Fichier attendu | La photo à déposer |
|---|---|---|
| 1 | `conference-pleniere.jpg` | Grande salle de conférence, orateur au pupitre, lustres dorés |
| 2 | `equipe-direction.jpg` | Six personnes autour d'une table de réunion, ordinateurs portables, vue sur la ville |
| 3 | `rassemblement.jpg` | Salle en bois à lumière orangée, orateur au micro, assemblée assise |
| 4 | `atelier-creatif.jpg` | Atelier floral, cinq personnes en tablier, teinte violette |
| 5 | `comite-strategie.jpg` | Cinq personnes prenant des notes, grandes baies vitrées, teinte turquoise |
| 6 | `formation.jpg` | Salle de classe, formateur debout expliquant, teinte bleue |
| 7 | `celebration.jpg` | Fête en plein air, guirlandes et ballons, teinte rose |

> **`celebration.jpg` sert deux fois.** C'est la septième vue du diaporama, et
> c'est aussi la photo de la moitié droite de la page de connexion (`/login`).
> Un seul fichier à déposer, deux pages qui s'allument.

## Format

- **Proportions** : 16/9 (les photos fournies font 2048 × 1152, c'est parfait).
- **Poids** : visez moins de 400 ko par image. Elles sont chargées dès l'ouverture
  de la page d'accueil ; au-delà, l'affichage devient sensible sur mobile.
- **Extension** : `.jpg`. Pour utiliser `.webp`, changez les chemins dans
  `src/app/web/components/showcases.ts`.

Conversion d'un PNG sur macOS :

```bash
sips -s format jpeg -s formatOptions 82 photo.png --out celebration.jpg
```

## Si un fichier manque

La vue correspondante est **retirée** du diaporama plutôt que d'afficher un cadre
vide. Si aucune photo n'est présente, la section entière disparaît de la page.
Rien ne casse — mais rien ne s'affiche non plus.

Pour la page de connexion, le repli est différent : faute de `celebration.jpg`,
c'est `conference-pleniere.jpg` qui s'affiche, puis un dégradé bleu si elle
manque aussi. La page garde ses deux moitiés dans tous les cas.

## Après avoir déposé un fichier

Le serveur de développement liste `public/` **au démarrage seulement**. Une photo
ajoutée pendant que `ng serve` tourne renvoie 404 jusqu'au redémarrage.
