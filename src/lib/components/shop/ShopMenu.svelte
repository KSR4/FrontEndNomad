<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import { basket } from "$lib/stores/basket.svelte.js";
    import { Clock, MessageSquare, ArrowLeft } from "lucide-svelte";

    let { shopId } = $props<{ shopId: string }>();

    let shop = $state<any>(null);
    let dishes = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");

    let reviews = $state<any[]>([]);
    let reviewsLoading = $state(false);

    function toMinutes(time: string): number {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    }

    function formatTime(isoOrTime: string | null): string {
        if (!isoOrTime) return "Sin horario";

        try {
            const d = new Date(isoOrTime);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            }
        } catch {}
        return isoOrTime;
    }

    function extractHHMM(isoOrTime: string | null): string | null {
        if (!isoOrTime) return null;
        try {
            const d = new Date(isoOrTime);
            if (!isNaN(d.getTime())) {
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            }
        } catch {}

        if (/^\d{2}:\d{2}$/.test(isoOrTime)) return isoOrTime;
        return null;
    }

    let openTime = $derived(extractHHMM(shop?.openDate));
    let closeTime = $derived(extractHHMM(shop?.closeDate));

    let isWithinHours = $derived.by(() => {
        if (!openTime || !closeTime) return true;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        return nowMins >= toMinutes(openTime) && nowMins < toMinutes(closeTime);
    });

    let isShopOpen = $derived(isWithinHours);
    let statusLabel = $derived.by(() => {
        if (!openTime || !closeTime) return "Sin horario";
        return isWithinHours ? "Abierto" : "Cerrado";
    });
    let statusClass = $derived(isWithinHours ? "open" : "closed");

    onMount(async () => {
        try {
            const [shopRes, menuRes] = await Promise.all([
                api.shops.getOne(shopId),
                api.shops.getMenu(shopId),
            ]);

            if (shopRes.ok) shop = shopRes.data;
            if (menuRes.ok) dishes = menuRes.data?.dishes ?? menuRes.data;
        } catch (err: any) {
            errorMsg = "Error al cargar el menú.";
        } finally {
            loading = false;
        }
        loadReviews();
    });

    async function loadReviews() {
        reviewsLoading = true;
        try {
            const res = await api.reviews.listByShop(shopId);
            if (res.ok) {
                const raw = res.data;
                reviews = Array.isArray(raw)
                    ? raw
                    : (raw?.reviews ?? raw?.data ?? []);
                reviews.sort(
                    (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                );
            }
        } catch {
        } finally {
            reviewsLoading = false;
        }
    }

    function formatReviewDate(val: string | null | undefined): string {
        if (!val) return "";
        const d = new Date(val);
        return isNaN(d.getTime())
            ? val
            : d.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              });
    }

    function getReviewDishes(review: any): any[] {
        return Array.isArray(review.dishes) ? review.dishes : [];
    }

    function reviewAvatarUrl(review: any): string | null {
        if (!review.avatar) return null;
        const b64 = review.avatar;
        return b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
    }

    function reviewInitial(review: any): string {
        return (review.username ?? "?")[0].toUpperCase();
    }

    function addToBasket(dish: any) {
        basket.addItem(
            shopId,
            shop?.name || "Tienda",
            { id: dish.id, name: dish.name, price: dish.price },
            shop?.openDate,
            shop?.closeDate,
        );
    }

    function removeFromBasket(dishId: string) {
        basket.removeItem(dishId);
    }
</script>

