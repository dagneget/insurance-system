package com.insurance.service;

import com.insurance.dto.BillingScheduleDto;
import com.insurance.entity.BillingSchedule;
import com.insurance.entity.Customer;
import com.insurance.entity.Policy;
import com.insurance.repository.BillingScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingScheduleServiceTest {

    @Mock
    private BillingScheduleRepository billingScheduleRepository;

    private BillingScheduleService billingScheduleService;

    @BeforeEach
    void setUp() {
        billingScheduleService = new BillingScheduleService(billingScheduleRepository);
    }

    @Test
    @DisplayName("getAllSchedules returns all billing schedules mapped to DTOs")
    void getAllSchedules_success() {
        Customer customer = new Customer("Abebe Bikila", "+251911223344", null);
        Policy policy = new Policy();
        policy.setId(10L);
        policy.setPolicyNumber("POL-2026-0001");
        policy.setCustomer(customer);

        BillingSchedule s1 = new BillingSchedule(policy, 1, 4, LocalDate.now().plusMonths(1), new BigDecimal("5000.00"), 15);
        s1.setId(101L);

        when(billingScheduleRepository.findAll()).thenReturn(List.of(s1));

        List<BillingScheduleDto> result = billingScheduleService.getAllSchedules();

        assertEquals(1, result.size());
        BillingScheduleDto dto = result.get(0);
        assertEquals(101L, dto.getId());
        assertEquals("POL-2026-0001", dto.getPolicyNumber());
        assertEquals("Abebe Bikila", dto.getCustomerName());
        assertEquals(1, dto.getInstallmentNumber());
        assertEquals(4, dto.getTotalInstallments());
        assertEquals(new BigDecimal("5000.00"), dto.getAmountDue());
    }

    @Test
    @DisplayName("getSchedulesByPolicy filters by policy ID")
    void getSchedulesByPolicy_success() {
        Policy policy = new Policy();
        policy.setId(20L);
        policy.setPolicyNumber("POL-2026-0002");

        BillingSchedule s1 = new BillingSchedule(policy, 1, 2, LocalDate.now(), new BigDecimal("3000.00"), 15);
        BillingSchedule s2 = new BillingSchedule(policy, 2, 2, LocalDate.now().plusMonths(6), new BigDecimal("3000.00"), 15);

        when(billingScheduleRepository.findByPolicyIdOrderByInstallmentNumberAsc(20L)).thenReturn(List.of(s1, s2));

        List<BillingScheduleDto> list = billingScheduleService.getSchedulesByPolicy(20L);

        assertEquals(2, list.size());
        assertEquals(1, list.get(0).getInstallmentNumber());
        assertEquals(2, list.get(1).getInstallmentNumber());
    }

    @Test
    @DisplayName("getOverdueSchedules marks past-grace-period schedules as OVERDUE")
    void getOverdueSchedules_transitionsPastGracePeriodToOverdue() {
        LocalDate today = LocalDate.now();
        Policy policy = new Policy();
        policy.setId(30L);
        policy.setPolicyNumber("POL-2026-0003");

        // Expired beyond 15 days grace period
        BillingSchedule overdue = new BillingSchedule(policy, 1, 4, today.minusDays(20), new BigDecimal("2500.00"), 15);
        overdue.setStatus("PENDING");

        // Past due date but within 15-day grace period (due 5 days ago)
        BillingSchedule withinGrace = new BillingSchedule(policy, 2, 4, today.minusDays(5), new BigDecimal("2500.00"), 15);
        withinGrace.setStatus("PENDING");

        when(billingScheduleRepository.findByDueDateBeforeAndStatusNot(eq(today), eq("PAID")))
                .thenReturn(List.of(overdue, withinGrace));

        List<BillingScheduleDto> results = billingScheduleService.getOverdueSchedules();

        assertEquals(2, results.size());
        assertEquals("OVERDUE", overdue.getStatus());
        assertEquals("PENDING", withinGrace.getStatus());

        verify(billingScheduleRepository).save(overdue);
        verify(billingScheduleRepository, never()).save(withinGrace);
    }
}
