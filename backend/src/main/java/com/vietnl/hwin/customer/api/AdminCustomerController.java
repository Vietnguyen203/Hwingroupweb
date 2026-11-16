package com.vietnl.hwin.customer.api;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.customer.entity.CustomerSegment;
import com.vietnl.hwin.customer.service.CustomerAdminService;
import com.vietnl.hwin.customer.service.CustomerAdminService.CustomerRow;
import com.vietnl.hwin.customer.service.CustomerAdminService.Page;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Admin: danh sách khách + lọc nhóm + xuất CSV. */
@Tag(name = "customer-admin")
@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final CustomerAdminService service;

    public AdminCustomerController(CustomerAdminService service) {
        this.service = service;
    }

    /** @param segment NEW | LOYAL | DORMANT */
    @GetMapping
    public Page list(@RequestParam(required = false) String q,
                     @RequestParam(required = false) CustomerSegment segment,
                     @RequestParam(defaultValue = "0") int page,
                     @RequestParam(defaultValue = "20") int size) {
        return service.search(q, segment, page, size);
    }

    @GetMapping("/{id}")
    public CustomerRow get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/export.csv")
    public void exportCsv(@RequestParam(required = false) String q,
                          @RequestParam(required = false) CustomerSegment segment,
                          HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename("khach-hang.csv").build().toString());
        service.exportCsv(q, segment, new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8));
    }
}
