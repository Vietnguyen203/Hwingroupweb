/**
 * Shared kernel: value object dùng chung (Money, PhoneNumber, Address), base domain event,
 * exception, security, config, audit, rate limit.
 * Module OPEN để mọi module khác dùng được tất cả sub-package.
 */
@ApplicationModule(displayName = "Shared Kernel", type = ApplicationModule.Type.OPEN)
package com.vietnl.hwin.common;

import org.springframework.modulith.ApplicationModule;
