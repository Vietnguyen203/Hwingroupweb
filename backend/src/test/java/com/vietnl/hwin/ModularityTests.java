package com.vietnl.hwin;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Kiểm tra ranh giới module (Spring Modulith): không phụ thuộc vòng,
 * không truy cập kiểu nội bộ của module khác.
 */
class ModularityTests {

    private final ApplicationModules modules = ApplicationModules.of(HwinApplication.class);

    @Test
    void verifyModuleBoundaries() {
        modules.verify();
    }

    @Test
    void writeModuleDocumentation() {
        new Documenter(modules).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }
}
