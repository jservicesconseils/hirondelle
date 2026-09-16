import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { GroupEntity } from '../../../shared/services/api/model/groupEntity';
import { GroupService } from '../../../shared/services/groups/groups.service';
import { PublicHeaderComponent } from '../../components/public-header.component';
import { PublicFooterComponent } from '../../components/public-footer.component';

/** Repris du formulaire de création admin (`/app/groups`), pour la même liste des deux côtés. */
const TYPE_CHOICES = ['Association', 'Club', 'Famille', 'Communauté religieuse', 'École', 'Entreprise', 'Autre'];

/**
 * N'importe quel compte ouvre sa propre communauté ici, qu'il en administre
 * déjà une ou pas — voir `POST /groups/request` côté serveur. Elle est active
 * immédiatement et son auteur en devient admin sur-le-champ ; elle s'ajoute
 * aux communautés que le compte administre (page Groupes) sans déloger celle
 * déjà active pour la session en cours — une reconnexion (ou bascule depuis
 * la page Groupes) est nécessaire pour que le jeton en tienne compte.
 */
@Component({
  selector: 'app-web-group-request',
  standalone: true,
  imports: [CommonModule, FormsModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-group-request.component.html',
  styleUrls: ['./web-group-request.component.scss']
})
export class WebGroupRequestComponent implements OnInit {
  readonly typeChoices = TYPE_CHOICES;

  loading = true;
  request: GroupEntity | null = null;

  // Coché par défaut : c'est le comportement d'origine, celui qu'un champ
  // absent produit déjà côté serveur — voir `showPublicCatalog` dans le mapper.
  form: GroupEntity = { showPublicCatalog: true };
  saving = false;
  error = '';

  constructor(
    public auth: AuthService,
    private groupService: GroupService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Affiche la dernière communauté créée par ce compte (le cas échéant) au
    // lieu du formulaire vide ; « Demander une autre communauté » (bouton du
    // panneau « Approuvée ») repart sur un formulaire neuf pour en créer une
    // autre. D'éventuels groupes encore `PENDING` d'avant ce changement
    // continuent de s'afficher en attente ici.
    this.groupService.getMyRequest().subscribe({
      next: (request) => {
        this.request = request;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get canSave(): boolean {
    return !!(this.form.name || '').trim() && !this.saving;
  }

  submit(): void {
    if (!this.canSave) return;
    this.saving = true;
    this.error = '';

    this.groupService.requestGroup(this.form).subscribe({
      next: (created) => {
        this.saving = false;
        this.request = created;
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.error || `L'envoi de la demande a échoué (${err?.status || 'réseau'}).`;
      }
    });
  }

  /** Après rejet, on efface la décision passée pour repartir d'un formulaire vide. */
  startOver(): void {
    this.request = null;
    this.form = { showPublicCatalog: true };
  }

  signOutAndReturn(): void {
    this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
