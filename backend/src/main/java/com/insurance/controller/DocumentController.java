package com.insurance.controller;

import com.insurance.entity.DocumentAttachment;
import com.insurance.service.DocumentStorageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentStorageService documentStorageService;

    public DocumentController(DocumentStorageService documentStorageService) {
        this.documentStorageService = documentStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentAttachment> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") Long entityId,
            @RequestParam("category") String category,
            @RequestParam(value = "uploadedBy", required = false, defaultValue = "SYSTEM") String uploadedBy) throws IOException {

        DocumentAttachment attachment = documentStorageService.storeDocument(
                entityType,
                entityId,
                category,
                file.getOriginalFilename(),
                file.getBytes(),
                file.getContentType(),
                uploadedBy
        );

        return ResponseEntity.ok(attachment);
    }

    @GetMapping
    public ResponseEntity<List<DocumentAttachment>> getDocumentsForEntity(
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") Long entityId) {
        return ResponseEntity.ok(documentStorageService.getDocumentsForEntity(entityType, entityId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        DocumentAttachment metadata = documentStorageService.getDocumentMetadata(id);
        byte[] data = documentStorageService.loadDocumentBytes(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getDocumentName() + "\"")
                .body(data);
    }
}
