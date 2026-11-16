package com.vietnl.hwin;

import org.springframework.boot.SpringApplication;

public class TestHwinApplication {

    public static void main(String[] args) {
        SpringApplication.from(HwinApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
