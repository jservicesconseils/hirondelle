package com.roseedhermon.msevent.dto;

import com.roseedhermon.msevent.entity.EventLocation;
import com.roseedhermon.msevent.dto.EventFileDTO;
import com.roseedhermon.msevent.dto.PresenterDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Schema(description = "Données pour créer un événement avec photos")
public class CreateEventWithPhotosDTO {
    
    @Schema(description = "Nom de l'événement", required = true)
    private String name;
    
    @Schema(description = "Date de l'événement (format JJ/MM/AAAA)", required = true)
    private String date;
    
    @Schema(description = "Lieu de l'événement", required = true)
    private EventLocation location;
    
    @Schema(description = "Description de l'événement")
    private String description;
    
    @Schema(description = "L'événement est-il gratuit ?")
    private boolean isFree;
    
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
    
    @Schema(description = "Liste des photos à ajouter à l'événement")
    private List<EventFileDTO> photos;
    
    @Schema(description = "Indique si la première photo doit être marquée comme principale")
    private boolean setFirstPhotoAsMain = true;
} 