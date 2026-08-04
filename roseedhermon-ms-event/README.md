# Event Management System

## Overview
This project is a Spring Boot application for managing events. It provides features for creating, registering, and providing feedback on events.

## Features
- **CRUD Operations for Events**: Create, Read, Update, and Delete events.
- **Event Registration Management**: Manage registrations with statuses such as registered, canceled, and pending.
- **Event Reminders**: Send reminders via email or push notifications.
- **Event Feedback**: Allow participants to leave comments or feedback on events.

## Project Structure
```
event-management
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com
│   │   │       └── example
│   │   │           └── eventmanagement
│   │   │               ├── com.roseedhermon.msevent.EventManagementApplication.java
│   │   │               ├── controller
│   │   │               │   ├── controller.com.roseedhermon.msevent.EventController.java
│   │   │               │   ├── controller.com.roseedhermon.msevent.EventRegistrationController.java
│   │   │               │   └── EventFeedbackController.java
│   │   │               ├── entity
│   │   │               │   ├── entity.com.roseedhermon.msevent.EventEntity.java
│   │   │               │   ├── entity.com.roseedhermon.msevent.EventRegistrationEntity.java
│   │   │               │   ├── entity.com.roseedhermon.msevent.EventReminderEntity.java
│   │   │               │   └── entity.com.roseedhermon.msevent.EventFeedbackEntity.java
│   │   │               ├── repository
│   │   │               │   ├── repository.com.roseedhermon.msevent.EventRepository.java
│   │   │               │   ├── repository.com.roseedhermon.msevent.EventRegistrationRepository.java
│   │   │               │   └── EventFeedbackRepository.java
│   │   │               ├── service
│   │   │               │   ├── service.com.roseedhermon.msevent.EventService.java
│   │   │               │   ├── service.com.roseedhermon.msevent.EventRegistrationService.java
│   │   │               │   └── EventReminderService.java
│   │   │               └── dto
│   │   │                   ├── dto.com.roseedhermon.msevent.EventDTO.java
│   │   │                   ├── dto.com.roseedhermon.msevent.EventRegistrationDTO.java
│   │   │                   └── dto.com.roseedhermon.msevent.EventFeedbackDTO.java
│   │   └── resources
│   │       ├── application.properties
│   │       └── templates
│   │           └── email
│   │               └── reminder-template.html
├── pom.xml
└── README.md
```

## Setup Instructions
1. Clone the repository.
2. Navigate to the project directory.
3. Run `mvn clean install` to build the project.
4. Run the application using `mvn spring-boot:run`.
5. Access the application at `http://localhost:8080`.

## Dependencies
- Spring Boot
- Lombok
- JPA (Java Persistence API)
- Thymeleaf (for email templates)

## License
This project is licensed under the MIT License.