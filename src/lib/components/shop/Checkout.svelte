<script lang="ts">
    import { api, type OrderCreateData } from "$lib/api/client";
    import { basket } from "$lib/stores/basket.svelte.js";
    import { goto } from "$app/navigation";
    import { Clock } from "lucide-svelte";

    let loading = $state(false);
    let errorMsg = $state("");
    let pickUpTime = $state("");

    function extractHHMM(val: string | null): string | null {
        if (!val) return null;
        try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            }
        } catch {}
        if (/^\d{2}:\d{2}$/.test(val)) return val;
        return null;
    }

    function formatTime(val: string | null): string {
        const hhmm = extractHHMM(val);
        if (!hhmm) return "–";
        return hhmm;
    }

    let shopOpenTime = $derived(extractHHMM(basket.state.openDate));
    let shopCloseTime = $derived(extractHHMM(basket.state.closeDate));
    let hasHours = $derived(!!(shopOpenTime && shopCloseTime));

    let isOutsideHours = $derived.by(() => {
        if (!hasHours) return false;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const openMins =
            Number(shopOpenTime!.split(":")[0]) * 60 +
            Number(shopOpenTime!.split(":")[1]);
        const closeMins =
            Number(shopCloseTime!.split(":")[0]) * 60 +
            Number(shopCloseTime!.split(":")[1]);
        return nowMins < openMins || nowMins >= closeMins;
    });

    $effect(() => {
        if (basket.state.items.length === 0) return;
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        let h = now.getHours();
        let m = now.getMinutes();
        const defaultTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        if (hasHours) {
            const asMin = h * 60 + m;
            const openMins =
                Number(shopOpenTime!.split(":")[0]) * 60 +
                Number(shopOpenTime!.split(":")[1]);
            const closeMins =
                Number(shopCloseTime!.split(":")[0]) * 60 +
                Number(shopCloseTime!.split(":")[1]);
            if (asMin < openMins) pickUpTime = shopOpenTime!;
            else if (asMin >= closeMins) pickUpTime = shopCloseTime!;
            else pickUpTime = defaultTime;
        } else {
            pickUpTime = defaultTime;
        }
    });

    async function confirmOrder() {
        if (basket.state.items.length === 0) return;

        loading = true;
        errorMsg = "";

        try {
            const [hours, minutes] = pickUpTime.split(":").map(Number);
            const pickUpDate = new Date();
            pickUpDate.setHours(hours, minutes, 0, 0);

            const orderData: OrderCreateData = {
                foodtruckId: basket.state.shopId!,
                pickUpDate: pickUpDate.toISOString(),
                dishes: basket.state.items.map((item) => ({
                    dishId: item.dishId,
                    quantity: item.quantity,
                })),
            };

            const response = await api.orders.create(orderData);
            if (response.ok) {
                basket.clear();
                goto("/app/orders");
            } else {
                errorMsg = response.message || "Error al crear el pedido.";
            }
        } catch (err) {
            errorMsg = "Ocurrió un error inesperado.";
        } finally {
            loading = false;
        }
    }

    function clampTime(e: Event) {
        if (!hasHours || !shopOpenTime || !shopCloseTime) return;
        const input = e.target as HTMLInputElement;
        const val = input.value;
        if (!val) return;
        const [h, m] = val.split(":").map(Number);
        const valMins = h * 60 + m;
        const openMins =
            Number(shopOpenTime.split(":")[0]) * 60 +
            Number(shopOpenTime.split(":")[1]);
        const closeMins =
            Number(shopCloseTime.split(":")[0]) * 60 +
            Number(shopCloseTime.split(":")[1]);
        if (valMins < openMins) pickUpTime = shopOpenTime;
        else if (valMins >= closeMins) pickUpTime = shopCloseTime;
    }
</script>

