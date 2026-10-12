package com.insurance.controller;

import com.insurance.dto.TariffDto;
import com.insurance.service.TariffService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tariffs")
public class TariffController {

    private final TariffService tariffService;

    public TariffController(TariffService tariffService) {
        this.tariffService = tariffService;
    }

    @GetMapping
    public ResponseEntity<List<TariffDto>> getAllTariffs() {
        return ResponseEntity.ok(tariffService.getAllTariffs());
    }

    @GetMapping("/{productCode}")
    public ResponseEntity<TariffDto> getTariff(@PathVariable String productCode) {
        return ResponseEntity.ok(tariffService.getTariffByProductCode(productCode));
    }

    @PutMapping("/{productCode}")
    public ResponseEntity<TariffDto> updateTariff(
            @PathVariable String productCode,
            @RequestBody TariffDto updateDto,
            @RequestParam(value = "updatedBy", required = false, defaultValue = "elena.manager") String updatedBy) {
        return ResponseEntity.ok(tariffService.updateTariff(productCode, updateDto, updatedBy));
    }
}
