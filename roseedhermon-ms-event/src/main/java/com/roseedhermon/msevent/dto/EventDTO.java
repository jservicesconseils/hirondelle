package com.roseedhermon.msevent.dto;

import com.roseedhermon.msevent.entity.EventLocation;
import com.roseedhermon.msevent.dto.EventFileDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;
import com.roseedhermon.msevent.dto.PresenterDTO;

@Getter
@Setter
@Schema(description = "Données d'un événement")
public class EventDTO {
    @Schema(description = "Identifiant unique de l'événement")
    private String id;
    @Schema(description = "Nom de l'événement")
    private String name;
    @Schema(description = "Date de l'événement (format JJ/MM/AAAA)")
    private String date;
    @Schema(description = "Lieu de l'événement")
    private EventLocation location;
    @Schema(description = "Description de l'événement")
    private String description;
    @Schema(description = "L'événement est-il gratuit ?")
    private boolean isFree;
    
    // Manual getter/setter for isFree to ensure compatibility
    public boolean isFree() {
        return isFree;
    }
    
    public void setIsFree(boolean isFree) {
        this.isFree = isFree;
    }
    @Schema(description = "Montant de l'événement")
    private BigDecimal amount;
    @Schema(description = "Nombre de jours de l'événement")
    private int numberOfDays;
    @Schema(description = "Liste des présentateurs")
    private List<PresenterDTO> presenters;
    @Schema(description = "Catégorie de l'événement")
    private String category;
    @Schema(description = "Nombre de places disponibles")
    private int availableSeats;
    @Schema(description = "Date limite d'inscription")
    private String lastRegistrationDate;
    @Schema(description = "Type d'événement (présentiel, en ligne, hybride, etc.)")
    private String eventType;
    @Schema(description = "Statut de l'événement (brouillon, publié, annulé, etc.)")
    private String eventStatus;
    
    @Schema(description = "Liste des fichiers de l'événement")
    private List<EventFileDTO> files;
    
    @Schema(description = "Identifiant de la photo principale de l'événement")
    private String mainPhotoId;
}
