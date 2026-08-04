package com.roseedhermon.msevent.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventFeedbackDTO {
    private String id;
    private String eventId;
    private String userId;
    private String comment;
}
