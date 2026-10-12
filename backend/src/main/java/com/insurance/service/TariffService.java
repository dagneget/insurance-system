package com.insurance.service;

import com.insurance.dto.TariffDto;
import com.insurance.entity.Tariff;
import com.insurance.repository.TariffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TariffService {

    private final TariffRepository tariffRepository;
    private final AuditLogService auditLogService;

    public TariffService(TariffRepository tariffRepository, AuditLogService auditLogService) {
        this.tariffRepository = tariffRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<TariffDto> getAllTariffs() {
        return tariffRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TariffDto getTariffByProductCode(String productCode) {
        return tariffRepository.findByProductCode(productCode)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found for product code: " + productCode));
    }

    @Transactional
    public TariffDto updateTariff(String productCode, TariffDto updateDto, String updatedBy) {
        Tariff tariff = tariffRepository.findByProductCode(productCode)
                .orElseThrow(() -> new IllegalArgumentException("Tariff not found for product code: " + productCode));

        TariffDto oldSnapshot = toDto(tariff);

        if (updateDto.getBaseRatePercentage() != null) {
            tariff.setBaseRatePercentage(updateDto.getBaseRatePercentage());
        }
        if (updateDto.getMinPremium() != null) {
            tariff.setMinPremium(updateDto.getMinPremium());
        }
        if (updateDto.getTaxPercentage() != null) {
            tariff.setTaxPercentage(updateDto.getTaxPercentage());
        }
        if (updateDto.getStandardExcess() != null) {
            tariff.setStandardExcess(updateDto.getStandardExcess());
        }
        if (updateDto.getMaxLoadingPercentage() != null) {
            tariff.setMaxLoadingPercentage(updateDto.getMaxLoadingPercentage());
        }
        if (updateDto.getMaxDiscountPercentage() != null) {
            tariff.setMaxDiscountPercentage(updateDto.getMaxDiscountPercentage());
        }
        if (updateDto.getBrokerCommissionPercentage() != null) {
            tariff.setBrokerCommissionPercentage(updateDto.getBrokerCommissionPercentage());
        }
        if (updateDto.getThirdPartyPropertyLimit() != null) {
            tariff.setThirdPartyPropertyLimit(updateDto.getThirdPartyPropertyLimit());
        }
        if (updateDto.getActive() != null) {
            tariff.setActive(updateDto.getActive());
        }

        tariff.setUpdatedBy(updatedBy != null ? updatedBy : "ADMIN");
        Tariff saved = tariffRepository.save(tariff);

        TariffDto newSnapshot = toDto(saved);

        // Record audit trail
        auditLogService.recordAction(
                updatedBy != null ? updatedBy : "ADMIN",
                "ROLE_ADMIN",
                "TARIFF_UPDATED",
                "TARIFF",
                saved.getId(),
                oldSnapshot,
                newSnapshot,
                null
        );

        return newSnapshot;
    }

    private TariffDto toDto(Tariff t) {
        TariffDto dto = new TariffDto();
        dto.setId(t.getId());
        dto.setProductCode(t.getProductCode());
        dto.setProductName(t.getProductName());
        dto.setBaseRatePercentage(t.getBaseRatePercentage());
        dto.setMinPremium(t.getMinPremium());
        dto.setTaxPercentage(t.getTaxPercentage());
        dto.setStandardExcess(t.getStandardExcess());
        dto.setMaxLoadingPercentage(t.getMaxLoadingPercentage());
        dto.setMaxDiscountPercentage(t.getMaxDiscountPercentage());
        dto.setBrokerCommissionPercentage(t.getBrokerCommissionPercentage());
        dto.setThirdPartyPropertyLimit(t.getThirdPartyPropertyLimit());
        dto.setActive(t.getActive());
        dto.setUpdatedBy(t.getUpdatedBy());
        dto.setUpdatedAt(t.getUpdatedAt());
        return dto;
    }
}
