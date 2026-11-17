package com.vietnl.hwin.catalog.api.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.vietnl.hwin.catalog.api.responses.AdminProductResponse;
import com.vietnl.hwin.catalog.api.responses.CategoryResponse;
import com.vietnl.hwin.catalog.api.responses.FoodInfoDto;
import com.vietnl.hwin.catalog.api.responses.ProductCardResponse;
import com.vietnl.hwin.catalog.api.responses.ProductDetailResponse;
import com.vietnl.hwin.catalog.api.requests.ProductUpsertRequest;
import com.vietnl.hwin.catalog.entity.Category;
import com.vietnl.hwin.catalog.entity.FoodInfo;
import com.vietnl.hwin.catalog.entity.Product;
import com.vietnl.hwin.catalog.entity.ProductDetails;
import com.vietnl.hwin.catalog.entity.ProductImage;
import com.vietnl.hwin.common.domain.Money;

/** Map entity catalog <-> DTO. */
@Mapper
public interface CatalogMapper {

    CategoryResponse toResponse(Category category);

    @Mapping(target = "imageUrl", expression = "java(product.mainImageUrl())")
    @Mapping(target = "discountPercent", expression = "java(product.discountPercent())")
    @Mapping(target = "inStock", expression = "java(product.isInStock())")
    ProductCardResponse toCard(Product product);

    @Mapping(target = "discountPercent", expression = "java(product.discountPercent())")
    @Mapping(target = "inStock", expression = "java(product.isInStock())")
    @Mapping(target = "category", source = "category")
    @Mapping(target = "id", source = "product.id")
    @Mapping(target = "name", source = "product.name")
    @Mapping(target = "slug", source = "product.slug")
    ProductDetailResponse toDetail(Product product, CategoryResponse category);

    AdminProductResponse toAdmin(Product product);

    FoodInfoDto toDto(FoodInfo foodInfo);

    FoodInfo toFoodInfo(FoodInfoDto dto);

    default ProductDetails toDetails(ProductUpsertRequest r) {
        return new ProductDetails(r.getCategoryId(), r.getName(), r.getSlug(), Money.of(r.getPrice()),
                r.getCompareAtPrice() == null ? null : Money.of(r.getCompareAtPrice()), r.getShortDescription(),
                r.getDescription(), r.getUnit(), toFoodInfo(r.getFoodInfo()));
    }

    default Long moneyToLong(Money money) {
        return money == null ? null : money.amount();
    }

    default List<String> imageUrls(List<ProductImage> images) {
        return images.stream().map(ProductImage::getUrl).toList();
    }
}
