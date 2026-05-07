<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import { goto } from "$app/navigation";
    import { Store, Clock, MapPin, RefreshCw } from "lucide-svelte";

    let shops = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");

    onMount(async () => {
        await loadShops();
    });

    async function loadShops() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.shops.listSelf();
            if (res.ok) {
                const raw = res.data;
                shops = Array.isArray(raw)
                    ? raw
                    : (raw?.shops ?? raw?.data ?? []);
            } else {
                errorMsg = res.message || "Error al cargar tus tiendas.";
            }
        } catch {
            errorMsg = "Error al cargar tus tiendas.";
        } finally {
            loading = false;
        }
    }

    function formatTime(isoOrTime: string | null): string {
        if (!isoOrTime) return "–";
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

    function isOpen(shop: any): boolean {
        if (!shop.openDate || !shop.closeDate) return false;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const open = new Date(shop.openDate);
        const close = new Date(shop.closeDate);
        const openMins = open.getHours() * 60 + open.getMinutes();
        const closeMins = close.getHours() * 60 + close.getMinutes();
        return nowMins >= openMins && nowMins < closeMins;
    }
</script>

<div class="my-shops">
    <div class="header">
        <p class="description">
            Administra tus tiendas, menús y pedidos recibidos.
        </p>
        <button class="btn-refresh" onclick={loadShops} disabled={loading}>
            {#if loading}
                ...
            {:else}
                <RefreshCw size={14} style="display:inline; vertical-align:middle; margin-right: 4px;" /> Actualizar
            {/if}
        </button>
    </div>

    {#if loading}
        <div class="info">Cargando tus tiendas...</div>
    {:else if errorMsg}
        <div class="error-msg">{errorMsg}</div>
    {:else if shops.length === 0}
        <div class="empty">
            <div class="empty-icon"><Store size={48} /></div>
            <p>No tienes tiendas registradas.</p>
            <p class="empty-hint">
                Contacta con un administrador o envía una solicitud para
                convertirte en vendedor.
            </p>
        </div>
    {:else}
        <div class="shops-grid">
            {#each shops as shop}
                <button
                    class="shop-card"
                    onclick={() => goto(`/app/my-shops/${shop.id}`)}
                >
                    <div class="shop-card-header">
                        <h3>{shop.name}</h3>
                        <span
                            class="status-badge {isOpen(shop)
                                ? 'open'
                                : 'closed'}"
                        >
                            {isOpen(shop) ? "Abierto" : "Cerrado"}
                        </span>
                    </div>

                    <div class="shop-meta">
                        {#if shop.openDate && shop.closeDate}
                            <span class="meta-item"
                                ><Clock size={14} style="display:inline; vertical-align:middle; margin-right: 4px;" /> {formatTime(shop.openDate)} – {formatTime(
                                    shop.closeDate,
                                )}</span
                            >
                        {:else}
                            <span class="meta-item"><Clock size={14} style="display:inline; vertical-align:middle; margin-right: 4px;" /> Sin horario</span>
                        {/if}
                        <span class="meta-item"
                            ><MapPin size={14} style="display:inline; vertical-align:middle; margin-right: 4px;" /> {shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(
                                4,
                            )}</span
                        >
                    </div>

                    <div class="shop-card-action">Gestionar →</div>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .my-shops {
        max-width: 1000px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        gap: 1rem;
    }

    .description {
        color: #64748b;
        font-size: 1rem;
        margin: 0;
    }

    .btn-refresh {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        color: #64748b;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .info {
        text-align: center;
        color: #64748b;
        padding: 3rem;
    }

    .error-msg {
        background: #fee2e2;
        color: #991b1b;
        padding: 0.75rem 1rem;
        border-radius: 8px;
    }

    .empty {
        text-align: center;
        padding: 4rem 2rem;
        border: 2px dashed #e2e8f0;
        border-radius: 24px;
        color: #94a3b8;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .empty-icon {
        font-size: 3rem;
        opacity: 0.5;
    }

    .empty-hint {
        font-size: 0.85rem;
        max-width: 360px;
    }

    .shops-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.25rem;
    }

    .shop-card {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        border: 1.5px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        text-align: left;
        transition:
            box-shadow 0.2s,
            transform 0.15s;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        font-family: inherit;
        font-size: inherit;
    }

    .shop-card:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
    }

    .shop-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .shop-card-header h3 {
        margin: 0;
        font-size: 1.15rem;
        color: #1e293b;
    }

    .status-badge {
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: 0.75rem;
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

    .shop-meta {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .meta-item {
        font-size: 0.85rem;
        color: #64748b;
    }

    .shop-card-action {
        color: #3b82f6;
        font-weight: 600;
        font-size: 0.9rem;
        margin-top: auto;
    }
</style>
