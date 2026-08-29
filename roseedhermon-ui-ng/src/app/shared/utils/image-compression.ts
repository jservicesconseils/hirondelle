/**
 * Réduit une image côté navigateur avant de la garder en base — les photos de
 * profil et de membre partent telles quelles dans un champ `photo` en base64,
 * jamais vers un stockage de fichiers séparé. Sans ce passage, une photo prise
 * directement au téléphone (couramment 4 à 10 Mo) dépassait la limite brute et
 * l'envoi était tout simplement refusé.
 *
 * Redimensionne au besoin (jamais d'agrandissement) et réencode en JPEG à une
 * qualité décroissante jusqu'à tenir sous `maxOutputBytes` : n'importe quelle
 * photo de portrait raisonnable finit largement en dessous après ce passage,
 * ce qui revient à lever la contrainte du point de vue de la personne qui
 * téléverse, sans laisser un fichier énorme s'écrire tel quel en base.
 */
export interface CompressImageOptions {
  /** Plus grand côté visé, en pixels. */
  maxDimension?: number;
  /** Poids maximal du résultat, en octets — la qualité JPEG baisse jusqu'à tenir dedans. */
  maxOutputBytes?: number;
  /** Qualité JPEG de départ (0 à 1) ; abaissée par paliers si le résultat dépasse `maxOutputBytes`. */
  startQuality?: number;
}

const DEFAULTS: Required<CompressImageOptions> = {
  maxDimension: 1280,
  maxOutputBytes: 700_000,
  startQuality: 0.85
};

export function compressImageToDataUrl(file: File, options: CompressImageOptions = {}): Promise<string> {
  const { maxDimension, maxOutputBytes, startQuality } = { ...DEFAULTS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("L'image n'a pas pu être lue."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("L'image n'a pas pu être décodée."));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Le navigateur ne peut pas traiter l'image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Paliers de qualité décroissante : la plupart des photos tiennent dès le
        // premier passage, ce n'est qu'un filet de sécurité pour les cas extrêmes.
        let quality = startQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length * 0.75 > maxOutputBytes && quality > 0.35) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
