package com.vietnl.hwin.ordering.entity;

import java.util.regex.Pattern;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import com.vietnl.hwin.common.exception.DomainException;

/**
 * Value object: thông tin xuất hóa đơn VAT điện tử (demo chỉ thu thập, chưa phát hành).
 * Mã số thuế: 10 số, hoặc 10 số + "-" + 3 số (chi nhánh).
 */
@Embeddable
public record VatInvoiceInfo(
        @Column(name = "vat_company_name") String companyName,
        @Column(name = "vat_tax_code") String taxCode,
        @Column(name = "vat_address") String address,
        @Column(name = "vat_email") String email) {

    private static final Pattern TAX_CODE = Pattern.compile("^\\d{10}(-\\d{3})?$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public VatInvoiceInfo {
        if (companyName == null || companyName.isBlank()) {
            throw new DomainException("VAT_INVALID", "Thiếu tên công ty xuất hóa đơn");
        }
        if (taxCode == null || !TAX_CODE.matcher(taxCode.trim()).matches()) {
            throw new DomainException("VAT_INVALID", "Mã số thuế không hợp lệ");
        }
        if (address == null || address.isBlank()) {
            throw new DomainException("VAT_INVALID", "Thiếu địa chỉ công ty");
        }
        if (email == null || !EMAIL.matcher(email.trim()).matches()) {
            throw new DomainException("VAT_INVALID", "Email nhận hóa đơn không hợp lệ");
        }
        companyName = companyName.trim();
        taxCode = taxCode.trim();
        address = address.trim();
        email = email.trim().toLowerCase();
    }
}
