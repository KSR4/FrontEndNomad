<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import { Star } from "lucide-svelte";

    let reviews = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let shopNames = $state<Record<string, string>>({});

    onMount(async () => {
        await loadReviews();
    });

    async function loadReviews() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.reviews.listSelf();
            if (res.ok) {
                const raw = res.data;
                reviews = Array.isArray(raw)
                    ? raw
                    : (raw?.reviews ?? raw?.data ?? []);
                reviews.sort(
                    (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                );
                await loadShopNames(reviews);
            } else {
                errorMsg = res.message || "Error al cargar las reseñas.";
            }
        } catch {
            errorMsg = "Error al cargar las reseñas.";
        } finally {
            loading = false;
        }
    }

    async function loadShopNames(list: any[]) {
        const uniqueIds = [
            ...new Set(list.map((r) => r.shopId).filter(Boolean)),
        ];
        for (const id of uniqueIds) {
            if (!shopNames[id]) {
                try {
                    const res = await api.shops.getOne(id);
                    if (res.ok && res.data?.name) {
                        shopNames[id] = res.data.name;
                    }
                } catch {}
            }
        }
    }

    function formatDate(val: string | null | undefined): string {
        if (!val) return "–";
        const d = new Date(val);
        return isNaN(d.getTime())
            ? val
            : d.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              });
    }

    function getShopName(review: any): string {
        if (review.shopId && shopNames[review.shopId]) {
            return shopNames[review.shopId];
        }
        return "Tienda";
    }
</script>

<div class="reviews-page">
    <p class="description">
        Aquí puedes ver todas las reseñas que has escrito sobre los vendedores.
    </p>

    {#if loading}
        <div class="info">Cargando tus reseñas...</div>
    {:else if errorMsg}
        <div class="error-msg">{errorMsg}</div>
    {:else if reviews.length === 0}
        <div class="empty">
            <div class="empty-icon"><Star size={48} /></div>
            <p>No has escrito ninguna reseña todavía.</p>
            <p class="empty-hint">
                Cuando recibas un pedido, podrás dejar una reseña desde tus
                pedidos.
            </p>
            <a href="/app/orders" class="btn-primary">Ir a mis pedidos</a>
        </div>
    {:else}
        <div class="reviews-list">
            {#each reviews as review}
                <div class="review-card">
                    <div class="review-header">
                        <div class="shop-name">{getShopName(review)}</div>
                        <span class="review-date"
                            >{formatDate(review.date)}</span
                        >
                    </div>
                    <p class="review-text">{review.text}</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .reviews-page {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .description {
        color: #64748b;
        font-size: 1rem;
        margin: 0;
    }

    .info {
        text-align: center;
        color: #64748b;
        padding: 3rem 1rem;
    }

    .error-msg {
        background: #fee2e2;
        color: #991b1b;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
    }

    .empty {
        margin-top: 1rem;
        padding: 4rem 2rem;
        border: 2px dashed #e2e8f0;
        border-radius: 24px;
        text-align: center;
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
        max-width: 320px;
    }

    .btn-primary {
        display: inline-block;
        margin-top: 0.75rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        text-decoration: none;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        transition:
            opacity 0.2s,
            transform 0.1s;
    }

    .btn-primary:hover {
        opacity: 0.88;
        transform: translateY(-1px);
    }

    .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .review-card {
        background: white;
        padding: 1.25rem 1.5rem;
        border-radius: 14px;
        border: 1.5px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition:
            box-shadow 0.2s,
            transform 0.15s;
    }

    .review-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
    }

    .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .shop-name {
        font-weight: 700;
        font-size: 1.05rem;
        color: #1e293b;
    }

    .review-date {
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .review-text {
        margin: 0;
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.6;
    }
</style>
