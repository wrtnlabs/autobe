import { HttpRunner } from "./http-runner";
import {
  type ScenarioResult,
  fail,
  pass,
  randomEmail,
  randomPassword,
} from "./scenario-helpers";
import { type RouteInfo, findEndpoint } from "./url-resolver";

export async function runShoppingScenarios(
  routes: RouteInfo[],
  http: HttpRunner,
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];

  let productId: string | null = null;
  let variantId: string | null = null;
  let cartItemId: string | null = null;
  let orderId: string | null = null;
  let orderItemId: string | null = null;
  let addressId: string | null = null;
  let reviewId: string | null = null;

  // ── Customer Auth ────────────────────────────────────────

  const customerEmail = randomEmail();
  const customerPassword = randomPassword();

  // 1. Customer signup
  const customerJoinEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["join"],
      mustContain: "customer",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["join"], method: "POST" });
  if (!customerJoinEndpoint) {
    results.push(fail(1, "Customer signup", "endpoint not found"));
  } else {
    const res = await http.post(customerJoinEndpoint.url, {
      email: customerEmail,
      password: customerPassword,
      display_name: "Test Customer",
    });
    results.push(
      res.ok
        ? pass(1, "Customer signup")
        : fail(1, "Customer signup", `status ${res.status}`),
    );
  }

  // 2. Customer login
  const customerLoginEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["login"],
      mustContain: "customer",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["login"], method: "POST" });
  if (!customerLoginEndpoint) {
    results.push(fail(2, "Customer login", "endpoint not found"));
  } else {
    const res = await http.post(customerLoginEndpoint.url, {
      email: customerEmail,
      password: customerPassword,
    });
    if (res.ok) {
      const token =
        res.body?.token?.access || res.body?.access_token || res.body?.token;
      const tokenStr =
        typeof token === "string" ? token : token?.access || token;
      if (tokenStr) {
        http.setToken(tokenStr);
        results.push(pass(2, "Customer login"));
      } else {
        results.push(fail(2, "Customer login", "no token in response"));
      }
    } else {
      results.push(fail(2, "Customer login", `status ${res.status}`));
    }
  }

  // 3. Get customer profile
  const customerProfileGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["profile"],
    mustContain: "customer",
    method: "GET",
  });
  if (!customerProfileGetEndpoint) {
    results.push(fail(3, "Get customer profile", "endpoint not found"));
  } else {
    const res = await http.get(customerProfileGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(3, "Get customer profile")
        : fail(3, "Get customer profile", `status ${res.status}`),
    );
  }

  // 4. Update customer profile
  const customerProfileEndpoint = findEndpoint(routes, {
    pathKeywords: ["profile"],
    mustContain: "customer",
    method: "PATCH",
  });
  if (!customerProfileEndpoint) {
    results.push(fail(4, "Update customer profile", "endpoint not found"));
  } else {
    const res = await http.patch(
      customerProfileEndpoint.url,
      { display_name: "Updated Customer" },
      true,
    );
    results.push(
      res.ok
        ? pass(4, "Update customer profile")
        : fail(4, "Update customer profile", `status ${res.status}`),
    );
  }

  // ── Seller Auth ──────────────────────────────────────────

  const sellerEmail = randomEmail();
  const sellerPassword = randomPassword();
  const sellerHttp = new HttpRunner();

  // 5. Seller signup
  const sellerJoinEndpoint = findEndpoint(routes, {
    pathKeywords: ["join"],
    mustContain: "seller",
    method: "POST",
  });
  if (!sellerJoinEndpoint) {
    results.push(fail(5, "Seller signup", "endpoint not found"));
  } else {
    const res = await http.post(sellerJoinEndpoint.url, {
      email: sellerEmail,
      password: sellerPassword,
      shop_name: "Test Shop",
    });
    results.push(
      res.ok
        ? pass(5, "Seller signup")
        : fail(5, "Seller signup", `status ${res.status}`),
    );
  }

  // 6. Seller login
  const sellerLoginEndpoint = findEndpoint(routes, {
    pathKeywords: ["login"],
    mustContain: "seller",
    method: "POST",
  });
  if (!sellerLoginEndpoint) {
    results.push(fail(6, "Seller login", "endpoint not found"));
  } else {
    const res = await http.post(sellerLoginEndpoint.url, {
      email: sellerEmail,
      password: sellerPassword,
    });
    if (res.ok) {
      const token =
        res.body?.token?.access || res.body?.access_token || res.body?.token;
      const tokenStr =
        typeof token === "string" ? token : token?.access || token;
      if (tokenStr) {
        sellerHttp.setToken(tokenStr);
        results.push(pass(6, "Seller login"));
      } else {
        results.push(fail(6, "Seller login", "no token in response"));
      }
    } else {
      results.push(fail(6, "Seller login", `status ${res.status}`));
    }
  }

  // ── Customer Address ─────────────────────────────────────

  // 7. Add address
  const addressCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["addresses", "address"],
    method: "POST",
  });
  if (!addressCreateEndpoint) {
    results.push(fail(7, "Add address", "endpoint not found"));
  } else {
    const res = await http.post(
      addressCreateEndpoint.url,
      {
        recipient_name: "Test User",
        phone_number: "010-1234-5678",
        street: "123 Test St",
        city: "Seoul",
        state: "Seoul",
        postal_code: "12345",
        country: "KR",
        is_default: true,
      },
      true,
    );
    if (res.ok) {
      addressId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(7, "Add address"));
    } else {
      results.push(fail(7, "Add address", `status ${res.status}`));
    }
  }

  // 8. List addresses
  const addressListEndpoint = findEndpoint(routes, {
    pathKeywords: ["addresses", "address"],
    method: "GET",
  });
  if (!addressListEndpoint) {
    results.push(fail(8, "List addresses", "endpoint not found"));
  } else {
    const res = await http.get(addressListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(8, "List addresses")
        : fail(8, "List addresses", `status ${res.status}`),
    );
  }

  // 9. Edit address
  const addressEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["addresses", "address"],
    method: "PATCH",
  });
  if (!addressEditEndpoint || !addressId) {
    results.push(
      fail(
        9,
        "Edit address",
        addressEditEndpoint ? "no addressId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(addressEditEndpoint.url, {
      id: addressId,
      addressId,
    });
    const res = await http.patch(url, { city: "Busan" }, true);
    results.push(
      res.ok
        ? pass(9, "Edit address")
        : fail(9, "Edit address", `status ${res.status}`),
    );
  }

  // 10. Delete address
  const addressDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["addresses", "address"],
    method: "DELETE",
  });
  // Add another address first so we can delete it
  let deleteAddressId: string | null = null;
  if (addressCreateEndpoint) {
    const res2 = await http.post(
      addressCreateEndpoint.url,
      {
        recipient_name: "Delete Test",
        phone_number: "010-0000-0000",
        street: "456 Delete St",
        city: "Incheon",
        postal_code: "99999",
        country: "KR",
      },
      true,
    );
    deleteAddressId = res2.body?.id || res2.body?.data?.id || null;
  }
  if (!addressDeleteEndpoint || !deleteAddressId) {
    results.push(
      fail(
        10,
        "Delete address",
        addressDeleteEndpoint ? "no addressId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(addressDeleteEndpoint.url, {
      id: deleteAddressId,
      addressId: deleteAddressId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(10, "Delete address")
        : fail(10, "Delete address", `status ${res.status}`),
    );
  }

  // ── Categories ─────────────────────────────────────────

  // 11. List categories
  const categoryListEndpoint = findEndpoint(routes, {
    pathKeywords: ["categories", "category"],
    method: "GET",
  });
  if (!categoryListEndpoint) {
    results.push(fail(11, "List categories", "endpoint not found"));
  } else {
    const res = await http.get(categoryListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(11, "List categories")
        : fail(11, "List categories", `status ${res.status}`),
    );
  }

  // ── Products (Seller) ────────────────────────────────────

  // 12. Create product
  const productCreateEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["products"],
      mustContain: "seller",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["products"], method: "POST" });
  if (!productCreateEndpoint) {
    results.push(fail(12, "Create product", "endpoint not found"));
  } else {
    const res = await sellerHttp.post(
      productCreateEndpoint.url,
      {
        name: "Golden Test Product",
        description: "A test product",
        base_price: 10000,
        category_id: null,
      },
      true,
    );
    if (res.ok) {
      productId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(12, "Create product"));
    } else {
      results.push(fail(12, "Create product", `status ${res.status}`));
    }
  }

  // 13. Edit product
  const productEditEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["products"],
      mustContain: "seller",
      method: "PATCH",
    }) || findEndpoint(routes, { pathKeywords: ["products"], method: "PATCH" });
  if (!productEditEndpoint || !productId) {
    results.push(
      fail(
        13,
        "Edit product",
        productEditEndpoint ? "no productId" : "endpoint not found",
      ),
    );
  } else {
    const url = sellerHttp.resolvePath(productEditEndpoint.url, {
      id: productId,
      productId,
    });
    const res = await sellerHttp.patch(
      url,
      { name: "Updated Product Name" },
      true,
    );
    results.push(
      res.ok
        ? pass(13, "Edit product")
        : fail(13, "Edit product", `status ${res.status}`),
    );
  }

  // 14. Add variant
  const variantCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["variants", "variant"],
    method: "POST",
  });
  if (!variantCreateEndpoint || !productId) {
    results.push(
      fail(
        14,
        "Add variant",
        variantCreateEndpoint ? "no productId" : "endpoint not found",
      ),
    );
  } else {
    const url = sellerHttp.resolvePath(variantCreateEndpoint.url, {
      id: productId,
      productId,
    });
    const res = await sellerHttp.post(
      url,
      {
        sku: `SKU-${Date.now()}`,
        price: 12000,
      },
      true,
    );
    if (res.ok) {
      variantId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(14, "Add variant"));
    } else {
      results.push(fail(14, "Add variant", `status ${res.status}`));
    }
  }

  // 15. Edit variant
  const variantEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["variants", "variant"],
    method: "PATCH",
  });
  if (!variantEditEndpoint || !productId || !variantId) {
    results.push(
      fail(
        15,
        "Edit variant",
        !variantEditEndpoint ? "endpoint not found" : "no IDs",
      ),
    );
  } else {
    const url = sellerHttp.resolvePath(variantEditEndpoint.url, {
      id: productId,
      productId,
      variantId,
    });
    const res = await sellerHttp.patch(url, { price: 11000 }, true);
    results.push(
      res.ok
        ? pass(15, "Edit variant")
        : fail(15, "Edit variant", `status ${res.status}`),
    );
  }

  // 16. Adjust inventory
  const inventoryEndpoint = findEndpoint(routes, {
    pathKeywords: ["inventory"],
    method: "POST",
  });
  if (!inventoryEndpoint || !productId || !variantId) {
    results.push(
      fail(
        16,
        "Adjust inventory",
        !inventoryEndpoint ? "endpoint not found" : "no IDs",
      ),
    );
  } else {
    const url = sellerHttp.resolvePath(inventoryEndpoint.url, {
      id: productId,
      productId,
      variantId,
    });
    const res = await sellerHttp.post(url, { quantity: 100 }, true);
    results.push(
      res.ok
        ? pass(16, "Adjust inventory")
        : fail(16, "Adjust inventory", `status ${res.status}`),
    );
  }

  // 17. List products (customer view)
  const productListEndpoint = findEndpoint(routes, {
    pathKeywords: ["products"],
    method: "GET",
  });
  if (!productListEndpoint) {
    results.push(fail(17, "List products", "endpoint not found"));
  } else {
    const res = await http.get(productListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(17, "List products")
        : fail(17, "List products", `status ${res.status}`),
    );
  }

  // 18. Get product detail
  if (!productListEndpoint || !productId) {
    results.push(fail(18, "Get product detail", "no productId or endpoint"));
  } else {
    const url = http.resolvePath(productListEndpoint.url, {
      id: productId,
      productId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(18, "Get product detail")
        : fail(18, "Get product detail", `status ${res.status}`),
    );
  }

  // ── Wishlist ─────────────────────────────────────────────

  // 19. Add to wishlist
  const wishlistAddEndpoint = findEndpoint(routes, {
    pathKeywords: ["wishlist"],
    method: "POST",
  });
  if (!wishlistAddEndpoint || !productId) {
    results.push(
      fail(
        19,
        "Add to wishlist",
        wishlistAddEndpoint ? "no productId" : "endpoint not found",
      ),
    );
  } else {
    const res = await http.post(
      wishlistAddEndpoint.url,
      { product_id: productId },
      true,
    );
    results.push(
      res.ok
        ? pass(19, "Add to wishlist")
        : fail(19, "Add to wishlist", `status ${res.status}`),
    );
  }

  // 20. Get wishlist
  const wishlistGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["wishlist"],
    method: "GET",
  });
  if (!wishlistGetEndpoint) {
    results.push(fail(20, "Get wishlist", "endpoint not found"));
  } else {
    const res = await http.get(wishlistGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(20, "Get wishlist")
        : fail(20, "Get wishlist", `status ${res.status}`),
    );
  }

  // 21. Remove from wishlist
  const wishlistRemoveEndpoint = findEndpoint(routes, {
    pathKeywords: ["wishlist"],
    method: "DELETE",
  });
  if (!wishlistRemoveEndpoint || !productId) {
    results.push(
      fail(
        21,
        "Remove from wishlist",
        wishlistRemoveEndpoint ? "no productId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(wishlistRemoveEndpoint.url, {
      id: productId,
      productId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(21, "Remove from wishlist")
        : fail(21, "Remove from wishlist", `status ${res.status}`),
    );
  }

  // ── Cart ─────────────────────────────────────────────────

  // 22. Add to cart
  const cartAddEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "POST",
  });
  if (!cartAddEndpoint) {
    results.push(fail(22, "Add to cart", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = { quantity: 2 };
    if (variantId) body.variant_id = variantId;
    else if (productId) body.product_id = productId;
    const res = await http.post(cartAddEndpoint.url, body, true);
    if (res.ok) {
      cartItemId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(22, "Add to cart"));
    } else {
      results.push(fail(22, "Add to cart", `status ${res.status}`));
    }
  }

  // 23. Get cart
  const cartGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "GET",
  });
  if (!cartGetEndpoint) {
    results.push(fail(23, "Get cart", "endpoint not found"));
  } else {
    const res = await http.get(cartGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(23, "Get cart")
        : fail(23, "Get cart", `status ${res.status}`),
    );
  }

  // 24. Update cart item
  const cartUpdateEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "PATCH",
  });
  if (!cartUpdateEndpoint || !cartItemId) {
    results.push(
      fail(
        24,
        "Update cart item",
        cartUpdateEndpoint ? "no cartItemId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(cartUpdateEndpoint.url, {
      id: cartItemId,
      cartItemId,
    });
    const res = await http.patch(url, { quantity: 3 }, true);
    results.push(
      res.ok
        ? pass(24, "Update cart item")
        : fail(24, "Update cart item", `status ${res.status}`),
    );
  }

  // 25. Remove from cart
  const cartRemoveEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "DELETE",
  });
  // Add another cart item to delete
  let deleteCartItemId: string | null = null;
  if (cartAddEndpoint) {
    const body: Record<string, unknown> = { quantity: 1 };
    if (variantId) body.variant_id = variantId;
    else if (productId) body.product_id = productId;
    const addRes = await http.post(cartAddEndpoint.url, body, true);
    deleteCartItemId = addRes.body?.id || addRes.body?.data?.id || null;
  }
  if (!cartRemoveEndpoint || !deleteCartItemId) {
    results.push(
      fail(
        25,
        "Remove from cart",
        cartRemoveEndpoint ? "no cartItemId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(cartRemoveEndpoint.url, {
      id: deleteCartItemId,
      cartItemId: deleteCartItemId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(25, "Remove from cart")
        : fail(25, "Remove from cart", `status ${res.status}`),
    );
  }

  // ── Order ────────────────────────────────────────────────

  // 26. Place order
  const orderCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["orders"],
    method: "POST",
  });
  if (!orderCreateEndpoint) {
    results.push(fail(26, "Place order", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = {};
    if (addressId) body.address_id = addressId;
    const res = await http.post(orderCreateEndpoint.url, body, true);
    if (res.ok) {
      orderId = res.body?.id || res.body?.data?.id || null;
      const items =
        res.body?.items || res.body?.data?.items || res.body?.order_items;
      if (Array.isArray(items) && items.length > 0) {
        orderItemId = items[0].id || null;
      }
      results.push(pass(26, "Place order"));
    } else {
      results.push(fail(26, "Place order", `status ${res.status}`));
    }
  }

  // 27. Order history
  const orderListEndpoint = findEndpoint(routes, {
    pathKeywords: ["orders"],
    method: "GET",
  });
  if (!orderListEndpoint) {
    results.push(fail(27, "Order history", "endpoint not found"));
  } else {
    const res = await http.get(orderListEndpoint.url, true);
    if (res.ok && !orderItemId) {
      const orders = Array.isArray(res.body) ? res.body : res.body?.data;
      if (Array.isArray(orders) && orders.length > 0) {
        const items = orders[0].items || orders[0].order_items;
        if (Array.isArray(items) && items.length > 0) {
          orderItemId = items[0].id || null;
        }
      }
    }
    results.push(
      res.ok
        ? pass(27, "Order history")
        : fail(27, "Order history", `status ${res.status}`),
    );
  }

  // 28. Order detail
  if (!orderListEndpoint || !orderId) {
    results.push(fail(28, "Order detail", "no orderId or endpoint"));
  } else {
    const url = http.resolvePath(orderListEndpoint.url, {
      id: orderId,
      orderId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(28, "Order detail")
        : fail(28, "Order detail", `status ${res.status}`),
    );
  }

  // 29. Request cancellation
  const cancelEndpoint = findEndpoint(routes, {
    pathKeywords: ["cancel"],
    method: "POST",
  });
  if (!cancelEndpoint || !orderId || !orderItemId) {
    results.push(
      fail(
        29,
        "Request cancellation",
        !cancelEndpoint ? "endpoint not found" : "no order IDs",
      ),
    );
  } else {
    const url = http.resolvePath(cancelEndpoint.url, {
      id: orderId,
      orderId,
      itemId: orderItemId,
      orderItemId,
    });
    const res = await http.post(url, { reason: "Changed my mind" }, true);
    results.push(
      res.ok
        ? pass(29, "Request cancellation")
        : fail(29, "Request cancellation", `status ${res.status}`),
    );
  }

  // 30. Request refund
  const refundEndpoint = findEndpoint(routes, {
    pathKeywords: ["refund"],
    method: "POST",
  });
  if (!refundEndpoint || !orderId || !orderItemId) {
    results.push(
      fail(
        30,
        "Request refund",
        !refundEndpoint ? "endpoint not found" : "no order IDs",
      ),
    );
  } else {
    const url = http.resolvePath(refundEndpoint.url, {
      id: orderId,
      orderId,
      itemId: orderItemId,
      orderItemId,
    });
    const res = await http.post(url, { reason: "Defective item" }, true);
    results.push(
      res.ok
        ? pass(30, "Request refund")
        : fail(30, "Request refund", `status ${res.status}`),
    );
  }

  // ── Shipment ─────────────────────────────────────────────

  // 31. Create shipment (seller)
  const shipmentCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["shipment"],
    method: "POST",
  });
  if (!shipmentCreateEndpoint || !orderId || !orderItemId) {
    results.push(
      fail(
        31,
        "Create shipment",
        !shipmentCreateEndpoint ? "endpoint not found" : "no order IDs",
      ),
    );
  } else {
    const res = await sellerHttp.post(
      shipmentCreateEndpoint.url,
      {
        order_id: orderId,
        order_item_id: orderItemId,
        tracking_number: `TRACK-${Date.now()}`,
        carrier: "Test Carrier",
      },
      true,
    );
    results.push(
      res.ok
        ? pass(31, "Create shipment")
        : fail(31, "Create shipment", `status ${res.status}`),
    );
  }

  // 32. Confirm delivery (customer)
  const deliveryEndpoint = findEndpoint(routes, {
    pathKeywords: ["deliver"],
    method: "PATCH",
  });
  if (!deliveryEndpoint) {
    results.push(fail(32, "Confirm delivery", "endpoint not found"));
  } else {
    // Try with a placeholder; may fail if no shipment exists
    const url = http.resolvePath(deliveryEndpoint.url, {
      id: orderId || "unknown",
      shipmentId: "unknown",
    });
    const res = await http.patch(url, {}, true);
    results.push(
      res.ok
        ? pass(32, "Confirm delivery")
        : fail(32, "Confirm delivery", `status ${res.status}`),
    );
  }

  // ── Reviews ──────────────────────────────────────────────

  // 33. Write review
  const reviewCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["reviews", "review"],
    method: "POST",
  });
  if (!reviewCreateEndpoint) {
    results.push(fail(33, "Write review", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = {
      rating: 5,
      content: "Great product!",
    };
    if (orderItemId) body.order_item_id = orderItemId;
    if (productId) body.product_id = productId;
    const res = await http.post(reviewCreateEndpoint.url, body, true);
    if (res.ok) {
      reviewId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(33, "Write review"));
    } else {
      results.push(fail(33, "Write review", `status ${res.status}`));
    }
  }

  // 34. Edit review
  const reviewEditEndpoint = findEndpoint(routes, {
    pathKeywords: ["reviews", "review"],
    method: "PATCH",
  });
  if (!reviewEditEndpoint || !reviewId) {
    results.push(
      fail(
        34,
        "Edit review",
        reviewEditEndpoint ? "no reviewId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(reviewEditEndpoint.url, {
      id: reviewId,
      reviewId,
    });
    const res = await http.patch(
      url,
      { rating: 4, content: "Updated review" },
      true,
    );
    results.push(
      res.ok
        ? pass(34, "Edit review")
        : fail(34, "Edit review", `status ${res.status}`),
    );
  }

  // 35. Delete review
  const reviewDeleteEndpoint = findEndpoint(routes, {
    pathKeywords: ["reviews", "review"],
    method: "DELETE",
  });
  if (!reviewDeleteEndpoint || !reviewId) {
    results.push(
      fail(
        35,
        "Delete review",
        reviewDeleteEndpoint ? "no reviewId" : "endpoint not found",
      ),
    );
  } else {
    const url = http.resolvePath(reviewDeleteEndpoint.url, {
      id: reviewId,
      reviewId,
    });
    const res = await http.delete(url, true);
    results.push(
      res.ok
        ? pass(35, "Delete review")
        : fail(35, "Delete review", `status ${res.status}`),
    );
  }

  // ── Seller Product Cleanup ───────────────────────────────

  // 36. Delete product (seller)
  const productDeleteEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["products"],
      mustContain: "seller",
      method: "DELETE",
    }) ||
    findEndpoint(routes, { pathKeywords: ["products"], method: "DELETE" });
  if (!productDeleteEndpoint || !productId) {
    results.push(
      fail(
        36,
        "Delete product",
        productDeleteEndpoint ? "no productId" : "endpoint not found",
      ),
    );
  } else {
    const url = sellerHttp.resolvePath(productDeleteEndpoint.url, {
      id: productId,
      productId,
    });
    const res = await sellerHttp.delete(url, true);
    results.push(
      res.ok
        ? pass(36, "Delete product")
        : fail(36, "Delete product", `status ${res.status}`),
    );
  }

  return results;
}
