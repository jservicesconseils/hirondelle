package com.roseedhermon.msevent.controller;

import com.roseedhermon.msevent.dto.EventFeedbackDTO;
import com.roseedhermon.msevent.service.EventFeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feedback")
public class EventFeedbackController {

    @Autowired
    private EventFeedbackService eventFeedbackService;

    @PostMapping
    public ResponseEntity<EventFeedbackDTO> submitFeedback(@RequestBody EventFeedbackDTO feedbackDTO) {
        EventFeedbackDTO createdFeedback = eventFeedbackService.submitFeedback(feedbackDTO);
        return ResponseEntity.ok(createdFeedback);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<List<EventFeedbackDTO>> getFeedback(@PathVariable("eventId") String eventId) {
        List<EventFeedbackDTO> feedbackList = eventFeedbackService.getFeedbackByEventId(eventId);
        return ResponseEntity.ok(feedbackList);
    }
}
