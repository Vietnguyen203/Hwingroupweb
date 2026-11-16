package com.vietnl.hwin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class HwinApplication {

    public static void main(String[] args) {
        SpringApplication.run(HwinApplication.class, args);
    }

}