<div class="checkout">
    {#if basket.state.items.length === 0}
        <div class="empty">
            <p>Tu cesta está vacía.</p>
            <a href="/app/sellers" class="btn-primary">Explorar comida</a>
        </div>
    {:else}
        <div class="checkout-card">
            <header>
                <h1>Confirmar Pedido</h1>
                <p class="shop-name">
                    Tienda: <strong>{basket.state.shopName}</strong>
                </p>
                <p class="shop-hours">
                    <Clock
                        size={16}
                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                    />
                    {#if hasHours}
                        Horario: <strong
                            >{formatTime(basket.state.openDate)} – {formatTime(
                                basket.state.closeDate,
                            )}</strong
                        >
                        {#if isOutsideHours}
                            <span class="outside-hours">· Fuera de horario</span
                            >
                        {/if}
                    {:else}
                        <em>Sin horario definido</em>
                    {/if}
                </p>
            </header>

            {#if isOutsideHours}
                <div class="alert closed">
                    <Clock
                        size={18}
                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                    /> Estás fuera del horario de esta tienda. No puedes realizar
                    pedidos ahora.
                </div>
            {/if}

            <div class="items-list">
                {#each basket.state.items as item}
                    <div class="item">
                        <div class="item-info">
                            <span class="qty">{item.quantity}x</span>
                            <span class="name">{item.name}</span>
                        </div>
                        <span class="price">{item.price * item.quantity}€</span>
                    </div>
                {/each}
            </div>

            <div class="total-row">
                <span>Total</span>
                <strong>{basket.totalPrice}€</strong>
            </div>

            <div class="pick-up">
                <label for="time">Hora de recogida estimada:</label>
                <input
                    type="time"
                    id="time"
                    bind:value={pickUpTime}
                    min={shopOpenTime || undefined}
                    max={shopCloseTime || undefined}
                    disabled={isOutsideHours}
                    onchange={clampTime}
                />
                {#if hasHours}
                    <p class="hint">
                        El horario de recogida disponible es de {formatTime(
                            basket.state.openDate,
                        )} a {formatTime(basket.state.closeDate)}.
                    </p>
                {:else}
                    <p class="hint">
                        Sin restricción de horario. Paga al recoger tu pedido.
                    </p>
                {/if}
            </div>

            {#if errorMsg}
                <p class="error">{errorMsg}</p>
            {/if}

            <div class="actions">
                <button class="btn-secondary" onclick={() => history.back()}
                    >Volver</button
                >
                <button
                    class="btn-confirm"
                    onclick={confirmOrder}
                    disabled={loading || isOutsideHours}
                >
                    {loading
                        ? "Procesando..."
                        : isOutsideHours
                          ? "Fuera de horario"
                          : "Confirmar Pedido"}
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .checkout {
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .checkout-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        border: 1.5px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
    }
    .shop-name {
        color: #64748b;
        margin: 0 0 0.25rem 0;
    }
    .shop-hours {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0;
    }
    .outside-hours {
        color: #d97706;
        font-weight: 600;
    }

    .alert {
        padding: 0.9rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 1rem;
    }
    .alert.closed {
        background: #fef9c3;
        color: #713f12;
    }

    .items-list {
        margin: 2rem 0;
        border-top: 1px dashed #e2e8f0;
        border-bottom: 1px dashed #e2e8f0;
        padding: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .item {
        display: flex;
        justify-content: space-between;
        font-size: 1rem;
    }

    .item-info {
        display: flex;
        gap: 0.5rem;
    }
    .qty {
        font-weight: 700;
        color: #3b82f6;
    }

    .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 1.25rem;
        margin-bottom: 2rem;
    }

    .pick-up {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 2rem;
    }

    .pick-up label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    .pick-up input {
        width: 100%;
        padding: 0.5rem;
        border-radius: 8px;
        border: 1.5px solid #cbd5e1;
        font-size: 1.1rem;
    }
    .hint {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 0.5rem;
    }

    .error {
        color: #ef4444;
        font-weight: 600;
        text-align: center;
    }

    .actions {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1rem;
    }

    .btn-secondary {
        background: #f1f5f9;
        border: none;
        padding: 0.8rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .btn-confirm {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.8rem;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
    }
</style>
