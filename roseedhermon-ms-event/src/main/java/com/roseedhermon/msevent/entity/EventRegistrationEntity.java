package com.roseedhermon.msevent.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "event_registration")
public class EventRegistrationEntity {
    @Id
    private String id;
    private String eventId;
    private String userId;
    private String status; // e.g., registered, canceled, pending
}
