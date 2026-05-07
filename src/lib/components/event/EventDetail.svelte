<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import { basket } from "$lib/stores/basket.svelte.js";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import {
        MapPin,
        Calendar,
        ChevronUp,
        ChevronDown,
        Clock,
        ShoppingCart,
        ArrowLeft,
    } from "lucide-svelte";

    let { eventId } = $props<{ eventId: string }>();

    let eventData = $state<any>(null);
    let shops = $state<any[]>([]);
    let reservedDishes = $state(0);
    let soldOutDishes = $state<any[]>([]);

    let loading = $state(true);
    let errorMsg = $state("");

    let expandedShopId = $state<string | null>(null);

    onMount(async () => {
        try {
            const res = await api.events.getOne(eventId);
            if (res.ok) {
                const payload = res.data ?? res;
                const data = payload.event ? payload : payload.data;
                if (data && data.event) {
                    eventData = data.event;
                    shops = data.shops || [];
                    reservedDishes = data.reservedDishes || 0;
                    soldOutDishes = data.soldOutDishes || [];
                } else {
                    eventData = payload;
                    shops = [];
                }
            } else {
                errorMsg = "Error al cargar el evento.";
            }
        } catch {
            errorMsg = "Error al cargar el evento.";
        } finally {
            loading = false;
        }
    });

    function toggleShop(shopId: string) {
        if (expandedShopId === shopId) expandedShopId = null;
        else expandedShopId = shopId;
    }

    function addToBasket(shop: any, dish: any) {
        basket.addItem(
            shop.id,
            shop.name || "Tienda",
            { id: dish.id, name: dish.name, price: dish.price },
            shop.openDate,
            shop.closeDate,
        );
    }

    function removeFromBasket(dishId: string) {
        basket.removeItem(dishId);
    }

    function toMinutes(time: string): number {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
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

    function isShopOpen(shop: any): boolean {
        const o = extractHHMM(shop.openDate);
        const c = extractHHMM(shop.closeDate);
        if (!o || !c) return true;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        return nowMins >= toMinutes(o) && nowMins < toMinutes(c);
    }
</script>

<div class="event-detail">
    {#if loading}
        <div class="loading">Cargando evento...</div>
    {:else if errorMsg}
        <div class="error-msg">{errorMsg}</div>
    {:else if eventData}
        <div class="nav-back">
            <a href="/app/events" class="btn-back">
                <ArrowLeft
                    size={16}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Volver a Eventos
            </a>
        </div>

        <div class="event-hero">
            <h1>{eventData.name}</h1>
            <p class="desc">{eventData.description}</p>
            <div class="event-meta">
                <span
                    ><MapPin
                        size={16}
                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                    />
                    {eventData.location}</span
                >
                <span
                    ><Calendar
                        size={16}
                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                    />
                    {new Date(eventData.startDate).toLocaleDateString()} a {new Date(
                        eventData.finishDate,
                    ).toLocaleDateString()}</span
                >
            </div>
        </div>

        <div class="shops-section">
            <h2>Tiendas y Puestos del Evento</h2>
            {#if shops.length === 0}
                <div class="empty">
                    Aún no hay tiendas inscritas a este evento.
                </div>
            {:else}
                <div class="shops-list">
                    {#each shops as item}
                        {@const { shop, menu } = item}
                        {@const open = isShopOpen(shop)}

                        <div
                            class="shop-card {expandedShopId === shop.id
                                ? 'expanded'
                                : ''}"
                        >
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_interactive_supports_focus -->
                            <div
                                class="shop-header clickable"
                                onclick={() => toggleShop(shop.id)}
                                role="button"
                            >
                                <div class="shop-header-info">
                                    <h3>{shop.name}</h3>
                                    <span
                                        class="status-badge {open
                                            ? 'open'
                                            : 'closed'}"
                                    >
                                        {open ? "Abierto" : "Cerrado"}
                                    </span>
                                </div>
                                <span class="toggle-icon">
                                    {#if expandedShopId === shop.id}
                                        <ChevronUp
                                            size={18}
                                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                                        /> Ocultar Menú
                                    {:else}
                                        <ChevronDown
                                            size={18}
                                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                                        /> Ver Menú
                                    {/if}
                                </span>
                            </div>

                            {#if expandedShopId === shop.id}
                                <div class="shop-menu-body">
                                    {#if !open}
                                        <div class="alert closed">
                                            <Clock
                                                size={18}
                                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                                            /> Esta tienda está cerrada ahora. No
                                            puedes realizar pedidos.
                                        </div>
                                    {/if}

                                    {#if menu.length === 0}
                                        <p class="empty-menu">
                                            Esta tienda no tiene platos
                                            disponibles.
                                        </p>
                                    {:else}
                                        <div class="dishes-list">
                                            {#each menu as dish}
                                                <div
                                                    class="dish-card {!dish.available ||
                                                    dish.stock <= 0
                                                        ? 'unavailable'
                                                        : ''}"
                                                >
                                                    <div class="dish-info">
                                                        <h4>{dish.name}</h4>
                                                        <p>
                                                            {dish.description}
                                                        </p>
                                                        <span class="price"
                                                            >{dish.price}€</span
                                                        >
                                                    </div>

                                                    <div class="dish-actions">
                                                        {#if !dish.available || dish.stock <= 0}
                                                            <span
                                                                class="out-of-stock"
                                                                >Agotado</span
                                                            >
                                                        {:else if !open}
                                                            <span
                                                                class="out-of-stock"
                                                                >Cerrado</span
                                                            >
                                                        {:else}
                                                            {@const inBasket =
                                                                basket.state.items.find(
                                                                    (i) =>
                                                                        i.dishId ===
                                                                        dish.id,
                                                                )?.quantity ||
                                                                0}
                                                            <div
                                                                class="quantity-control"
                                                            >
                                                                {#if inBasket > 0}
                                                                    <button
                                                                        class="btn-qty"
                                                                        onclick={() =>
                                                                            removeFromBasket(
                                                                                dish.id,
                                                                            )}
                                                                        >-</button
                                                                    >
                                                                    <span
                                                                        class="qty"
                                                                        >{inBasket}</span
                                                                    >
                                                                {/if}
                                                                <button
                                                                    class="btn-primary"
                                                                    onclick={() =>
                                                                        addToBasket(
                                                                            shop,
                                                                            dish,
                                                                        )}
                                                                >
                                                                    {inBasket >
                                                                    0
                                                                        ? "+"
                                                                        : "Añadir"}
                                                                </button>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        {#if basket.totalItems > 0}
            <div class="basket-summary">
                <div class="summary-info">
                    <strong
                        ><ShoppingCart
                            size={18}
                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                        />
                        {basket.totalItems} productos</strong
                    >
                    <span>Total: {basket.totalPrice}€</span>
                </div>
                <a href="/app/checkout" class="btn-confirm">Ir al pago</a>
            </div>
        {/if}
    {/if}
</div>

<style>
    .event-detail {
        max-width: 900px;
        margin: 0 auto;
        padding-bottom: 6rem;
    }

    .loading,
    .error-msg,
    .empty {
        text-align: center;
        padding: 3rem;
        color: #64748b;
        background: white;
        border-radius: 12px;
        border: 1.5px dashed #cbd5e1;
    }

    .nav-back {
        margin-bottom: 1.5rem;
    }
    .btn-back {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        color: #64748b;
        background: #f1f5f9;
        font-weight: 600;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.95rem;
    }
    .btn-back:hover {
        background: #e2e8f0;
        color: #1e293b;
    }

    .event-hero {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        border: 1.5px solid #e2e8f0;
        margin-bottom: 2rem;
    }
    .event-hero h1 {
        margin: 0 0 0.5rem 0;
        color: #1e293b;
    }
    .event-hero .desc {
        color: #475569;
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }
    .event-meta {
        display: flex;
        gap: 1.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        color: #64748b;
        margin-bottom: 1.5rem;
    }

    .shops-section h2 {
        margin-bottom: 1.5rem;
        color: #1e293b;
        font-size: 1.4rem;
    }

    .shops-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .shop-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        transition: box-shadow 0.2s;
    }
    .shop-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .shop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        background: white;
        cursor: pointer;
        user-select: none;
    }

    .shop-card.expanded .shop-header {
        border-bottom: 1.5px solid #f1f5f9;
        background: #f8fafc;
    }

    .shop-header-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .shop-header h3 {
        margin: 0;
        font-size: 1.15rem;
        color: #1e293b;
    }
    .toggle-icon {
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
    }

    .status-badge {
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .status-badge.open {
        background: #dcfce7;
        color: #166534;
    }
    .status-badge.closed {
        background: #fee2e2;
        color: #991b1b;
    }

    .shop-menu-body {
        padding: 1.5rem;
        background: #fafaf9;
    }

    .alert {
        padding: 0.9rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 1rem;
    }
    .alert.closed {
        background: #fee2e2;
        color: #991b1b;
    }

    .empty-menu {
        color: #64748b;
        font-style: italic;
    }

    .dishes-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    .dish-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .dish-card.unavailable {
        opacity: 0.6;
    }

    .dish-info h4 {
        margin: 0 0 0.3rem 0;
        font-size: 1rem;
        color: #1e293b;
    }
    .dish-info p {
        margin: 0 0 0.5rem 0;
        font-size: 0.85rem;
        color: #64748b;
        line-height: 1.4;
    }
    .price {
        font-weight: 700;
        color: #3b82f6;
    }

    .quantity-control {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    .btn-qty {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1.5px solid #cbd5e1;
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
    }
    .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
    }
    .out-of-stock {
        color: #ef4444;
        font-weight: 600;
        font-size: 0.85rem;
    }

    .basket-summary {
        position: fixed;
        bottom: 2rem;
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
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
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
        transition: opacity 0.2s;
    }
    .btn-confirm:hover {
        opacity: 0.9;
    }

    @media (max-width: 600px) {
        .shop-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style>
