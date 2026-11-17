package com.vietnl.hwin.common.web;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/**
 * Kết quả phân trang chuẩn của mọi API danh sách (theo convention ai/):
 * {@code page} bắt đầu từ 1, {@code pageSize} = số phần tử mỗi trang. Tham số request: {@code page}, {@code page_size}.
 */
public record PageResponse<T>(List<T> content, int page, int pageSize, long totalElements, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber() + 1, page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
