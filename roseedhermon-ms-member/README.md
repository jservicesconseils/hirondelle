# Roseedhermon MS Member

## Overview
This project is a Spring Boot microservice for managing a database of members and their information. It connects to a MongoDB database and provides RESTful APIs for CRUD operations on member records.

## Features
- Manage member information including personal details, contact information, and social links.
- RESTful API for creating, retrieving, updating, and deleting members.
- Connection to MongoDB for data persistence.

## Project Structure
```
roseedhermon-ms-member
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com
│   │   │       └── roseedhermon
│   │   │           └── msmember
│   │   │               ├── MsMemberApplication.java
│   │   │               ├── controller
│   │   │               │   └── MemberController.java
│   │   │               ├── model
│   │   │               │   └── Member.java
│   │   │               ├── repository
│   │   │               │   └── MemberRepository.java
│   │   │               └── service
│   │   │                   └── MemberService.java
│   │   └── resources
│   │       ├── application.properties
│   │       └── static
│   └── test
│       └── java
│           └── com
│               └── roseedhermon
│                   └── msmember
│                       └── MsMemberApplicationTests.java
├── pom.xml
└── README.md
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/roseedhermon-ms-member.git
   ```
2. Navigate to the project directory:
   ```
   cd roseedhermon-ms-member
   ```
3. Update the `application.properties` file with your MongoDB connection details.
4. Build the project using Maven:
   ```
   mvn clean install
   ```
5. Run the application:
   ```
   mvn spring-boot:run
   ```

## Usage
- The API endpoints can be accessed at `http://localhost:8080/members`.
- Use tools like Postman or curl to interact with the API.

## Dependencies
- Spring Boot
- Spring Data MongoDB
- Lombok (for reducing boilerplate code)

## License
This project is licensed under the MIT License. See the LICENSE file for more details.