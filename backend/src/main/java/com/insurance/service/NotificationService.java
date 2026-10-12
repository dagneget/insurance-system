package com.insurance.service;

import com.insurance.entity.Customer;
import com.insurance.entity.Notification;
import com.insurance.entity.User;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.NotificationRepository;
import com.insurance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               CustomerRepository customerRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Notification sendUserNotification(Long userId, String title, String message, String category, String targetUrl) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        Notification notification = new Notification(user, null, null, title, message, category, targetUrl);
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification sendRoleNotification(String role, String title, String message, String category, String targetUrl) {
        Notification notification = new Notification(null, role, null, title, message, category, targetUrl);
        return notificationRepository.save(notification);
    }

    @Transactional
    public Notification sendCustomerNotification(Long customerId, String title, String message, String category, String targetUrl) {
        Customer customer = customerId != null ? customerRepository.findById(customerId).orElse(null) : null;
        Notification notification = new Notification(null, null, customer, title, message, category, targetUrl);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForActor(Long userId, String role, Long customerId) {
        List<Notification> result = new ArrayList<>();
        if (userId != null) {
            result.addAll(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
        }
        if (role != null) {
            result.addAll(notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(role));
        }
        if (customerId != null) {
            result.addAll(notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId));
        }
        if (result.isEmpty()) {
            return notificationRepository.findTop50ByOrderByCreatedAtDesc();
        }
        // Deduplicate & sort
        return result.stream()
                .distinct()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(50)
                .toList();
    }

    @Transactional
    public boolean markAsRead(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .map(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                    return true;
                }).orElse(false);
    }
}
