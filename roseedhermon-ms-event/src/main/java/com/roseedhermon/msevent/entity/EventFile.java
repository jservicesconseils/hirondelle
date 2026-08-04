package com.roseedhermon.msevent.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Document(collection = "event_files")
public class EventFile {
    @Id
    private String id;
    private String eventId;
    
    // Informations sur le fichier
    @Field("file_data")
    private byte[] fileData;
    private String fileName;
    private String filePath;
    private String fileExtension;
    private long fileSize;
    private String mimeType;
    
    // Métadonnées
    private String description;
    private LocalDateTime uploadDate;
    
    // Types de fichiers
    private FileType fileType;
    private boolean isPresentationPhoto;  // Photo de présentation de l'événement
    private boolean isMainPhoto;          // Photo principale de présentation
    
    // Énumération des types de fichiers
    public enum FileType {
        PRESENTATION_PHOTO,    // Photo de présentation
        MAIN_PRESENTATION,     // Photo principale de présentation
        DOCUMENT,              // Document (PDF, Word, etc.)
        VIDEO,                 // Vidéo
        AUDIO,                 // Audio
        OTHER                  // Autres types
    }
} 