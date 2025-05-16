import { Module } from "@nestjs/common";

;
import { ShoppingMembersController } from "./controllers/shopping/members/ShoppingMembersController";
import { ShoppingMembersEmailsController } from "./controllers/shopping/members/emails/ShoppingMembersEmailsController";
import { ShoppingSalesController } from "./controllers/shopping/sales/ShoppingSalesController";
import { ShoppingSalesSnapshotsController } from "./controllers/shopping/sales/snapshots/ShoppingSalesSnapshotsController";
import { ShoppingCartsCommoditiesController } from "./controllers/shopping/carts/commodities/ShoppingCartsCommoditiesController";
import { ShoppingCartsController } from "./controllers/shopping/carts/ShoppingCartsController";
import { ShoppingCustomersOrdersController } from "./controllers/shopping/customers/orders/ShoppingCustomersOrdersController";
import { ShoppingOrdersPublishesController } from "./controllers/shopping/orders/publishes/ShoppingOrdersPublishesController";
import { ShoppingCouponsController } from "./controllers/shopping/coupons/ShoppingCouponsController";
import { ShoppingCustomersCoupon_ticketsController } from "./controllers/shopping/customers/coupon-tickets/ShoppingCustomersCoupon_ticketsController";

;
@Module({
    controllers: [
        ShoppingMembersController,
        ShoppingMembersEmailsController,
        ShoppingSalesController,
        ShoppingSalesSnapshotsController,
        ShoppingCartsCommoditiesController,
        ShoppingCartsController,
        ShoppingCustomersOrdersController,
        ShoppingOrdersPublishesController,
        ShoppingCouponsController,
        ShoppingCustomersCoupon_ticketsController
    ]
})
export class MyModule {
}
