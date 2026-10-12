package com.insurance.service;

import com.insurance.entity.DocumentAttachment;
import com.insurance.repository.DocumentAttachmentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    private final DocumentAttachmentRepository documentAttachmentRepository;
    private final Path storageRoot;

    public DocumentStorageService(DocumentAttachmentRepository documentAttachmentRepository,
                                  @Value("${app.document.storage-dir:uploads/documents}") String storageDir) {
        this.documentAttachmentRepository = documentAttachmentRepository;
        this.storageRoot = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageRoot);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    @Transactional
    public DocumentAttachment storeDocument(String entityType, Long entityId, String category,
                                            String originalFilename, byte[] content,
                                            String mimeType, String uploadedBy) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Document content cannot be empty.");
        }

        if (content.length > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 10 MB limit.");
        }

        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file type: " + mimeType + ". Only PDF, JPEG, and PNG are permitted.");
        }

        String safeFilename = sanitizeFilename(originalFilename);
        String uniqueStoredName = UUID.randomUUID() + "_" + safeFilename;
        Path targetDir = storageRoot.resolve(entityType).resolve(String.valueOf(entityId));

        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(uniqueStoredName);
            Files.write(targetFile, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            DocumentAttachment doc = new DocumentAttachment(
                    entityType,
                    entityId,
                    safeFilename,
                    category,
                    targetFile.toString(),
                    (long) content.length,
                    mimeType.toLowerCase(),
                    uploadedBy != null ? uploadedBy : "ANONYMOUS"
            );

            return documentAttachmentRepository.save(doc);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store document file to disk", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] loadDocumentBytes(Long documentId) {
        DocumentAttachment doc = documentAttachmentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        Path filePath = Paths.get(doc.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new IllegalStateException("Stored file is missing from filesystem: " + doc.getStoragePath());
        }

        try {
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read document file", e);
        }
    }

    @Transactional(readOnly = true)
    public DocumentAttachment getDocumentMetadata(Long documentId) {
        return documentAttachmentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));
    }

    @Transactional(readOnly = true)
    public List<DocumentAttachment> getDocumentsForEntity(String entityType, Long entityId) {
        return documentAttachmentRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "attachment";
        }
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
