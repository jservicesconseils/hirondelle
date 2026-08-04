package com.roseedhermon.msevent.entity;

import com.roseedhermon.msevent.entity.Presenter;
import com.roseedhermon.msevent.entity.EventFile;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.List;

@Data
@Document(collection = "event")
public class EventEntity {
    @Id
    private String id;
    private String name;
    private String date;
    private EventLocation location;
    private String description;
    private boolean isFree;
    private BigDecimal amount;
    private int numberOfDays;
    private List<Presenter> presenters;
    private String category;
    private int availableSeats;
    private String lastRegistrationDate;
    private String eventType;
    private String eventStatus;
    private List<EventFile> files;
    private String mainPhotoId;
}
