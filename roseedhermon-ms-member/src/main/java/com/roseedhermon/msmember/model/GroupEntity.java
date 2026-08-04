package com.roseedhermon.msmember.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document(collection = "groups")
public class GroupEntity {
    @Id
    private String id;
    private String name;
    private String type; // ex: "association", "communauté religieuse"
    private String country;
    private String street;
    private String city;
    private String stateOrProvince;
    private String phone;
    private String email;
    private String website;
}
