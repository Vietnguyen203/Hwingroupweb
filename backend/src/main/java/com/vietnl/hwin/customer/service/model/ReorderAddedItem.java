package com.vietnl.hwin.customer.service.model;

import com.vietnl.hwin.customer.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.vietnl.hwin.catalog.service.ProductQueryService;
import com.vietnl.hwin.catalog.service.model.ProductSnapshot;
import com.vietnl.hwin.ordering.service.CartService;
import com.vietnl.hwin.ordering.service.OrderQueryService;

public record ReorderAddedItem(UUID productId, String name, int quantity) {
}
