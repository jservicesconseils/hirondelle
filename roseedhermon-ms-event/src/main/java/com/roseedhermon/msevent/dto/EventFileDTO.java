package com.roseedhermon.msevent.dto;

import com.roseedhermon.msevent.entity.EventFile;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Schema(description = "Données d'un fichier d'événement")
public class EventFileDTO {
    @Schema(description = "Identifiant unique du fichier")
    private String id;
    
    @Schema(description = "Identifiant de l'événement associé")
    private String eventId;
    
    // Informations sur le fichier
    @Schema(description = "Nom du fichier")
    private String fileName;
    
    @Schema(description = "Chemin du fichier sur le serveur")
    private String filePath;
    
    @Schema(description = "Extension du fichier")
    private String fileExtension;
    
    @Schema(description = "Taille du fichier en bytes")
    private long fileSize;
    
    @Schema(description = "Type MIME du fichier")
    private String mimeType;
    
    // Métadonnées
    @Schema(description = "Description du fichier")
    private String description;
    
    @Schema(description = "Date de téléchargement")
    private LocalDateTime uploadDate;
    
    // Types de fichiers
    @Schema(description = "Type de fichier")
    private EventFile.FileType fileType;
    
    @Schema(description = "Indique si c'est une photo de présentation de l'événement")
    private boolean isPresentationPhoto;
    
    @Schema(description = "Indique si c'est la photo principale de présentation")
    private boolean isMainPhoto;
    
    // URL d'accès (calculée)
    @Schema(description = "URL d'accès au fichier")
    private String accessUrl;
    
    @Schema(description = "URL d'accès au thumbnail (si applicable)")
    private String thumbnailUrl;
} 