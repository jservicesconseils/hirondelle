package com.roseedhermon.msmember.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;
@Setter
@Getter
@Document(collection = "members")
public class MemberEntity {

    // Getters and Setters
    @Id
    private String id;
    private String lastName;
    private String firstName;
    private String gender;
    private LocalDate birthDate;
    private String profession;
    private String phoneNumber;
    private String email;
    private String address;
    private String city;
    private String location;
    private String photo;
    private List<String> socialLinks;
    private List<String> roles;
    private String groupId;
}