/**
 * Store facade — Postgres via lib/sql.ts (same exports as the old JSON store).
 */
export type { StoredOrder } from "@/lib/sql";
export {
  formatPriceLabel,
  slugifyId,
  sqlAppendOrder as appendOrder,
  sqlDeleteOrder as deleteOrder,
  sqlDeleteProduct as deleteProduct,
  sqlDuplicateProduct as duplicateProduct,
  sqlGetAllOrders as readOrders,
  sqlGetAllProducts as readProducts,
  sqlListProductsAdmin as listProductsAdmin,
  sqlGetOrder as getOrderById,
  sqlGetOrderByInvoiceId as getOrderByInvoiceId,
  sqlGetOrderByPaymentRef as getOrderByPaymentRef,
  sqlGetProduct as getProductById,
  sqlPatchProductFlags as patchProductFlags,
  sqlSyncColorVariants as syncColorVariants,
  sqlUpdateOrder as updateOrder,
  sqlUpdatePaymentStatus as updatePaymentStatus,
  sqlUpsertProduct as upsertProduct,
} from "@/lib/sql";
