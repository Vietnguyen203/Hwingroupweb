package com.vietnl.hwin.customer.service.model;

import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.customer.entity.CustomerProductStat;
import com.vietnl.hwin.customer.repository.CustomerProductStatRepository;

public record FavoriteProduct(ProductSnapshot product, int totalQuantity, int orderCount) {
}
