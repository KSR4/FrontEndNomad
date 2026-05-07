<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import {
        RefreshCw,
        Star,
        CheckCircle2,
        ChevronUp,
        ChevronDown,
    } from "lucide-svelte";

    let orders = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");

    let shopNames = $state<Record<string, string>>({});
    let expandedOrders = $state<Record<string, boolean>>({});

    let reviewForms = $state<Record<string, boolean>>({});
    let reviewTexts = $state<Record<string, string>>({});
    let reviewSending = $state<Record<string, boolean>>({});
    let reviewSuccess = $state<Record<string, string>>({});
    let reviewError = $state<Record<string, string>>({});
    let reviewedOrders = $state<Record<string, boolean>>({});

    let updatingOrders = $state<Record<string, boolean>>({});

    onMount(async () => {
        await loadOrders();
    });

    async function loadOrders() {
        loading = true;
        try {
            const response = await api.orders.listSelf();
            if (response.ok) {
                const raw = response.data;
                const list = Array.isArray(raw)
                    ? raw
                    : (raw?.orders ?? raw?.data ?? []);
                orders = list.sort(
                    (a: any, b: any) =>
                        new Date(b.pickUpDate).getTime() -
                        new Date(a.pickUpDate).getTime(),
                );
                await loadShopNames(orders);
            }
        } catch (err) {
            errorMsg = "Error al cargar los pedidos.";
        } finally {
            loading = false;
        }
    }

    async function loadShopNames(ordersList: any[]) {
        const uniqueIds = [
            ...new Set(ordersList.map((o) => o.shopId).filter(Boolean)),
        ];
        for (const id of uniqueIds) {
            if (!shopNames[id]) {
                try {
                    const res = await api.shops.getOne(id);
                    if (res.ok && res.data?.name) {
                        shopNames[id] = res.data.name;
                    }
                } catch (e) {
                    console.error("Error loading shop data for id:", id);
                }
            }
        }
    }

    function getOrderDishes(order: any): any[] {
        return Array.isArray(order.dishes) ? order.dishes : [];
    }

    function safeDate(val: string | null | undefined): string {
        if (!val) return "–";
        const d = new Date(val);
        return isNaN(d.getTime()) ? val : d.toLocaleString();
    }

    function safeTime(val: string | null | undefined): string {
        if (!val) return "–";
        const d = new Date(val);
        return isNaN(d.getTime())
            ? val
            : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function shopName(order: any): string {
        if (order.shopId && shopNames[order.shopId]) {
            return shopNames[order.shopId];
        }
        return order.shop?.name || "Cargando tienda...";
    }

    function toggleExpand(orderId: string) {
        expandedOrders[orderId] = !expandedOrders[orderId];
    }

    function toggleReviewForm(orderId: string) {
        reviewForms[orderId] = !reviewForms[orderId];
        if (!reviewTexts[orderId]) reviewTexts[orderId] = "";
        reviewError[orderId] = "";
    }

    async function submitReview(orderId: string) {
        const text = reviewTexts[orderId]?.trim();
        if (!text) {
            reviewError[orderId] = "Escribe algo en tu reseña.";
            return;
        }
        reviewSending[orderId] = true;
        reviewError[orderId] = "";
        try {
            const res = await api.reviews.create(orderId, {
                text,
                date: new Date().toISOString(),
            });
            if (res.ok) {
                reviewSuccess[orderId] = "¡Reseña enviada correctamente!";
                reviewForms[orderId] = false;
                reviewedOrders[orderId] = true;
            } else {
                reviewError[orderId] =
                    res.message || "Error al enviar la reseña.";
            }
        } catch {
            reviewError[orderId] = "Error al enviar la reseña.";
        } finally {
            reviewSending[orderId] = false;
        }
    }

    async function updateOrderState(
        orderId: string,
        newState: "CANCELLED" | "CONFIRMED",
    ) {
        updatingOrders[orderId] = true;
        try {
            const res = await api.orders.updateState(orderId, newState);
            if (res.ok) {
                const order = orders.find((o) => o.id === orderId);
                if (order) order.state = newState;
            } else {
                alert(
                    "Error: " +
                        (res.message ||
                            "No se pudo actualizar el estado del pedido."),
                );
            }
        } finally {
            updatingOrders[orderId] = false;
        }
    }

    function getStatusClass(status: string) {
        switch (status?.toUpperCase()) {
            case "PENDING":
                return "status-pending";
            case "CANCELLED":
                return "status-cancelled";
            case "CONFIRMED":
                return "status-confirmed";
            case "PREPARING":
                return "status-preparing";
            case "READY":
                return "status-ready";
            case "DELIVERED":
                return "status-delivered";
            default:
                return "";
        }
    }

    function getStatusLabel(status: string) {
        switch (status?.toUpperCase()) {
            case "PENDING":
                return "Pendiente";
            case "CANCELLED":
                return "Cancelado";
            case "CONFIRMED":
                return "Confirmado";
            case "PREPARING":
                return "Preparando";
            case "READY":
                return "Listo para recoger";
            case "DELIVERED":
                return "Recogido";
            default:
                return status;
        }
    }
</script>

<div class="orders-view">
    <div class="header">
        <button class="btn-refresh" onclick={loadOrders} disabled={loading}>
            {#if loading}
                ...
            {:else}
                <RefreshCw
                    size={14}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Actualizar
            {/if}
        </button>
    </div>

    {#if loading}
        <div class="info">Cargando tus pedidos...</div>
    {:else if errorMsg}
        <div class="error">{errorMsg}</div>
    {:else if orders.length === 0}
        <div class="empty">
            <p>Aún no has realizado ningún pedido.</p>
            <a href="/app/sellers" class="btn-primary">Explorar comida</a>
        </div>
    {:else}
        <div class="orders-list">
            {#each orders as order}
                <div class="order-card">
                    <div class="order-header">
                        <div class="shop-info">
                            <h3>{shopName(order)}</h3>
                            <span class="date"
                                >{safeDate(order.pickUpDate)}</span
                            >
                        </div>
                        <span
                            class="status-badge {getStatusClass(order.state)}"
                        >
                            {getStatusLabel(order.state)}
                        </span>
                    </div>

                    <div class="order-footer">
                        <span class="order-total">
                            Total: <strong
                                >{(order.totalPrice ?? 0).toFixed(2)}€</strong
                            >
                        </span>

                        <div class="order-actions-container">
                            {#if order.state?.toUpperCase() === "PENDING"}
                                <div class="client-actions">
                                    <button
                                        class="btn-cancel-state"
                                        onclick={() =>
                                            updateOrderState(
                                                order.id,
                                                "CANCELLED",
                                            )}
                                        disabled={updatingOrders[order.id]}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        class="btn-confirm-state"
                                        onclick={() =>
                                            updateOrderState(
                                                order.id,
                                                "CONFIRMED",
                                            )}
                                        disabled={updatingOrders[order.id]}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            {/if}
                            <button
                                class="btn-expand"
                                onclick={() => toggleExpand(order.id)}
                            >
                                {#if expandedOrders[order.id]}
                                    Ocultar detalles <ChevronUp
                                        size={14}
                                        style="display:inline; vertical-align:middle;"
                                    />
                                {:else}
                                    Ver detalles <ChevronDown
                                        size={14}
                                        style="display:inline; vertical-align:middle;"
                                    />
                                {/if}
                            </button>
                        </div>
                    </div>

                    {#if expandedOrders[order.id]}
                        <div class="order-details">
                            <div class="items">
                                {#each getOrderDishes(order) as item}
                                    <div class="item">
                                        <div class="item-info">
                                            <span class="qty"
                                                >{item.quantity}x</span
                                            >
                                            <span class="name">{item.name}</span
                                            >
                                        </div>
                                        <span class="price"
                                            >{item.price
                                                ? (
                                                      item.price * item.quantity
                                                  ).toFixed(2) + "€"
                                                : ""}</span
                                        >
                                    </div>
                                {/each}
                            </div>

                            {#if order.state?.toUpperCase() === "DELIVERED"}
                                <div class="review-section">
                                    {#if reviewSuccess[order.id]}
                                        <div class="review-success">
                                            <CheckCircle2
                                                size={16}
                                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                                            />
                                            {reviewSuccess[order.id]}
                                        </div>
                                    {:else if reviewedOrders[order.id]}
                                        <div class="review-success">
                                            <CheckCircle2
                                                size={16}
                                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                                            /> Ya has dejado una reseña para este
                                            pedido.
                                        </div>
                                    {:else if reviewForms[order.id]}
                                        <div class="review-form">
                                            <textarea
                                                class="review-textarea"
                                                placeholder="¿Qué te pareció tu pedido?"
                                                bind:value={
                                                    reviewTexts[order.id]
                                                }
                                                disabled={reviewSending[
                                                    order.id
                                                ]}
                                            ></textarea>
                                            {#if reviewError[order.id]}
                                                <div class="review-error">
                                                    {reviewError[order.id]}
                                                </div>
                                            {/if}
                                            <div class="review-actions">
                                                <button
                                                    class="btn-cancel"
                                                    onclick={() =>
                                                        toggleReviewForm(
                                                            order.id,
                                                        )}
                                                    disabled={reviewSending[
                                                        order.id
                                                    ]}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    class="btn-submit-review"
                                                    onclick={() =>
                                                        submitReview(order.id)}
                                                    disabled={reviewSending[
                                                        order.id
                                                    ]}
                                                >
                                                    {reviewSending[order.id]
                                                        ? "Enviando…"
                                                        : "Enviar reseña"}
                                                </button>
                                            </div>
                                        </div>
                                    {:else}
                                        <button
                                            class="btn-write-review"
                                            onclick={() =>
                                                toggleReviewForm(order.id)}
                                        >
                                            <Star
                                                size={14}
                                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                                            /> Escribir reseña
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .orders-view {
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .btn-refresh {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        color: #64748b;
    }

    .orders-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        align-items: start;
    }

    .order-card {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        border: 1.5px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .shop-info h3 {
        margin: 0;
        font-size: 1.2rem;
    }
    .date {
        font-size: 0.8rem;
        color: #64748b;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .status-pending {
        background: #fef9c3;
        color: #854d0e;
    }
    .status-cancelled {
        background: #fee2e2;
        color: #991b1b;
    }
    .status-confirmed {
        background: #f3e8ff;
        color: #6b21a8;
    }
    .status-preparing {
        background: #e0f2fe;
        color: #0369a1;
    }
    .status-ready {
        background: #dcfce7;
        color: #166534;
        border: 1.5px solid #22c55e;
    }
    .status-delivered {
        background: #f1f5f9;
        color: #475569;
    }

    .order-details {
        border-top: 1px solid #f1f5f9;
        padding-top: 1rem;
        margin-top: 1rem;
    }

    .item {
        font-size: 0.95rem;
        color: #334155;
        margin-bottom: 0.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .item-info {
        display: flex;
        gap: 0.5rem;
    }

    .qty {
        font-weight: 600;
        color: #3b82f6;
    }

    .price {
        font-weight: 600;
        color: #1e293b;
    }

    .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
    }

    .order-total {
        font-size: 0.95rem;
        color: #64748b;
    }

    .order-total strong {
        color: #1e293b;
    }

    .btn-expand {
        background: none;
        border: none;
        color: #3b82f6;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0;
    }

    .btn-expand:hover {
        text-decoration: underline;
    }

    .order-actions-container {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .client-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-cancel-state {
        background: none;
        color: #ef4444;
        border: 1.5px solid #ef4444;
        padding: 0.35rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-cancel-state:hover:not(:disabled) {
        background: #fee2e2;
    }
    .btn-cancel-state:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-confirm-state {
        background: #3b82f6;
        color: white;
        border: 1.5px solid #3b82f6;
        padding: 0.35rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-confirm-state:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    .btn-confirm-state:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .empty {
        text-align: center;
        padding: 4rem 2rem;
        border: 2px dashed #e2e8f0;
        border-radius: 24px;
        color: #94a3b8;
    }

    .btn-primary {
        display: inline-block;
        margin-top: 1rem;
        background: #3b82f6;
        color: white;
        text-decoration: none;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
    }

    .review-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
    }

    .btn-write-review {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition:
            opacity 0.2s,
            transform 0.1s;
    }

    .btn-write-review:hover {
        opacity: 0.88;
        transform: translateY(-1px);
    }

    .review-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .review-textarea {
        width: 100%;
        min-height: 80px;
        padding: 0.65rem 0.9rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        color: #1e293b;
        background: #f8fafc;
        resize: vertical;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }

    .review-textarea:focus {
        border-color: #f59e0b;
        background: #fff;
    }

    .review-textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .review-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .btn-cancel {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.4rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        color: #64748b;
        font-size: 0.85rem;
    }

    .btn-cancel:hover {
        background: #f1f5f9;
    }

    .btn-submit-review {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        border: none;
        padding: 0.4rem 0.9rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .btn-submit-review:hover:not(:disabled) {
        opacity: 0.88;
    }

    .btn-submit-review:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .review-success {
        font-size: 0.9rem;
        color: #166534;
        background: #dcfce7;
        padding: 0.6rem 0.9rem;
        border-radius: 8px;
    }

    .review-error {
        font-size: 0.85rem;
        color: #991b1b;
        background: #fee2e2;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
    }
</style>
