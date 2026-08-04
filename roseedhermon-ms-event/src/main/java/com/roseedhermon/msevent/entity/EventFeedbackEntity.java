package com.roseedhermon.msevent.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "event_feedback")
public class EventFeedbackEntity {
    @Id
    private String id;
    private String eventId;
    private String userId;
    private String comment;
}
