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

  // ── Seller Auth ──────────────────────────────────────────

  const sellerEmail = randomEmail();
  const sellerPassword = randomPassword();
  const sellerHttp = new HttpRunner();

  // 3. Seller signup
  const sellerJoinEndpoint = findEndpoint(routes, {
    pathKeywords: ["join"],
    mustContain: "seller",
    method: "POST",
  });
  if (!sellerJoinEndpoint) {
    results.push(fail(3, "Seller signup", "endpoint not found"));
  } else {
    const res = await http.post(sellerJoinEndpoint.url, {
      email: sellerEmail,
      password: sellerPassword,
      shop_name: "Test Shop",
    });
    results.push(
      res.ok
        ? pass(3, "Seller signup")
        : fail(3, "Seller signup", `status ${res.status}`),
    );
  }

  // 4. Seller login
  const sellerLoginEndpoint = findEndpoint(routes, {
    pathKeywords: ["login"],
    mustContain: "seller",
    method: "POST",
  });
  if (!sellerLoginEndpoint) {
    results.push(fail(4, "Seller login", "endpoint not found"));
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
        results.push(pass(4, "Seller login"));
      } else {
        results.push(fail(4, "Seller login", "no token in response"));
      }
    } else {
      results.push(fail(4, "Seller login", `status ${res.status}`));
    }
  }

  // ── Customer Address ─────────────────────────────────────

  // 5. Add address
  const addressCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["addresses", "address"],
    method: "POST",
  });
  if (!addressCreateEndpoint) {
    results.push(fail(5, "Add address", "endpoint not found"));
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
      results.push(pass(5, "Add address"));
    } else {
      results.push(fail(5, "Add address", `status ${res.status}`));
    }
  }

  // 6. List addresses
  const addressListEndpoint = findEndpoint(routes, {
    pathKeywords: ["addresses", "address"],
    method: "GET",
  });
  if (!addressListEndpoint) {
    results.push(fail(6, "List addresses", "endpoint not found"));
  } else {
    const res = await http.get(addressListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(6, "List addresses")
        : fail(6, "List addresses", `status ${res.status}`),
    );
  }

  // ── Products (Seller) ────────────────────────────────────

  // 7. Create product
  const productCreateEndpoint =
    findEndpoint(routes, {
      pathKeywords: ["products"],
      mustContain: "seller",
      method: "POST",
    }) || findEndpoint(routes, { pathKeywords: ["products"], method: "POST" });
  if (!productCreateEndpoint) {
    results.push(fail(7, "Create product", "endpoint not found"));
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
      results.push(pass(7, "Create product"));
    } else {
      results.push(fail(7, "Create product", `status ${res.status}`));
    }
  }

  // 8. Add variant
  const variantCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["variants", "variant"],
    method: "POST",
  });
  if (!variantCreateEndpoint || !productId) {
    results.push(
      fail(
        8,
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
      results.push(pass(8, "Add variant"));
    } else {
      results.push(fail(8, "Add variant", `status ${res.status}`));
    }
  }

  // 9. List products
  const productListEndpoint = findEndpoint(routes, {
    pathKeywords: ["products"],
    method: "GET",
  });
  if (!productListEndpoint) {
    results.push(fail(9, "List products", "endpoint not found"));
  } else {
    const res = await http.get(productListEndpoint.url, true);
    results.push(
      res.ok
        ? pass(9, "List products")
        : fail(9, "List products", `status ${res.status}`),
    );
  }

  // 10. Get product detail
  if (!productListEndpoint || !productId) {
    results.push(fail(10, "Get product detail", "no productId or endpoint"));
  } else {
    const url = http.resolvePath(productListEndpoint.url, {
      id: productId,
      productId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(10, "Get product detail")
        : fail(10, "Get product detail", `status ${res.status}`),
    );
  }

  // ── Wishlist ─────────────────────────────────────────────

  // 11. Add to wishlist
  const wishlistAddEndpoint = findEndpoint(routes, {
    pathKeywords: ["wishlist"],
    method: "POST",
  });
  if (!wishlistAddEndpoint || !productId) {
    results.push(
      fail(
        11,
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
    if (res.ok) {
      results.push(pass(11, "Add to wishlist"));
    } else {
      results.push(fail(11, "Add to wishlist", `status ${res.status}`));
    }
  }

  // 12. Get wishlist
  const wishlistGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["wishlist"],
    method: "GET",
  });
  if (!wishlistGetEndpoint) {
    results.push(fail(12, "Get wishlist", "endpoint not found"));
  } else {
    const res = await http.get(wishlistGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(12, "Get wishlist")
        : fail(12, "Get wishlist", `status ${res.status}`),
    );
  }

  // ── Cart ─────────────────────────────────────────────────

  // 13. Add to cart
  const cartAddEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "POST",
  });
  if (!cartAddEndpoint) {
    results.push(fail(13, "Add to cart", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = { quantity: 2 };
    if (variantId) body.variant_id = variantId;
    else if (productId) body.product_id = productId;
    const res = await http.post(cartAddEndpoint.url, body, true);
    if (res.ok) {
      cartItemId = res.body?.id || res.body?.data?.id || null;
      results.push(pass(13, "Add to cart"));
    } else {
      results.push(fail(13, "Add to cart", `status ${res.status}`));
    }
  }

  // 14. Get cart
  const cartGetEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "GET",
  });
  if (!cartGetEndpoint) {
    results.push(fail(14, "Get cart", "endpoint not found"));
  } else {
    const res = await http.get(cartGetEndpoint.url, true);
    results.push(
      res.ok
        ? pass(14, "Get cart")
        : fail(14, "Get cart", `status ${res.status}`),
    );
  }

  // 15. Update cart item
  const cartUpdateEndpoint = findEndpoint(routes, {
    pathKeywords: ["cart"],
    method: "PATCH",
  });
  if (!cartUpdateEndpoint || !cartItemId) {
    results.push(
      fail(
        15,
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
        ? pass(15, "Update cart item")
        : fail(15, "Update cart item", `status ${res.status}`),
    );
  }

  // ── Order ────────────────────────────────────────────────

  // 16. Place order
  const orderCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["orders"],
    method: "POST",
  });
  if (!orderCreateEndpoint) {
    results.push(fail(16, "Place order", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = {};
    if (addressId) body.address_id = addressId;
    const res = await http.post(orderCreateEndpoint.url, body, true);
    if (res.ok) {
      orderId = res.body?.id || res.body?.data?.id || null;
      // Try to get first order item ID
      const items =
        res.body?.items || res.body?.data?.items || res.body?.order_items;
      if (Array.isArray(items) && items.length > 0) {
        orderItemId = items[0].id || null;
      }
      results.push(pass(16, "Place order"));
    } else {
      results.push(fail(16, "Place order", `status ${res.status}`));
    }
  }

  // 17. Order history
  const orderListEndpoint = findEndpoint(routes, {
    pathKeywords: ["orders"],
    method: "GET",
  });
  if (!orderListEndpoint) {
    results.push(fail(17, "Order history", "endpoint not found"));
  } else {
    const res = await http.get(orderListEndpoint.url, true);
    // Try to extract orderItemId from list if we don't have it
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
        ? pass(17, "Order history")
        : fail(17, "Order history", `status ${res.status}`),
    );
  }

  // 18. Order detail
  if (!orderListEndpoint || !orderId) {
    results.push(fail(18, "Order detail", "no orderId or endpoint"));
  } else {
    const url = http.resolvePath(orderListEndpoint.url, {
      id: orderId,
      orderId,
    });
    const res = await http.get(url, true);
    results.push(
      res.ok
        ? pass(18, "Order detail")
        : fail(18, "Order detail", `status ${res.status}`),
    );
  }

  // 19. Request cancellation
  const cancelEndpoint = findEndpoint(routes, {
    pathKeywords: ["cancel"],
    method: "POST",
  });
  if (!cancelEndpoint || !orderId || !orderItemId) {
    results.push(
      fail(
        19,
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
        ? pass(19, "Request cancellation")
        : fail(19, "Request cancellation", `status ${res.status}`),
    );
  }

  // 20. Write review
  const reviewCreateEndpoint = findEndpoint(routes, {
    pathKeywords: ["reviews", "review"],
    method: "POST",
  });
  if (!reviewCreateEndpoint) {
    results.push(fail(20, "Write review", "endpoint not found"));
  } else {
    const body: Record<string, unknown> = {
      rating: 5,
      content: "Great product!",
    };
    if (orderItemId) body.order_item_id = orderItemId;
    const res = await http.post(reviewCreateEndpoint.url, body, true);
    results.push(
      res.ok
        ? pass(20, "Write review")
        : fail(20, "Write review", `status ${res.status}`),
    );
  }

  return results;
}
