package com.proyecto.msvc_auth.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateRequest {
    @Size(min = 1, message = "El nombre no puede estar vacío")
    private String firstName;

    @Size(min = 1, message = "El apellido no puede estar vacío")
    private String lastName;

    @Email(message = "El correo electrónico debe ser válido")
    private String email;

    private String mobileNumber;
}