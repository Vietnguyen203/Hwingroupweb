package com.vietnl.hwin.content.service.model;

import java.util.List;

import com.vietnl.hwin.catalog.service.model.CategorySnapshot;
import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.content.entity.Video;

/** Một video kèm sản phẩm (đã theo thứ tự hiển thị) và danh mục, dựng sẵn để controller chỉ việc chuyển thành response. */
public record VideoView(Video video, List<ProductSnapshot> products, CategorySnapshot category) {
}
