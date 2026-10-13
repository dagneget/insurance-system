package com.insurance.repository;

import com.insurance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:identifier) OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(:identifier)) ORDER BY u.id DESC")
    List<User> findAllByUsernameOrEmailIgnoreCase(@Param("identifier") String identifier);

    default Optional<User> findByUsernameOrEmailIgnoreCase(String identifier) {
        List<User> users = findAllByUsernameOrEmailIgnoreCase(identifier);
        return users.isEmpty() ? Optional.empty() : Optional.of(users.get(0));
    }

    Optional<User> findByAuthToken(String authToken);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.customer.id = :customerId")
    Optional<User> findByCustomerId(@Param("customerId") Long customerId);
}