<div class="shop-menu">
    {#if loading}
        <div class="loading">Cargando menú...</div>
    {:else if errorMsg}
        <div class="error">{errorMsg}</div>
    {:else}
        <div class="nav-back">
            <a href="/app/sellers" class="btn-back">
                <ArrowLeft
                    size={16}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Volver a Explorar
            </a>
        </div>

        <header class="shop-header">
            <div>
                <h1>{shop?.name}</h1>
                <div class="hours-info">
                    {#if openTime && closeTime}
                        <Clock
                            size={16}
                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                        /> Horario:
                        <strong
                            >{formatTime(shop?.openDate)} – {formatTime(
                                shop?.closeDate,
                            )}</strong
                        >
                        {#if !isWithinHours}
                            <span class="hours-warning">· Fuera de horario</span
                            >
                        {/if}
                    {:else}
                        <Clock
                            size={16}
                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                        /> <em>Sin horario definido</em>
                    {/if}
                </div>
            </div>
            <span class="status {statusClass}">{statusLabel}</span>
        </header>

        {#if !isShopOpen && openTime && closeTime}
            <div class="alert-banner closed">
                <Clock
                    size={18}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Esta tienda está cerrada ahora ({formatTime(shop?.openDate)} –
                {formatTime(shop?.closeDate)}). No puedes realizar pedidos.
            </div>
        {/if}

        <div class="dishes-list">
            {#each dishes as dish}
                <div
                    class="dish-card {!dish.available || dish.stock <= 0
                        ? 'unavailable'
                        : ''}"
                >
                    <div class="dish-info">
                        <h3>{dish.name}</h3>
                        <p>{dish.description}</p>
                        <div class="dish-meta">
                            <span class="price">{dish.price}€</span>
                        </div>
                    </div>

                    <div class="dish-actions">
                        {#if !dish.available || dish.stock <= 0}
                            <span class="out-of-stock">Agotado</span>
                        {:else if !isShopOpen}
                            <span class="out-of-stock">No disponible</span>
                        {:else}
                            {@const inBasket =
                                basket.state.items.find(
                                    (i) => i.dishId === dish.id,
                                )?.quantity || 0}
                            <div class="quantity-control">
                                {#if inBasket > 0}
                                    <button
                                        class="btn-qty"
                                        onclick={() =>
                                            removeFromBasket(dish.id)}>-</button
                                    >
                                    <span class="qty">{inBasket}</span>
                                {/if}
                                <button
                                    class="btn-primary"
                                    onclick={() => addToBasket(dish)}
                                >
                                    {inBasket > 0 ? "+" : "Añadir"}
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        <section class="reviews-section">
            <h2>Reseñas de clientes</h2>
            {#if reviewsLoading}
                <p class="reviews-loading">Cargando reseñas...</p>
            {:else if reviews.length === 0}
                <div class="reviews-empty">
                    <span class="reviews-empty-icon"
                        ><MessageSquare size={32} /></span
                    >
                    <p>Esta tienda aún no tiene reseñas.</p>
                </div>
            {:else}
                <div class="reviews-list">
                    {#each reviews as review}
                        <div class="review-card">
                            <div class="review-top">
                                <div class="review-author">
                                    {#if reviewAvatarUrl(review)}
                                        <img
                                            src={reviewAvatarUrl(review)}
                                            alt=""
                                            class="review-avatar"
                                        />
                                    {:else}
                                        <div
                                            class="review-avatar review-avatar-placeholder"
                                        >
                                            {reviewInitial(review)}
                                        </div>
                                    {/if}
                                    <span class="review-username"
                                        >{review.username ?? "Usuario"}</span
                                    >
                                </div>
                                <span class="review-date"
                                    >{formatReviewDate(review.date)}</span
                                >
                            </div>
                            <p class="review-text">{review.text}</p>
                            {#if getReviewDishes(review).length > 0}
                                <div class="review-order">
                                    <span class="review-order-label"
                                        >Pedido:</span
                                    >
                                    {#each getReviewDishes(review) as dish}
                                        <span class="review-dish"
                                            >{dish.quantity}x {dish.name}</span
                                        >
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>

        {#if basket.totalItems > 0 && basket.state.shopId === shopId}
            <div class="basket-summary">
                <div class="summary-info">
                    <strong>{basket.totalItems} productos</strong>
                    <span>Total: {basket.totalPrice}€</span>
                </div>
                <a href="/app/checkout" class="btn-confirm">Ver pedido</a>
            </div>
        {/if}
    {/if}
</div>

<style>
    .shop-menu {
        max-width: 800px;
        margin: 0 auto;
        padding-bottom: 5rem;
    }

    .nav-back {
        margin-bottom: 1.5rem;
    }

    .btn-back {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        color: #64748b;
        font-weight: 500;
        font-size: 0.95rem;
        background: #f1f5f9;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        transition: all 0.2s;
    }

    .btn-back:hover {
        background: #e2e8f0;
        color: #1e293b;
    }

    .shop-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }

    .shop-header h1 {
        margin: 0 0 0.4rem 0;
    }

    .hours-info {
        font-size: 0.9rem;
        color: #64748b;
    }

    .hours-warning {
        color: #d97706;
        font-weight: 600;
    }

    .status {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        margin-top: 0.25rem;
    }

    .status.open {
        background: #dcfce7;
        color: #166534;
    }
    .status.closed {
        background: #fee2e2;
        color: #991b1b;
    }

    .alert-banner {
        padding: 0.9rem 1.25rem;
        border-radius: 10px;
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
        font-weight: 500;
    }

    .alert-banner.closed {
        background: #fee2e2;
        color: #991b1b;
    }
    .alert-banner.warning {
        background: #fef9c3;
        color: #713f12;
    }

    .dishes-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .dish-card {
        background: white;
        padding: 1.25rem;
        border-radius: 12px;
        border: 1.5px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: box-shadow 0.2s;
    }

    .dish-card.unavailable {
        opacity: 0.6;
    }
    .dish-card:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .dish-info h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
    }
    .dish-info p {
        margin: 0 0 0.5rem 0;
        color: #64748b;
        font-size: 0.9rem;
    }

    .dish-meta {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    .price {
        font-weight: 700;
        color: #3b82f6;
        font-size: 1.1rem;
    }
    .stock {
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .quantity-control {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .btn-qty {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1.5px solid #cbd5e1;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
    }

    .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .out-of-stock {
        color: #ef4444;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .basket-summary {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 2rem);
        max-width: 600px;
        background: #1e293b;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        z-index: 100;
    }

    .summary-info {
        display: flex;
        flex-direction: column;
    }

    .btn-confirm {
        background: #3b82f6;
        color: white;
        text-decoration: none;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
    }

    .loading,
    .error {
        text-align: center;
        padding: 3rem;
        color: #64748b;
    }

    .reviews-section {
        margin-top: 2.5rem;
        padding-top: 2rem;
        border-top: 2px solid #e2e8f0;
    }

    .reviews-section h2 {
        font-size: 1.3rem;
        margin: 0 0 1.25rem 0;
        color: #1e293b;
    }

    .reviews-loading {
        color: #94a3b8;
        text-align: center;
        padding: 2rem;
    }

    .reviews-empty {
        text-align: center;
        padding: 2.5rem 1.5rem;
        border: 2px dashed #e2e8f0;
        border-radius: 16px;
        color: #94a3b8;
    }

    .reviews-empty-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .review-card {
        background: #f8fafc;
        padding: 1.15rem 1.35rem;
        border-radius: 12px;
        border: 1.5px solid #e2e8f0;
        transition:
            box-shadow 0.2s,
            transform 0.15s;
    }

    .review-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
    }

    .review-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.6rem;
    }

    .review-author {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .review-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 1.5px solid #e2e8f0;
    }

    .review-avatar-placeholder {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #fff;
        font-size: 0.8rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .review-username {
        font-weight: 600;
        font-size: 0.9rem;
        color: #334155;
    }

    .review-date {
        font-size: 0.78rem;
        color: #94a3b8;
    }

    .review-text {
        margin: 0 0 0.75rem 0;
        color: #475569;
        font-size: 0.93rem;
        line-height: 1.55;
    }

    .review-order {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
    }

    .review-order-label {
        color: #94a3b8;
        font-weight: 600;
    }

    .review-dish {
        background: #e2e8f0;
        color: #475569;
        padding: 0.15rem 0.55rem;
        border-radius: 6px;
        font-size: 0.78rem;
    }
</style>
