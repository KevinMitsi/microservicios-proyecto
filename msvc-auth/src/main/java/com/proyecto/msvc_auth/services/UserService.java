package com.proyecto.msvc_auth.services;



import com.proyecto.msvc_auth.DTO.AuthResponse;
import com.proyecto.msvc_auth.DTO.LoginRequest;
import com.proyecto.msvc_auth.DTO.UserRegistrationRequest;
import com.proyecto.msvc_auth.DTO.UserUpdateRequest;
import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.Set;

public interface UserService {

    /**
     * Registra un nuevo usuario en el sistema
     * @param registrationRequest datos del usuario a registrar
     * @return el usuario creado
     * @throws IllegalArgumentException si los datos son inválidos
     * @throws RuntimeException si ya existe un usuario con el mismo username o email
     */
    UserEntity registerUser(UserRegistrationRequest registrationRequest);

    /**
     * Obtiene una lista paginada de usuarios
     * @param pageable configuración de paginación
     * @return página de usuarios
     */
    Page<UserEntity> getAllUsers(Pageable pageable);

    /**
     * Busca un usuario por su ID
     * @param id identificador del usuario
     * @return usuario encontrado o empty si no existe
     */
    Optional<UserEntity> getUserById(Long id);

    /**
     * Actualiza los datos de un usuario existente
     * @param id identificador del usuario a actualizar
     * @param updateRequest datos a actualizar
     * @return usuario actualizado
     * @throws IllegalArgumentException si los datos son inválidos
     * @throws RuntimeException si no se encuentra el usuario
     */
    UserEntity updateUser(Long id, UserUpdateRequest updateRequest);

    /**
     * Elimina un usuario del sistema
     *
     * @param id identificador del usuario a eliminar
     */
    void deleteUser(Long id);

    /**
     * Realiza la autenticación de un usuario
     * @param loginRequest credenciales de inicio de sesión
     * @return respuesta con token de autenticación y datos del usuario
     * @throws RuntimeException si las credenciales son inválidas
     */
    AuthResponse login(LoginRequest loginRequest);

    /**
     * Inicia el proceso de recuperación de contraseña
     *
     * @param email correo del usuario
     */
    void requestPasswordRecovery(String email);

    /**
     * Restablece la contraseña de un usuario usando un token de recuperación
     *
     * @param userId      id del usuario
     * @param token       token de recuperación
     * @param newPassword nueva contraseña
     * @throws RuntimeException si el token es inválido o ha expirado
     */
    void resetPasswordForUser(Long userId, String token, String newPassword);

    /**
     * Busca un usuario por su nombre de usuario
     * @param username nombre de usuario
     * @return usuario encontrado o empty si no existe
     */
    Optional<UserEntity> findByUsername(String username);

    /**
     * Busca un usuario por su correo electrónico
     * @param email correo electrónico
     * @return usuario encontrado o empty si no existe
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * Verifica si existe un usuario con el nombre de usuario dado
     * @param username nombre de usuario a verificar
     * @return true si existe, false en caso contrario
     */
    boolean existsByUsername(String username);

    /**
     * Verifica si existe un usuario con el correo electrónico dado
     * @param email correo electrónico a verificar
     * @return true si existe, false en caso contrario
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuarios por criterios específicos
     * @param searchTerm término de búsqueda para username, email, firstName o lastName
     * @param pageable configuración de paginación
     * @return página de usuarios que coinciden con la búsqueda
     */
    Page<UserEntity> searchUsers(String searchTerm, Pageable pageable);
    Optional<UserEntity>getUserByUsername(String username);
    UserEntity updateUserRoles(Long id, Set<Role> roles);

    /**
     * Obtiene una lista paginada de usuarios filtrando por nombre y apellido (opcional)
     * @param pageable configuración de paginación
     * @param firstName filtro de nombre (opcional)
     * @param lastName filtro de apellido (opcional)
     * @return página de usuarios filtrados
     */
    Page<UserEntity> getAllUsersFiltered(Pageable pageable, String firstName, String lastName);
}