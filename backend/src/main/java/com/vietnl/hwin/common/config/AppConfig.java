package com.vietnl.hwin.common.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

/**
 * Cấu hình chung: async (cho @ApplicationModuleListener), scheduling (job), Clock, OpenAPI.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AppConfig {

    /** Inject Clock để test được logic theo thời gian. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    OpenAPI hwinOpenApi() {
        return new OpenAPI().info(new Info()
                .title("HWIN API")
                .description("API website bán thực phẩm chế biến + chương trình cộng tác viên")
                .version("0.1.0"));
    }
}
