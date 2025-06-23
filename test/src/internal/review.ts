import { TestValidator } from "@nestia/e2e";
import api from "@ORGANIZATION/PROJECT-api";
import { IShoppingCartCommodity } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingCartCommodity";
import { IShoppingCustomer } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingCustomer";
import { IShoppingDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingDelivery";
import { IShoppingOrder }   from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingOrder";
import { IShoppingOrderPublish } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingOrderPublish";
import { IShoppingSale }    from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSale";
import { IShoppingSaleReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSaleReview";
import { IShoppingSeller }  from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingSeller";
import typia from "typia";

/**
 * 리뷰 게시물에 대한 수정을 검증한다.
 *
 * 그런데 쇼핑몰에서 고객이 리뷰 게시물을 작성할 수 있음이라함은, 이미 해당 고객이
 * 쇼핑몰에 회원 가입하고 상품을 구매 및 결제까지 완료한 상태에서, 기어이 판매자가
 * 배송까지 완료한 경우를 뜻한다.
 *
 * 따라서 본 테스트 함수에서는 이들을 모두 진행해야하는고로, 리뷰 게시물을
 * 작성하기에 앞서 다음과 같은 사전작업들을 모두 행해야한다. 제법 긴 프로세스가 
 * 될 것.
 *
 * 1. 판매자가 회원 가입한다
 * 2. 판매자가 상품을 등록한다
 * 3. 고객이 회원 가입한다
 * 4. 고객이 해당 상품을 상세 조회한다
 * 5. 고객이 해당 상품을 장바구니에 담는다
 * 6. 고객이 해당 상품을 구매 신청한다
 * 7. 고객이 해당 상품을 구매 확정하며 결제한다
 * 8. 판매자가 주문을 확인하고 배송 처리한다
 * 9. 고객이 리뷰 게시물을 작성한다
 * 10. 고객이 리뷰 게시물을 수정한다
 * 11. 리뷰 게시물을 재열람하여 수정 여부를 확인한다.
 */
export async function test_api_shopping_sale_review_update(
  connection: api.IConnection,
): Promise<void> {
  // 1. 판매자가 회원 가입한다
  const seller: IShoppingSeller = 
    await api.functional.shoppings.sellers.authenticate.join(
      connection,
      {
        body: {
          email: "john@wrtn.io",
          name: "John Doe",
          nickname: "john-doe",
          mobile: "821011112222",
          password: "1234",
        } satisfies IShoppingSeller.IJoin,
      },
    );
  typia.assert(seller);

  // 2. 판매자가 상품을 등록한다
  const sale: IShoppingSale = 
    await api.functional.shoppings.sellers.sales.create(
      connection,
      {
        body: {
          ...
        } satisfies IShoppingSale.ICreate,
      },
    );
  typia.assert(sale);

  // 3. 고객이 회원 가입한다
  const customer: IShoppingCustomer = 
    await api.functional.shoppings.customers.authenticate.join(
      connection,
      {
        body: {
          email: "anonymous@wrtn.io",
          name: "Jaxtyn",
          nickname: "annonymous",
          mobile: "821033334444",
          password: "1234",
        } satisfies IShoppingCustomer.IJoin,
      },
    );
  typia.assert(customer);
  
  // 4. 고객이 해당 상품을 상세 조회한다
  const saleReloaded: IShoppingSale = 
    await api.functional.shoppings.customers.sales.at(
      connection,
      {
        id: sale.id,
      },
    );
  typia.assert(saleReloaded);
  TestValidator.equals("sale")(sale.id)(saleReloaded.id);

  // 5. 고객이 해당 상품을 장바구니에 담는다
  const commodity: IShoppingCartCommodity = 
    await api.functional.shoppings.customers.carts.commodities.create(
      connection,
      {
        body: {
          sale_id: sale.id,
          stocks: sale.units.map((u) => ({
            unit_id: u.id,
            stock_id: u.stocks[0].id,
            quantity: 1,
          })),
          volume: 1,
        } satisfies IShoppingCartCommodity.ICreate,
      },
    );
  typia.assert(commodity);

  // 6. 고객이 해당 상품을 구매 신청한다
  const order: IShoppingOrder = 
    await api.functional.shoppings.customers.orders.create(
      connection,
      {
        body: {
          goods: [
            {
              commodity_id: commodity.id,
              volume: 1,
            },
          ],
        } satisfies IShoppingOrder.ICreate,
      }
    );

  // 7. 고객이 해당 상품을 구매 확정하며 결제한다
  const publish: IShoppingOrderPublish = 
    await api.functional.shoppings.customers.orders.publish.create(
      connection,
      {
        orderId: order.id,
        body: {
          address: {
            mobile: "821033334444",
            name: "Jaxtyn",
            country: "South Korea",
            province: "Seoul",
            city: "Seoul Seocho-gu",
            department: "Wrtn Apartment",
            possession: "140-1415",
            zip_code: "08273",
          },
          vendor: {
            code: "@payment-vendor-code",
            uid: "@payment-transaction-uid",
          },
        } satisfies IShoppingOrderPublish.ICreate,
      },
    );
  typia.assert(publish);

  // 판매자 계정으로의 전환
  await api.functional.shoppings.sellers.authenticate.login(
    connection,
    {
      body: {
        email: "john@wrtn.io",
        password: "1234",
      } satisfies IShoppingSeller.ILogin,
    },
  );

  // 8.  판매자가 주문을 확인하고 배송 처리한다
  const orderReloaded: IShoppingOrder = 
    await api.functional.shoppings.sellers.orders.at(
      connection,
      {
        id: order.id,
      }
    );
  typia.assert(orderReloaded);
  TestValidator.equals("order")(order.id)(orderReloaded.id);

  const delivery: IShoppingDelivery = 
    await api.functional.shoppings.sellers.deliveries.create(
      connection,
      {
        body: {
          pieces: order.goods.map((g) => 
            g.commodity.stocks.map((s) => ({
              publish_id: publish.id,
              good_id: g.id,
              stock_id: s.id,
              quantity: 1,
            }))).flat(),
          journeys: [
            {
              type: "delivering",
              title: "Delivering",
              description: null,
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            },
          ],
          shippers: [
            {
              company: "Lozen",
              name: "QuickMan",
              mobile: "01055559999",
            }
          ],
        } satisfies IShoppingDelivery.ICreate
      }
    )
  typia.assert(delivery);

  // 고객 계정으로 다시 전환한다
  await api.functional.shoppings.customers.authenticate.login(
    connection,
    {
      body: {
        email: "annonymous@wrtn.io",
        password: "1234",
      } satisfies IShoppingCustomer.ILogin,
    },
  );

  // 9. 고객이 리뷰 게시물을 작성한다
  const review: IShoppingSaleReview = 
    await api.functional.shoppings.customers.sales.reviews.create(
      connection,
      {
        saleId: sale.id,
        body: {
          good_id: order.goods[0].id,
          title: "Some title",
          body: "Some content body",
          format: "md",
          files: [],
          score: 100,
        } satisfies IShoppingSaleReview.ICreate,
      },
    );
  typia.assert(review);

  // 10. 고객이 리뷰 게시물을 수정한다
  const snapshot: IShoppingSaleReview.ISnapshot = 
    await api.functional.shoppings.customers.sales.reviews.update(
      connection,
      {
        saleId: sale.id,
        id: review.id,
        body: {
          title: "Some new title",
          body: "Some new content body",
        } satisfies IShoppingSaleReview.IUpdate,
      },
    );
  typia.assert(snapshot);

  // 11. 리뷰 게시물을 재열람하여 수정 여부를 확인한다
  const read: IShoppingSaleReview = 
    await api.functional.shoppings.customers.sales.reviews.at(
      connection,
      {
        saleId: sale.id,
        id: review.id,
      },
    );
  typia.assert(read);
  TestValidator.equals("snapshots")(read.snapshots)([
    ...review.snapshots,
    snapshot,
  ]);
}