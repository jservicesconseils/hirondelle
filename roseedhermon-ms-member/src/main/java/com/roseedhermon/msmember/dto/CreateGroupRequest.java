package com.roseedhermon.msmember.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateGroupRequest {

    // Informations du groupe
    private String name;
    private String type;
    private String country;
    private String street;
    private String city;
    private String stateOrProvince;
    private String phone;
    private String email;
    private String website;

    // Liste des 2 administrateurs à créer
    private List<AdminDto> administrators;

    @Data
    public static class AdminDto {
        private String lastName;
        private String firstName;
        private String gender;
        private String phoneNumber;
        private String email;
        private String address;
        private String city;
        private String location;
        private String profession;
        private String photo;
        private List<String> socialLinks;
    }
}
