package com.vietnl.hwin.ordering.service.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

public record BankQrProperties(String bankBin, String accountNo, String accountName) {
}
