package com.roseedhermon.msevent.controller;

import com.roseedhermon.msevent.dto.EventRegistrationDTO;
import com.roseedhermon.msevent.service.EventRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/registrations")
public class EventRegistrationController {

    @Autowired
    private EventRegistrationService eventRegistrationService;

    @PostMapping
    public ResponseEntity<EventRegistrationDTO> registerForEvent(@RequestBody EventRegistrationDTO registrationDTO) {
        EventRegistrationDTO createdRegistration = eventRegistrationService.registerForEvent(registrationDTO);
        return ResponseEntity.ok(createdRegistration);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelRegistration(@PathVariable("id") String id) {
        eventRegistrationService.cancelRegistration(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<String> getRegistrationStatus(@PathVariable("id") String id) {
        String status = eventRegistrationService.getRegistrationStatus(id);
        return ResponseEntity.ok(status);
    }
}
