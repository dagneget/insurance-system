package com.insurance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.entity.AuditLog;
import com.insurance.entity.DocumentAttachment;
import com.insurance.entity.Notification;
import com.insurance.entity.User;
import com.insurance.repository.AuditLogRepository;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.DocumentAttachmentRepository;
import com.insurance.repository.NotificationRepository;
import com.insurance.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditAndNotificationServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private DocumentAttachmentRepository documentAttachmentRepository;

    private ObjectMapper objectMapper;
    private AuditLogService auditLogService;
    private NotificationService notificationService;
    private DocumentStorageService documentStorageService;

    @TempDir
    Path tempStorageDir;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        auditLogService = new AuditLogService(auditLogRepository, objectMapper);
        notificationService = new NotificationService(notificationRepository, userRepository, customerRepository);
        documentStorageService = new DocumentStorageService(documentAttachmentRepository, tempStorageDir.toString());
    }

    @Test
    void recordAuditAction_SavesSerializedSnapshot() {
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        auditLogService.recordAction(
                "alexander.uw",
                "ROLE_UNDERWRITER",
                "POLICY_ISSUED",
                "POLICY",
                101L,
                "{\"status\":\"DRAFT\"}",
                "{\"status\":\"ISSUED\"}",
                "127.0.0.1"
        );

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertEquals("alexander.uw", saved.getActorUsername());
        assertEquals("ROLE_UNDERWRITER", saved.getActorRole());
        assertEquals("POLICY_ISSUED", saved.getAction());
        assertEquals("POLICY", saved.getEntityType());
        assertEquals(101L, saved.getEntityId());
        assertNotNull(saved.getOldValue());
        assertNotNull(saved.getNewValue());
    }

    @Test
    void sendUserNotification_TargetsUser() {
        User user = new User();
        user.setId(5L);
        user.setUsername("sarah.claims");

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        Notification notification = notificationService.sendUserNotification(
                5L,
                "Claim Assigned",
                "Claim #CLM-001 has been assigned to your desk.",
                "CLAIM_UPDATE",
                "/claims/1"
        );

        assertNotNull(notification);
        assertEquals("Claim Assigned", notification.getTitle());
        assertEquals(user, notification.getUser());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void storeDocument_ValidatesMimeTypeAndStoresContent() {
        byte[] pdfBytes = "%PDF-1.4 mock content".getBytes();
        when(documentAttachmentRepository.save(any(DocumentAttachment.class))).thenAnswer(i -> i.getArgument(0));

        DocumentAttachment doc = documentStorageService.storeDocument(
                "CLAIM_EVIDENCE",
                202L,
                "POLICE_REPORT",
                "police_report.pdf",
                pdfBytes,
                "application/pdf",
                "sarah.claims"
        );

        assertNotNull(doc);
        assertEquals("police_report.pdf", doc.getDocumentName());
        assertEquals("application/pdf", doc.getMimeType());
        verify(documentAttachmentRepository, times(1)).save(any(DocumentAttachment.class));
    }

    @Test
    void storeDocument_RejectsUnsupportedMimeType() {
        byte[] exeBytes = "MZ mock executable".getBytes();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                documentStorageService.storeDocument(
                        "CLAIM_EVIDENCE",
                        202L,
                        "UNKNOWN",
                        "malicious.exe",
                        exeBytes,
                        "application/x-msdownload",
                        "anonymous"
                )
        );

        assertTrue(ex.getMessage().contains("Unsupported file type"));
        verify(documentAttachmentRepository, never()).save(any());
    }
}
