package com.roseedhermon.msevent.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventLocation {
    private String address;
    private String city;
    private String postalCode;
    private String country;
    private String placeName; // Ex: "Salle Polyvalente", "Centre communautaire"

    private Double latitude;
    private Double longitude;

    // getters et setters
}
