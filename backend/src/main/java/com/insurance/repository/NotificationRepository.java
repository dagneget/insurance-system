package com.insurance.repository;

import com.insurance.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
    List<Notification> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Notification> findTop50ByOrderByCreatedAtDesc();
    long countByUserIdAndReadFalse(Long userId);
    long countByRecipientRoleAndReadFalse(String recipientRole);
    long countByCustomerIdAndReadFalse(Long customerId);
}
