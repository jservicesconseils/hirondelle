package com.roseedhermon.msevent.service;

import com.roseedhermon.msevent.entity.EventFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileStorageService {

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Dossier d'upload principal créé: " + uploadPath.toAbsolutePath());
            } else {
                System.out.println("Dossier d'upload principal existant: " + uploadPath.toAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de l'initialisation du dossier d'upload: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Value("${app.file.upload-dir:uploads/events}")
    private String uploadDir;

    @Value("${app.file.max-size:10485760}") // 10MB par défaut
    private long maxFileSize;

    @Value("${app.file.allowed-types:image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4,audio/mpeg}")
    private String allowedTypes;

    private static final String[] ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"};
    private static final String[] ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".rtf"};
    private static final String[] ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".wmv", ".flv"};
    private static final String[] ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".aac", ".ogg", ".flac"};

    /**
     * Stocke un fichier uploadé et retourne un objet EventFile
     */
    public EventFile storeFile(MultipartFile multipartFile, String eventId, String description) throws IOException {
        System.out.println("=== FileStorageService.storeFile ===");
        System.out.println("Upload directory: " + uploadDir);
        System.out.println("Event ID: " + eventId);
        System.out.println("File name: " + multipartFile.getOriginalFilename());
        System.out.println("File size: " + multipartFile.getSize());
        System.out.println("File content type: " + multipartFile.getContentType());
        
        try {
            // Validation du fichier
            System.out.println("🔍 Début de la validation du fichier...");
            validateFile(multipartFile);
            System.out.println("✅ Validation du fichier réussie");

            // Créer le dossier de destination
            String eventUploadDir = uploadDir + "/" + eventId;
            Path uploadPath = Paths.get(eventUploadDir);
            System.out.println("📁 Event upload directory: " + eventUploadDir);
            System.out.println("📁 Full path: " + uploadPath.toAbsolutePath());
            
            try {
                if (!Files.exists(uploadPath)) {
                    System.out.println("📁 Création du dossier: " + uploadPath);
                    Files.createDirectories(uploadPath);
                    System.out.println("✅ Dossier créé avec succès");
                } else {
                    System.out.println("📁 Dossier existant: " + uploadPath);
                }
            } catch (Exception e) {
                System.err.println("❌ Erreur lors de la création du dossier: " + e.getMessage());
                e.printStackTrace();
                throw new IOException("Impossible de créer le dossier d'upload: " + e.getMessage(), e);
            }

            // Générer un nom de fichier unique
            String originalFilename = multipartFile.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            
            System.out.println("📝 Nom original: " + originalFilename);
            System.out.println("📝 Extension: " + fileExtension);
            System.out.println("📝 Nom unique: " + uniqueFilename);
            
            // Chemin complet du fichier
            Path filePath = uploadPath.resolve(uniqueFilename);
            System.out.println("📁 Chemin complet: " + filePath);
            
            // Sauvegarder le fichier
            System.out.println("💾 Début de la sauvegarde du fichier...");
            try {
                Files.copy(multipartFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("✅ Fichier sauvegardé avec succès");
            } catch (Exception e) {
                System.err.println("❌ Erreur lors de la sauvegarde du fichier: " + e.getMessage());
                e.printStackTrace();
                throw new IOException("Impossible de sauvegarder le fichier: " + e.getMessage(), e);
            }
            
            // Vérifier que le fichier a été créé
            if (!Files.exists(filePath)) {
                throw new IOException("Le fichier n'a pas été créé correctement");
            }
            
            long fileSize = Files.size(filePath);
            System.out.println("📊 Taille du fichier sauvegardé: " + fileSize + " bytes");
            
            // Créer l'objet EventFile
            System.out.println("📋 Création de l'objet EventFile...");
            EventFile eventFile = new EventFile();
            eventFile.setId(UUID.randomUUID().toString());
            eventFile.setEventId(eventId);
            eventFile.setFileName(originalFilename);
            eventFile.setFilePath(filePath.toString());
            eventFile.setFileExtension(fileExtension);
            eventFile.setFileSize(fileSize);
            eventFile.setMimeType(multipartFile.getContentType());
            eventFile.setDescription(description);
            eventFile.setUploadDate(LocalDateTime.now());
            eventFile.setFileType(determineFileType(multipartFile.getContentType(), fileExtension));
            eventFile.setPresentationPhoto(isImageMimeType(multipartFile.getContentType()));
            eventFile.setMainPhoto(false); // Par défaut, pas la photo principale
            
            System.out.println("✅ Objet EventFile créé: " + eventFile.getId());
            
            // Créer un thumbnail si c'est une image
            if (isImageMimeType(multipartFile.getContentType())) {
                System.out.println("🖼️ Création du thumbnail...");
                try {
                    createThumbnail(filePath.toString(), eventUploadDir, uniqueFilename);
                    System.out.println("✅ Thumbnail créé avec succès");
                } catch (Exception e) {
                    System.err.println("⚠️ Erreur lors de la création du thumbnail: " + e.getMessage());
                    // Ne pas faire échouer l'upload pour un problème de thumbnail
                }
            }
            
            System.out.println("=== FileStorageService.storeFile TERMINÉ AVEC SUCCÈS ===");
            return eventFile;
            
        } catch (IOException e) {
            System.err.println("=== ERREUR IO DANS FileStorageService ===");
            System.err.println("Message: " + e.getMessage());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "N/A"));
            e.printStackTrace();
            throw e;
        } catch (Exception e) {
            System.err.println("=== ERREUR INATTENDUE DANS FileStorageService ===");
            System.err.println("Message: " + e.getMessage());
            System.err.println("Type: " + e.getClass().getSimpleName());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "N/A"));
            e.printStackTrace();
            throw new IOException("Erreur inattendue lors du stockage du fichier: " + e.getMessage(), e);
        }
    }

    /**
     * Valide le fichier uploadé
     */
    private void validateFile(MultipartFile file) throws IOException {
        System.out.println("=== VALIDATION DU FICHIER ===");
        System.out.println("Nom du fichier: " + file.getOriginalFilename());
        System.out.println("Taille: " + file.getSize() + " bytes");
        System.out.println("Type MIME: " + file.getContentType());
        
        if (file.isEmpty()) {
            throw new IOException("Le fichier est vide");
        }

        if (file.getSize() > maxFileSize) {
            throw new IOException("Le fichier est trop volumineux. Taille maximale: " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        
        // Validation spéciale pour les fichiers WhatsApp
        if (originalFilename != null && originalFilename.toLowerCase().contains("whatsapp")) {
            System.out.println("Fichier WhatsApp détecté - Validation assouplie");
            
            // Pour les fichiers WhatsApp, on accepte même si le type MIME n'est pas reconnu
            if (contentType == null || (!allowedTypes.contains(contentType) && !isImageByExtension(originalFilename))) {
                System.out.println("Type MIME non reconnu pour WhatsApp, vérification par extension");
                if (!isImageByExtension(originalFilename)) {
                    throw new IOException("Fichier WhatsApp avec extension non autorisée. Extensions autorisées: jpg, jpeg, png, gif, webp");
                }
            }
        } else {
            // Validation normale pour les autres fichiers
            if (contentType == null || !allowedTypes.contains(contentType)) {
                throw new IOException("Type de fichier non autorisé. Types autorisés: " + allowedTypes);
            }
        }

        if (originalFilename == null || !hasValidExtension(originalFilename)) {
            throw new IOException("Extension de fichier non autorisée");
        }
        
        System.out.println("✅ Validation réussie pour: " + originalFilename);
    }
    
    /**
     * Vérifie si un fichier est une image par son extension (pour les fichiers WhatsApp)
     */
    private boolean isImageByExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.equals(".jpg") || extension.equals(".jpeg") || 
               extension.equals(".png") || extension.equals(".gif") || 
               extension.equals(".webp");
    }

    /**
     * Vérifie si l'extension du fichier est autorisée
     */
    private boolean hasValidExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        System.out.println("=== VALIDATION EXTENSION ===");
        System.out.println("Nom du fichier: " + filename);
        System.out.println("Extension extraite: " + extension);
        System.out.println("Est-ce une image? " + isImageFile(filename));
        System.out.println("Est-ce un document? " + isDocumentFile(filename));
        System.out.println("Est-ce une vidéo? " + isVideoFile(filename));
        System.out.println("Est-ce un audio? " + isAudioFile(filename));
        
        // Vérifier selon le type de fichier
        if (isImageFile(filename)) {
            boolean isValid = isValidImageExtension(extension);
            System.out.println("Validation image: " + isValid);
            System.out.println("Extensions d'images autorisées: " + String.join(", ", ALLOWED_IMAGE_EXTENSIONS));
            return isValid;
        } else if (isDocumentFile(filename)) {
            boolean isValid = isValidDocumentExtension(extension);
            System.out.println("Validation document: " + isValid);
            return isValid;
        } else if (isVideoFile(filename)) {
            boolean isValid = isValidVideoExtension(extension);
            System.out.println("Validation vidéo: " + isValid);
            return isValid;
        } else if (isAudioFile(filename)) {
            boolean isValid = isValidAudioExtension(extension);
            System.out.println("Validation audio: " + isValid);
            return isValid;
        }
        
        System.out.println("Aucun type de fichier reconnu");
        return false;
    }

    /**
     * Détermine le type de fichier
     */
    private EventFile.FileType determineFileType(String contentType, String extension) {
        if (isImageMimeType(contentType)) {
            return EventFile.FileType.PRESENTATION_PHOTO;
        } else if (isDocumentMimeType(contentType)) {
            return EventFile.FileType.DOCUMENT;
        } else if (isVideoMimeType(contentType)) {
            return EventFile.FileType.VIDEO;
        } else if (isAudioMimeType(contentType)) {
            return EventFile.FileType.AUDIO;
        }
        return EventFile.FileType.OTHER;
    }

    /**
     * Vérifie si c'est un type MIME d'image
     */
    private boolean isImageMimeType(String contentType) {
        return contentType != null && (
            contentType.equals("image/jpeg") || 
            contentType.equals("image/png") || 
            contentType.equals("image/gif") || 
            contentType.equals("image/webp")
        );
    }

    /**
     * Vérifie si c'est un type MIME de document
     */
    private boolean isDocumentMimeType(String contentType) {
        return contentType != null && (
            contentType.equals("application/pdf") || 
            contentType.equals("application/msword") || 
            contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
            contentType.equals("text/plain") ||
            contentType.equals("application/rtf")
        );
    }

    /**
     * Vérifie si c'est un type MIME de vidéo
     */
    private boolean isVideoMimeType(String contentType) {
        return contentType != null && (
            contentType.equals("video/mp4") || 
            contentType.equals("video/avi") || 
            contentType.equals("video/quicktime") || 
            contentType.equals("video/x-ms-wmv") || 
            contentType.equals("video/x-flv")
        );
    }

    /**
     * Vérifie si c'est un type MIME d'audio
     */
    private boolean isAudioMimeType(String contentType) {
        return contentType != null && (
            contentType.equals("audio/mpeg") || 
            contentType.equals("audio/wav") || 
            contentType.equals("audio/aac") || 
            contentType.equals("audio/ogg") || 
            contentType.equals("audio/flac")
        );
    }

    /**
     * Vérifie si c'est un fichier image (par extension)
     */
    private boolean isImageFile(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.equals(".jpg") || extension.equals(".jpeg") || 
               extension.equals(".png") || extension.equals(".gif") || 
               extension.equals(".webp");
    }

    /**
     * Vérifie si c'est un fichier document
     */
    private boolean isDocumentFile(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.equals(".pdf") || extension.equals(".doc") || 
               extension.equals(".docx") || extension.equals(".txt") || 
               extension.equals(".rtf");
    }

    /**
     * Vérifie si c'est un fichier vidéo
     */
    private boolean isVideoFile(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.equals(".mp4") || extension.equals(".avi") || 
               extension.equals(".mov") || extension.equals(".wmv") || 
               extension.equals(".flv");
    }

    /**
     * Vérifie si c'est un fichier audio
     */
    private boolean isAudioFile(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.equals(".mp3") || extension.equals(".wav") || 
               extension.equals(".aac") || extension.equals(".ogg") || 
               extension.equals(".flac");
    }

    /**
     * Vérifie les extensions d'images
     */
    private boolean isValidImageExtension(String extension) {
        for (String ext : ALLOWED_IMAGE_EXTENSIONS) {
            if (ext.equals(extension)) return true;
        }
        return false;
    }

    /**
     * Vérifie les extensions de documents
     */
    private boolean isValidDocumentExtension(String extension) {
        for (String ext : ALLOWED_DOCUMENT_EXTENSIONS) {
            if (ext.equals(extension)) return true;
        }
        return false;
    }

    /**
     * Vérifie les extensions de vidéos
     */
    private boolean isValidVideoExtension(String extension) {
        for (String ext : ALLOWED_VIDEO_EXTENSIONS) {
            if (ext.equals(extension)) return true;
        }
        return false;
    }

    /**
     * Vérifie les extensions d'audio
     */
    private boolean isValidAudioExtension(String extension) {
        for (String ext : ALLOWED_AUDIO_EXTENSIONS) {
            if (ext.equals(extension)) return true;
        }
        return false;
    }

    /**
     * Extrait l'extension du fichier
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Crée un thumbnail de l'image
     */
    public void createThumbnail(String originalFilePath, String outputDir, String filename) throws IOException {
        try {
            BufferedImage originalImage = ImageIO.read(new File(originalFilePath));
            if (originalImage == null) {
                return; // Pas une image valide
            }

            // Calculer les dimensions du thumbnail (300x300 max)
            int maxDimension = 300;
            int originalWidth = originalImage.getWidth();
            int originalHeight = originalImage.getHeight();
            
            int thumbnailWidth, thumbnailHeight;
            if (originalWidth > originalHeight) {
                thumbnailWidth = maxDimension;
                thumbnailHeight = (int) ((double) originalHeight / originalWidth * maxDimension);
            } else {
                thumbnailHeight = maxDimension;
                thumbnailWidth = (int) ((double) originalWidth / originalHeight * maxDimension);
            }

            // Créer le thumbnail
            BufferedImage thumbnail = new BufferedImage(thumbnailWidth, thumbnailHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = thumbnail.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            
            g2d.drawImage(originalImage, 0, 0, thumbnailWidth, thumbnailHeight, null);
            g2d.dispose();

            // Sauvegarder le thumbnail
            String thumbnailName = "thumb_" + filename;
            Path thumbnailPath = Paths.get(outputDir, thumbnailName);
            ImageIO.write(thumbnail, "JPEG", thumbnailPath.toFile());

        } catch (Exception e) {
            // Log l'erreur mais ne pas faire échouer l'upload
            System.err.println("Erreur lors de la création du thumbnail: " + e.getMessage());
        }
    }

    /**
     * Supprime un fichier
     */
    public void deleteFile(String eventId, String filename) throws IOException {
        Path filePath = Paths.get(uploadDir, eventId, filename);
        Path thumbnailPath = Paths.get(uploadDir, eventId, "thumb_" + filename);
        
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
        
        if (Files.exists(thumbnailPath)) {
            Files.delete(thumbnailPath);
        }
    }

    /**
     * Supprime tous les fichiers d'un événement
     */
    public void deleteEventFiles(String eventId) throws IOException {
        Path eventDir = Paths.get(uploadDir, eventId);
        if (Files.exists(eventDir)) {
            Files.walk(eventDir)
                    .sorted((a, b) -> b.compareTo(a)) // Supprimer les fichiers avant les dossiers
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            System.err.println("Erreur lors de la suppression du fichier: " + path);
                        }
                    });
        }
    }

    /**
     * Récupère le chemin physique d'un fichier
     */
    public Path getFilePath(String eventId, String filename) {
        return Paths.get(uploadDir, eventId, filename);
    }

    /**
     * Récupère le chemin physique du thumbnail
     */
    public Path getThumbnailPath(String eventId, String filename) {
        return Paths.get(uploadDir, eventId, "thumb_" + filename);
    }

    /**
     * Récupère l'objet File (déprécié - utiliser getFilePath à la place)
     * @deprecated Utiliser getFilePath qui retourne un Path
     */
    @Deprecated
    public File getFile(String eventId, String filename) {
        return Paths.get(uploadDir, eventId, filename).toFile();
    }
} 