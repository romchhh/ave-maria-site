"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import ProductCard from "@/components/catalog/ProductCard";
import FreeShippingBar from "@/components/shared/FreeShippingBar";
import { useBasket } from "@/lib/BasketProvider";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { NovaWarehouseKind } from "@/lib/novaPoshtaShared";
import { sitePath } from "@/lib/i18n/paths";
import { PAYMENT_TYPE_LABELS } from "@/lib/paymentTypeLabels";
import type { DeliveryMethod, PaymentType, Product } from "@/lib/types";
import { SITE_PICKUP_ADDRESS } from "@/lib/siteContact";
import { useNovaPoshta } from "@/hooks/useNovaPoshta";


const METHODS: DeliveryMethod[] = [
  "nova_poshta_branch",
  "nova_poshta_locker",
  "nova_poshta_courier",
  "pickup",
  "international",
];

function isNovaMethod(method: DeliveryMethod): boolean {
  return method.startsWith("nova_poshta");
}

function warehouseKindFor(
  method: DeliveryMethod
): NovaWarehouseKind | null {
  if (method === "nova_poshta_branch") return "branch";
  if (method === "nova_poshta_locker") return "locker";
  return null;
}

function AlsoLike({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (!products.length) return null;
  return (
    <section className="checkout-also" aria-labelledby="checkout-also-title">
      <div className="section-head">
        <h2 id="checkout-also-title">{title}</h2>
      </div>
      <div className="home-products-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function FinalCheckoutInner({
  suggested,
  prepayAmountUah,
}: {
  suggested: Product[];
  prepayAmountUah: number;
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { items, total, updateQuantity, removeItem, clearBasket } = useBasket();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("nova_poshta_branch");
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [cityListOpen, setCityListOpen] = useState(false);
  const [warehouseListOpen, setWarehouseListOpen] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [paidOnline, setPaidOnline] = useState(false);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const [orderReceipt, setOrderReceipt] = useState<{
    orderId: string;
    customerName: string;
    phone: string;
    email?: string;
    deliveryMethod: DeliveryMethod;
    paymentType: PaymentType;
    city: string;
    address: string;
    total: number;
    items: {
      id: string;
      name: string;
      size: string;
      quantity: number;
      priceNum: number;
      image: string;
    }[];
  } | null>(null);

  // Return from Mono payment status page
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "failed") {
      setFieldError(t.checkout.paymentFailed);
      return;
    }
    if (payment !== "success") return;

    const invoiceId = searchParams.get("invoiceId") || "";
    let cancelled = false;

    (async () => {
      try {
        if (invoiceId) {
          const res = await fetch(
            `/api/orders/invoice/${encodeURIComponent(invoiceId)}`
          );
          if (res.ok) {
            const data = (await res.json()) as {
              orderId?: string;
              payment_status?: string;
              payment_type?: PaymentType;
              total?: number;
            };
            if (cancelled) return;
            if (data.payment_status === "paid") {
              setPaidOnline(true);
              setOrderReceipt({
                orderId: data.orderId || invoiceId,
                customerName: "",
                phone: "",
                deliveryMethod: "nova_poshta_branch",
                paymentType:
                  data.payment_type === "prepay" ||
                  data.payment_type === "postpay" ||
                  data.payment_type === "full"
                    ? data.payment_type
                    : "full",
                city: "",
                address: "",
                total: Number(data.total) || 0,
                items: [],
              });
              clearBasket();
              setDone(true);
              return;
            }
          }
        }
      } catch {
        /* fall through */
      }
      if (cancelled) return;
      setPaidOnline(true);
      clearBasket();
      setDone(true);
      setOrderReceipt({
        orderId: invoiceId || "—",
        customerName: "",
        phone: "",
        deliveryMethod: "nova_poshta_branch",
        paymentType: "full",
        city: "",
        address: "",
        total: 0,
        items: [],
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, clearBasket, t.checkout.paymentFailed]);

  const npEnabled = isNovaMethod(deliveryMethod);
  const warehouseKind = warehouseKindFor(deliveryMethod);
  const needsWarehouse = warehouseKind != null;
  const needsFreeAddress =
    deliveryMethod === "nova_poshta_courier" ||
    deliveryMethod === "international";

  const {
    filteredCities,
    filteredWarehouses,
    loadingCities,
    loadingWarehouses,
  } = useNovaPoshta({
    enabled: npEnabled,
    city,
    address,
    warehouseKind,
  });

  const citySuggestions = useMemo(
    () => filteredCities.slice(0, 12),
    [filteredCities]
  );
  const warehouseSuggestions = useMemo(
    () => filteredWarehouses.slice(0, 12),
    [filteredWarehouses]
  );

  const alsoLike = useMemo(() => {
    const inCart = new Set(items.map((i) => i.id));
    return suggested.filter((p) => !inCart.has(p.id)).slice(0, 8);
  }, [suggested, items]);

  useLayoutEffect(() => {
    if (!done || !orderReceipt) return;
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
    scrollTop();
    requestAnimationFrame(scrollTop);
    successHeadingRef.current?.focus({ preventScroll: true });
  }, [done, orderReceipt]);

  useEffect(() => {
    if (deliveryMethod === "pickup") {
      setCity("Київ");
      setAddress(SITE_PICKUP_ADDRESS);
      setCityListOpen(false);
      setWarehouseListOpen(false);
      return;
    }
    setCity("");
    setAddress("");
    setCityListOpen(false);
    setWarehouseListOpen(false);
  }, [deliveryMethod]);

  function selectCity(value: string) {
    setCity(value);
    setCityListOpen(false);
    if (needsWarehouse) {
      setAddress("");
      setWarehouseListOpen(false);
    }
  }

  function selectWarehouse(value: string) {
    setAddress(value);
    setWarehouseListOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);

    if (!items.length) {
      setFieldError(t.checkout.errors.empty);
      return;
    }
    if (customerName.trim().length < 2) {
      setFieldError(t.checkout.errors.name);
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setFieldError(t.checkout.errors.phone);
      return;
    }
    if (!city.trim()) {
      setFieldError(t.checkout.errors.city);
      return;
    }
    if (!address.trim()) {
      setFieldError(t.checkout.errors.address);
      return;
    }

    setLoading(true);
    try {
      const snapshotItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        priceNum: item.priceNum,
        image: item.image,
      }));
      const snapshotTotal = total;
      const snapshotName = customerName.trim();
      const snapshotPhone = phone.trim();
      const snapshotEmail = email.trim() || undefined;
      const snapshotCity = city.trim();
      const snapshotAddress = address.trim();
      const snapshotMethod = deliveryMethod;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: snapshotName,
          phone: snapshotPhone,
          email: snapshotEmail,
          deliveryMethod: snapshotMethod,
          paymentType,
          city: snapshotCity,
          address: snapshotAddress,
          comment: comment.trim() || undefined,
          locale: "uk",
          items: snapshotItems.map((item) => ({
            productId: item.id,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            priceNum: item.priceNum,
          })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        orderId?: string;
        invoiceUrl?: string;
        invoiceId?: string;
        paymentRef?: string;
        error?: string;
      };

      if (!res.ok) {
        setFieldError(
          typeof data.error === "string" && data.error.length < 220
            ? data.error
            : t.checkout.errors.generic
        );
        return;
      }

      // Redirect to Monobank checkout
      if (data.invoiceUrl) {
        try {
          if (data.invoiceId) {
            localStorage.setItem("currentInvoiceId", data.invoiceId);
          }
          if (data.paymentRef) {
            localStorage.setItem("currentPaymentRef", data.paymentRef);
          }
        } catch {
          /* ignore */
        }
        window.location.href = data.invoiceUrl;
        return;
      }

      setPaidOnline(false);
      setOrderReceipt({
        orderId: data.orderId || `AM-${Date.now().toString(36).toUpperCase()}`,
        customerName: snapshotName,
        phone: snapshotPhone,
        email: snapshotEmail,
        deliveryMethod: snapshotMethod,
        paymentType,
        city: snapshotCity,
        address: snapshotAddress,
        total: snapshotTotal,
        items: snapshotItems,
      });
      clearBasket();
      setDone(true);
    } catch {
      setFieldError(t.checkout.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  if (done && orderReceipt) {
    const successLead = paidOnline
      ? t.checkout.successTextPaid
      : orderReceipt.paymentType === "postpay"
        ? t.checkout.successTextPostpay
        : t.checkout.successText;

    return (
      <section className="checkout-page">
        <div className="checkout-success">
          <div className="checkout-success-mark" aria-hidden>
            ✓
          </div>
          <h1
            className="checkout-title"
            ref={successHeadingRef}
            tabIndex={-1}
          >
            {t.checkout.successTitle}
          </h1>
          <p className="checkout-lead">{successLead}</p>
          <p className="checkout-success-contact">{t.checkout.successContact}</p>

          <div className="checkout-receipt">
            <div className="checkout-receipt-row">
              <span>{t.checkout.successOrderId}</span>
              <strong>{orderReceipt.orderId}</strong>
            </div>
            {orderReceipt.customerName ? (
              <div className="checkout-receipt-row">
                <span>{t.checkout.name}</span>
                <strong>{orderReceipt.customerName}</strong>
              </div>
            ) : null}
            {orderReceipt.phone ? (
              <div className="checkout-receipt-row">
                <span>{t.checkout.phone}</span>
                <strong>{orderReceipt.phone}</strong>
              </div>
            ) : null}
            {orderReceipt.email && (
              <div className="checkout-receipt-row">
                <span>{t.checkout.email}</span>
                <strong>{orderReceipt.email}</strong>
              </div>
            )}
            {orderReceipt.city ? (
              <div className="checkout-receipt-row checkout-receipt-row--block">
                <span>{t.checkout.successDelivery}</span>
                <strong>
                  {t.checkout.methods[orderReceipt.deliveryMethod]}
                  <br />
                  {orderReceipt.city}
                  <br />
                  {orderReceipt.address}
                </strong>
              </div>
            ) : null}
            <div className="checkout-receipt-row">
              <span>{t.checkout.successPayment}</span>
              <strong>
                {PAYMENT_TYPE_LABELS[orderReceipt.paymentType]}
                {paidOnline ? " · оплачено" : ""}
              </strong>
            </div>

            {orderReceipt.items.length > 0 && (
              <div className="checkout-receipt-items">
                <p className="checkout-receipt-label">
                  {t.checkout.successItems}
                </p>
                <ul>
                  {orderReceipt.items.map((item) => (
                    <li key={`${item.id}-${item.size}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" width={64} height={80} />
                      <div>
                        <p>{item.name}</p>
                        <span>
                          {t.basket.size}: {item.size} · ×{item.quantity}
                        </span>
                      </div>
                      <strong>
                        {formatMoney(item.priceNum * item.quantity)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {orderReceipt.total > 0 && (
              <div className="checkout-receipt-total">
                <span>{t.checkout.successTotal}</span>
                <strong>{formatMoney(orderReceipt.total)}</strong>
              </div>
            )}
          </div>

          <Link href={sitePath()} className="btn-brand checkout-cta">
            {t.checkout.successCta}
          </Link>
        </div>
        <AlsoLike
          title={t.checkout.alsoLike}
          products={suggested.slice(0, 8)}
        />
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="checkout-page">
        <div className="checkout-empty">
          <h1 className="checkout-title">{t.checkout.emptyTitle}</h1>
          <Link href={sitePath("catalog")} className="btn-brand checkout-cta">
            {t.checkout.emptyCta}
          </Link>
        </div>
        <AlsoLike
          title={t.checkout.alsoLike}
          products={suggested.slice(0, 8)}
        />
      </section>
    );
  }

  const pickupLocked = deliveryMethod === "pickup";

  return (
    <section className="checkout-page">
      <header className="checkout-head">
        <h1 className="checkout-title">{t.checkout.title}</h1>
        <p className="checkout-lead">{t.checkout.subtitle}</p>
      </header>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={onSubmit} noValidate>
          <fieldset className="checkout-fieldset">
            <h2 className="checkout-fieldset-title">{t.checkout.contact}</h2>
            <label className="checkout-field">
              <span>{t.checkout.name}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder={t.checkout.namePlaceholder}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </label>
            <div className="checkout-row">
              <label className="checkout-field">
                <span>{t.checkout.phone}</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  placeholder="+380…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>
                  {t.checkout.email}{" "}
                  <em className="checkout-optional">
                    ({t.checkout.emailOptional})
                  </em>
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="checkout-fieldset">
            <h2 className="checkout-fieldset-title">{t.checkout.delivery}</h2>
            <label className="checkout-field">
              <span>{t.checkout.deliveryMethod}</span>
              <select
                name="deliveryMethod"
                value={deliveryMethod}
                onChange={(e) =>
                  setDeliveryMethod(e.target.value as DeliveryMethod)
                }
                required
              >
                {METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t.checkout.methods[method]}
                  </option>
                ))}
              </select>
            </label>

            <div className="checkout-autocomplete">
              <label className="checkout-field">
                <span>{t.checkout.city}</span>
                <input
                  type="text"
                  name="city"
                  autoComplete="off"
                  placeholder={
                    npEnabled ? t.checkout.cityPlaceholder : undefined
                  }
                  value={city}
                  disabled={pickupLocked}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (npEnabled) setCityListOpen(true);
                  }}
                  onFocus={() => {
                    if (npEnabled) setCityListOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setCityListOpen(false), 150);
                  }}
                  required
                />
              </label>
              {npEnabled && cityListOpen && (
                <ul className="checkout-suggest" role="listbox">
                  {loadingCities && (
                    <li className="checkout-suggest-meta">
                      {t.checkout.cityLoading}
                    </li>
                  )}
                  {!loadingCities &&
                    citySuggestions.map((option) => (
                      <li key={option}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCity(option)}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  {!loadingCities && !citySuggestions.length && city.trim() && (
                    <li className="checkout-suggest-meta">—</li>
                  )}
                </ul>
              )}
            </div>

            {needsWarehouse && (
              <div className="checkout-autocomplete">
                <label className="checkout-field">
                  <span>{t.checkout.warehouse}</span>
                  <input
                    type="text"
                    name="warehouse"
                    autoComplete="off"
                    placeholder={t.checkout.warehousePlaceholder}
                    value={address}
                    disabled={!city.trim()}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setWarehouseListOpen(true);
                    }}
                    onFocus={() => setWarehouseListOpen(true)}
                    onBlur={() => {
                      window.setTimeout(
                        () => setWarehouseListOpen(false),
                        150
                      );
                    }}
                    required
                  />
                  <small className="checkout-hint">
                    {t.checkout.addressHint}
                  </small>
                </label>
                {warehouseListOpen && city.trim() && (
                  <ul className="checkout-suggest" role="listbox">
                    {loadingWarehouses && (
                      <li className="checkout-suggest-meta">
                        {t.checkout.warehouseLoading}
                      </li>
                    )}
                    {!loadingWarehouses &&
                      warehouseSuggestions.map((option) => (
                        <li key={option}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectWarehouse(option)}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    {!loadingWarehouses &&
                      !warehouseSuggestions.length &&
                      address.trim() && (
                        <li className="checkout-suggest-meta">—</li>
                      )}
                  </ul>
                )}
              </div>
            )}

            {(needsFreeAddress || pickupLocked) && (
              <label className="checkout-field">
                <span>
                  {needsFreeAddress
                    ? t.checkout.courierAddress
                    : t.checkout.address}
                </span>
                <input
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  placeholder={
                    needsFreeAddress
                      ? t.checkout.courierAddressPlaceholder
                      : undefined
                  }
                  value={address}
                  disabled={pickupLocked}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="checkout-field">
              <span>{t.checkout.comment}</span>
              <textarea
                name="comment"
                rows={3}
                placeholder={t.checkout.commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
          </fieldset>

          <fieldset className="checkout-fieldset">
            <h2 className="checkout-fieldset-title">{t.checkout.payment}</h2>
            <div className="checkout-pay-brands" aria-hidden>
              <Image
                src="/images/payments/visa.svg"
                alt=""
                width={60}
                height={20}
                className="checkout-pay-brand"
              />
              <Image
                src="/images/payments/mastercard.svg"
                alt=""
                width={48}
                height={30}
                className="checkout-pay-brand"
              />
            </div>
            <p className="checkout-pay-hint">{t.checkout.paymentCards}</p>
            <div className="checkout-pay-options" role="radiogroup">
              {(
                [
                  {
                    value: "full" as const,
                    label: t.checkout.paymentOptionFull,
                    icon: "/images/payments/plata-by-mono.svg",
                    iconAlt: "plata by mono",
                    iconWidth: 120,
                    hint: null as string | null,
                  },
                  {
                    value: "prepay" as const,
                    label: t.checkout.paymentOptionPrepay,
                    icon: "/images/payments/prepay.svg",
                    iconAlt: "prepay",
                    iconWidth: 36,
                    hint: t.checkout.paymentOptionPrepayHint(
                      formatMoney(prepayAmountUah)
                    ),
                  },
                  {
                    value: "postpay" as const,
                    label: t.checkout.paymentOptionPostpay,
                    icon: "/images/payments/postpay.svg",
                    iconAlt: "postpay",
                    iconWidth: 40,
                    hint: null,
                  },
                ] as const
              ).map((opt) => {
                const checked = paymentType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`checkout-pay-option${checked ? " is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setPaymentType(opt.value)}
                      required
                    />
                    <span className="checkout-pay-option-copy">
                      <span className="checkout-pay-option-label">
                        {opt.label}
                      </span>
                      {opt.hint ? (
                        <span className="checkout-pay-option-hint">
                          {opt.hint}
                        </span>
                      ) : null}
                    </span>
                    <Image
                      src={opt.icon}
                      alt={opt.iconAlt}
                      width={opt.iconWidth}
                      height={28}
                      className="checkout-pay-option-icon"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          {fieldError && <p className="checkout-error">{fieldError}</p>}

          <div className="checkout-actions">
            <button type="submit" className="btn-brand" disabled={loading}>
              {loading
                ? paymentType === "postpay"
                  ? t.checkout.submitting
                  : t.checkout.payRedirect
                : t.checkout.submit}
            </button>
            <Link href={sitePath("catalog")} className="checkout-back">
              {t.checkout.backToShop}
            </Link>
          </div>
        </form>

        <aside className="checkout-summary" aria-label={t.checkout.orderSummary}>
          <h2>{t.checkout.orderSummary}</h2>
          <ul className="checkout-items">
            {items.map((item) => (
              <li key={`${item.id}-${item.size}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" width={80} height={100} />
                <div className="checkout-item-body">
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="checkout-item-meta">
                    {t.basket.size}: {item.size}
                  </p>
                  <div className="panel-qty">
                    <button
                      type="button"
                      aria-label="−"
                      onClick={() =>
                        updateQuantity(item.id, item.size, item.quantity - 1)
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() =>
                        updateQuantity(item.id, item.size, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <p className="checkout-item-price">
                    {formatMoney(item.priceNum * item.quantity)}
                  </p>
                </div>
                <button
                  type="button"
                  className="panel-remove"
                  aria-label={t.basket.remove}
                  onClick={() => removeItem(item.id, item.size)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <FreeShippingBar className="free-ship--checkout" total={total} />
          <div className="checkout-total">
            <span>{t.basket.total}</span>
            <span>{formatMoney(total)}</span>
          </div>
        </aside>
      </div>

      <AlsoLike title={t.checkout.alsoLike} products={alsoLike} />
    </section>
  );
}

export default function FinalCheckout({
  suggested,
  prepayAmountUah = 300,
}: {
  suggested: Product[];
  prepayAmountUah?: number;
}) {
  return (
    <Suspense
      fallback={
        <section className="checkout-page">
          <p className="checkout-lead">…</p>
        </section>
      }
    >
      <FinalCheckoutInner
        suggested={suggested}
        prepayAmountUah={prepayAmountUah}
      />
    </Suspense>
  );
}
