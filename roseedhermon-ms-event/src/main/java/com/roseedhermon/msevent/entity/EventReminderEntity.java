package com.roseedhermon.msevent.entity;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Data
@Document(collection = "event_reminder")
public class EventReminderEntity {
    private String id;
    private String eventId;
    private String userId;
    private String reminderDate;
}