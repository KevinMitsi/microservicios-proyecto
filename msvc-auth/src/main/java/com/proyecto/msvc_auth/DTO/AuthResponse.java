package com.proyecto.msvc_auth.DTO;


import com.proyecto.msvc_auth.Entity.UserEntity;
import lombok.Data;

@Data
public class AuthResponse {

    private String token;
    private Integer expiresIn;
    private String tokenType;
    private UserEntity user;

}