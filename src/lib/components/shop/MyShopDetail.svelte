<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import type {
        DishAddData,
        DishUpdateData,
        EventEntity,
    } from "$lib/api/client";
    import Modal from "$lib/components/layout/Modal.svelte";
    import {
        Clock,
        MapPin,
        Pencil,
        Trash2,
        Plus,
        ClipboardList,
        Package,
        Star,
        Calendar,
        User,
        RefreshCw,
    } from "lucide-svelte";

    let { shopId } = $props<{ shopId: string }>();

    let shop = $state<any>(null);
    let dishes = $state<any[]>([]);
    let orders = $state<any[]>([]);
    let reviews = $state<any[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let activeTab = $state<"menu" | "orders" | "reviews" | "events">("menu");

    let availableEvents = $state<EventEntity[]>([]);
    let selectedEventId = $state("");
    let eventSaving = $state(false);
    let eventMsg = $state("");
    let eventError = $state("");
    let showUnenrollModal = $state(false);

    let editName = $state("");
    let editOpenDate = $state("");
    let editCloseDate = $state("");
    let editLat = $state(0);
    let editLng = $state(0);
    let editSaving = $state(false);
    let editMsg = $state("");
    let editError = $state("");
    let showEditForm = $state(false);
    let locating = $state(false);

    let showAddDish = $state(false);
    let newDishName = $state("");
    let newDishDesc = $state("");
    let newDishPrice = $state(0);
    let newDishStock = $state(0);
    let newDishAvailable = $state(true);
    let addDishSaving = $state(false);
    let addDishError = $state("");

    let editingDishId = $state<string | null>(null);
    let editDishName = $state("");
    let editDishDesc = $state("");
    let editDishPrice = $state(0);
    let editDishStock = $state(0);
    let editDishAvailable = $state(true);
    let editDishSaving = $state(false);
    let editDishError = $state("");

    let deletingDishId = $state<string | null>(null);

    let ordersLoading = $state(false);
    let updatingOrderId = $state<string | null>(null);

    let reviewsLoading = $state(false);

    onMount(async () => {
        await loadShop();
        loadOrders();
        loadReviews();
        loadEvents();
    });

    async function loadEvents() {
        try {
            const res = await api.events.list();
            if (res.ok)
                availableEvents = Array.isArray(res.data)
                    ? res.data
                    : (res.data?.events ?? []);
        } catch {}
    }

    async function loadShop() {
        loading = true;
        errorMsg = "";
        try {
            const [shopRes, menuRes] = await Promise.all([
                api.shops.getOne(shopId),
                api.shops.getMenu(shopId),
            ]);
            if (shopRes.ok) {
                shop = shopRes.data;
                editName = shop.name || "";
                editOpenDate = extractTimeInput(shop.openDate);
                editCloseDate = extractTimeInput(shop.closeDate);
                editLat = shop.latitude ?? 0;
                editLng = shop.longitude ?? 0;
            }
            if (menuRes.ok) {
                dishes = menuRes.data?.dishes ?? menuRes.data ?? [];
            }
        } catch {
            errorMsg = "Error al cargar los datos de la tienda.";
        } finally {
            loading = false;
        }
    }

    async function loadOrders() {
        ordersLoading = true;
        try {
            const res = await api.orders.listByShop(shopId);
            if (res.ok) {
                const raw = res.data;
                orders = Array.isArray(raw)
                    ? raw
                    : (raw?.orders ?? raw?.data ?? []);
                orders.sort(
                    (a: any, b: any) =>
                        new Date(b.pickUpDate).getTime() -
                        new Date(a.pickUpDate).getTime(),
                );
            }
        } catch {
        } finally {
            ordersLoading = false;
        }
    }

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

    function switchTab(tab: "menu" | "orders" | "reviews" | "events") {
        activeTab = tab;
    }

    // ── Time helpers ──
    function extractTimeInput(isoOrTime: string | null): string {
        if (!isoOrTime) return "";
        try {
            const d = new Date(isoOrTime);
            if (!isNaN(d.getTime())) {
                return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            }
        } catch {}
        if (/^\d{2}:\d{2}$/.test(isoOrTime)) return isoOrTime;
        return "";
    }

    function timeToISO(time: string): string | null {
        if (!time) return null;
        const [h, m] = time.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toISOString();
    }

    function formatTime(val: string | null): string {
        if (!val) return "–";
        try {
            const d = new Date(val);
            if (!isNaN(d.getTime()))
                return d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
        } catch {}
        return val;
    }

    function formatDate(val: string | null | undefined): string {
        if (!val) return "–";
        const d = new Date(val);
        return isNaN(d.getTime()) ? val : d.toLocaleString("es-ES");
    }

    function formatReviewDate(val: string | null | undefined): string {
        if (!val) return "";
        const d = new Date(val);
        return isNaN(d.getTime())
            ? (val ?? "")
            : d.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              });
    }

    function isOpen(s: any): boolean {
        if (!s?.openDate || !s?.closeDate) return false;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const open = new Date(s.openDate);
        const close = new Date(s.closeDate);
        return (
            nowMins >= open.getHours() * 60 + open.getMinutes() &&
            nowMins < close.getHours() * 60 + close.getMinutes()
        );
    }

    async function saveShopEdit() {
        editSaving = true;
        editMsg = "";
        editError = "";
        try {
            const res = await api.shops.update(shopId, {
                name: editName,
                openDate: timeToISO(editOpenDate),
                closeDate: timeToISO(editCloseDate),
                latitude: editLat,
                longitude: editLng,
            });
            if (res.ok) {
                editMsg = "¡Datos actualizados!";
                shop = {
                    ...shop,
                    name: editName,
                    openDate: timeToISO(editOpenDate),
                    closeDate: timeToISO(editCloseDate),
                    latitude: editLat,
                    longitude: editLng,
                };
                showEditForm = false;
            } else {
                editError = res.message || "Error al guardar.";
            }
        } catch {
            editError = "Error al guardar.";
        } finally {
            editSaving = false;
        }
    }

    async function updateLocation() {
        if (!navigator.geolocation) {
            editError = "Tu navegador no soporta geolocalización.";
            return;
        }
        locating = true;
        editError = "";
        editMsg = "";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                editLat = pos.coords.latitude;
                editLng = pos.coords.longitude;
                locating = false;
                editMsg =
                    "¡Ubicación actualizada! No olvides hacer clic en 'Guardar cambios'.";
            },
            (err) => {
                editError = "No se pudo obtener tu ubicación actual.";
                locating = false;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    }

    async function bindToEvent() {
        if (!selectedEventId) {
            eventError = "Selecciona un evento.";
            return;
        }
        eventSaving = true;
        eventError = "";
        eventMsg = "";
        try {
            const res = await api.events.addShop(selectedEventId, shopId);
            if (res.ok) {
                eventMsg = "Inscrito correctamente al evento.";
            } else {
                eventError =
                    res.message ||
                    "Error al inscribir (quizás ya estás en un evento activo).";
            }
        } catch {
            eventError = "Error al inscribir.";
        } finally {
            eventSaving = false;
        }
    }

    async function unbindFromEvent() {
        eventSaving = true;
        showUnenrollModal = false;
        eventError = "";
        eventMsg = "";
        try {
            const res = await api.events.removeShop(shopId);
            if (res.ok) {
                eventMsg = "Desinscrito correctamente del evento.";
            } else {
                eventError =
                    res.message ||
                    "Error al desinscribir (quizás no estás inscrito en ninguno).";
            }
        } catch {
            eventError = "Error al desinscribir.";
        } finally {
            eventSaving = false;
        }
    }

    async function addDish() {
        if (!newDishName.trim()) {
            addDishError = "Nombre requerido.";
            return;
        }
        addDishSaving = true;
        addDishError = "";
        try {
            const data: DishAddData = {
                shopId,
                name: newDishName.trim(),
                description: newDishDesc.trim(),
                price: newDishPrice,
                stock: newDishStock,
                available: newDishAvailable,
            };
            const res = await api.dishes.add(data);
            if (res.ok) {
                const menuRes = await api.shops.getMenu(shopId);
                if (menuRes.ok)
                    dishes = menuRes.data?.dishes ?? menuRes.data ?? [];
                resetAddForm();
            } else {
                addDishError = res.message || "Error al añadir plato.";
            }
        } catch {
            addDishError = "Error al añadir plato.";
        } finally {
            addDishSaving = false;
        }
    }

    function resetAddForm() {
        showAddDish = false;
        newDishName = "";
        newDishDesc = "";
        newDishPrice = 0;
        newDishStock = 0;
        newDishAvailable = true;
        addDishError = "";
    }

    function startEditDish(dish: any) {
        editingDishId = dish.id;
        editDishName = dish.name;
        editDishDesc = dish.description || "";
        editDishPrice = dish.price;
        editDishStock = dish.stock;
        editDishAvailable = dish.available;
        editDishError = "";
    }

    function cancelEditDish() {
        editingDishId = null;
        editDishError = "";
    }

    async function saveEditDish() {
        if (!editingDishId) return;
        editDishSaving = true;
        editDishError = "";
        try {
            const data: DishUpdateData = {
                name: editDishName.trim(),
                description: editDishDesc.trim(),
                price: editDishPrice,
                stock: editDishStock,
                available: editDishAvailable,
            };
            const res = await api.dishes.update(editingDishId, data);
            if (res.ok) {
                const idx = dishes.findIndex((d) => d.id === editingDishId);
                if (idx >= 0) dishes[idx] = { ...dishes[idx], ...data };
                editingDishId = null;
            } else {
                editDishError = res.message || "Error al actualizar plato.";
            }
        } catch {
            editDishError = "Error al actualizar plato.";
        } finally {
            editDishSaving = false;
        }
    }

    async function deleteDish(dishId: string) {
        deletingDishId = dishId;
        try {
            const res = await api.dishes.delete(dishId);
            if (res.ok) {
                dishes = dishes.filter((d) => d.id !== dishId);
            }
        } catch {
        } finally {
            deletingDishId = null;
        }
    }

    function getNextState(current: string): string | null {
        switch (current?.toUpperCase()) {
            case "PENDING":
                return "PREPARING";
            case "CONFIRMED":
                return "PREPARING";
            case "PREPARING":
                return "READY";
            case "READY":
                return "DELIVERED";
            default:
                return null;
        }
    }

    function getStateLabel(s: string): string {
        switch (s?.toUpperCase()) {
            case "PENDING":
                return "Pendiente";
            case "CANCELLED":
                return "Cancelado";
            case "CONFIRMED":
                return "Confirmado";
            case "PREPARING":
                return "Preparando";
            case "READY":
                return "Listo";
            case "DELIVERED":
                return "Entregado";
            default:
                return s;
        }
    }

    function getStateClass(s: string): string {
        switch (s?.toUpperCase()) {
            case "PENDING":
                return "st-pending";
            case "CANCELLED":
                return "st-cancelled";
            case "CONFIRMED":
                return "st-confirmed";
            case "PREPARING":
                return "st-preparing";
            case "READY":
                return "st-ready";
            case "DELIVERED":
                return "st-delivered";
            default:
                return "";
        }
    }

    function getNextLabel(current: string): string {
        switch (current?.toUpperCase()) {
            case "PENDING":
                return "Comenzar preparación";
            case "CONFIRMED":
                return "Comenzar preparación";
            case "PREPARING":
                return "Marcar como listo";
            case "READY":
                return "Marcar como entregado";
            default:
                return "";
        }
    }

    async function advanceOrder(orderId: string, currentState: string) {
        const next = getNextState(currentState);
        if (!next) return;
        updatingOrderId = orderId;
        try {
            const res = await api.orders.updateState(orderId, next as any);
            if (res.ok) {
                const idx = orders.findIndex((o) => o.id === orderId);
                if (idx >= 0) orders[idx] = { ...orders[idx], state: next };
            }
        } catch {
        } finally {
            updatingOrderId = null;
        }
    }

    function getOrderDishes(order: any): any[] {
        return Array.isArray(order.dishes) ? order.dishes : [];
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
</script>

<div class="detail-page">
    {#if loading}
        <div class="info">Cargando tienda...</div>
    {:else if errorMsg}
        <div class="error-msg">{errorMsg}</div>
    {:else if shop}
        <a href="/app/my-shops" class="btn-back">← Volver a Mis Negocios</a>

        <header class="shop-header">
            <div>
                <h1>{shop.name}</h1>
                <div class="header-meta">
                    {#if shop.openDate && shop.closeDate}
                        <span
                            ><Clock
                                size={14}
                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                            />
                            {formatTime(shop.openDate)} – {formatTime(
                                shop.closeDate,
                            )}</span
                        >
                    {:else}
                        <span
                            ><Clock
                                size={14}
                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                            /> Sin horario</span
                        >
                    {/if}
                    <span
                        ><MapPin
                            size={14}
                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                        />
                        {shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(
                            4,
                        )}</span
                    >
                </div>
            </div>
            <div class="header-actions">
                <span class="status-badge {isOpen(shop) ? 'open' : 'closed'}">
                    {isOpen(shop) ? "Abierto" : "Cerrado"}
                </span>
                <button
                    class="btn-edit-shop"
                    onclick={() => (showEditForm = !showEditForm)}
                >
                    {#if showEditForm}
                        Cancelar
                    {:else}
                        <Pencil
                            size={14}
                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                        /> Editar
                    {/if}
                </button>
            </div>
        </header>

        {#if showEditForm}
            <div class="edit-form-card">
                <h3>Editar datos de la tienda</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="edit-name">Nombre</label>
                        <input
                            id="edit-name"
                            type="text"
                            bind:value={editName}
                            disabled={editSaving}
                        />
                    </div>
                    <div class="form-group">
                        <label for="edit-open">Hora de apertura</label>
                        <input
                            id="edit-open"
                            type="time"
                            bind:value={editOpenDate}
                            disabled={editSaving}
                        />
                    </div>
                    <div class="form-group">
                        <label for="edit-close">Hora de cierre</label>
                        <input
                            id="edit-close"
                            type="time"
                            bind:value={editCloseDate}
                            disabled={editSaving}
                        />
                    </div>
                    <div class="form-group">
                        <label for="edit-lat">Latitud</label>
                        <input
                            id="edit-lat"
                            type="number"
                            step="0.0001"
                            bind:value={editLat}
                            disabled={editSaving}
                        />
                    </div>
                    <div class="form-group">
                        <label for="edit-lng">Longitud</label>
                        <input
                            id="edit-lng"
                            type="number"
                            step="0.0001"
                            bind:value={editLng}
                            disabled={editSaving}
                        />
                    </div>
                    <div class="form-group full-width">
                        <button
                            type="button"
                            class="btn-location"
                            onclick={updateLocation}
                            disabled={locating || editSaving}
                        >
                            {#if locating}
                                Obteniendo ubicación...
                            {:else}
                                <MapPin
                                    size={16}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                /> Usar mi ubicación actual
                            {/if}
                        </button>
                    </div>
                </div>
                {#if editError}<div class="form-error">{editError}</div>{/if}
                {#if editMsg}<div class="form-success">{editMsg}</div>{/if}
                <button
                    class="btn-save"
                    onclick={saveShopEdit}
                    disabled={editSaving}
                >
                    {editSaving ? "Guardando…" : "Guardar cambios"}
                </button>
            </div>
        {/if}

        <div class="tabs">
            <button
                class="tab"
                class:active={activeTab === "menu"}
                onclick={() => switchTab("menu")}
            >
                <ClipboardList
                    size={18}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Menú
            </button>
            <button
                class="tab"
                class:active={activeTab === "orders"}
                onclick={() => switchTab("orders")}
            >
                <Package
                    size={18}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Pedidos
            </button>
            <button
                class="tab"
                class:active={activeTab === "reviews"}
                onclick={() => switchTab("reviews")}
            >
                <Star
                    size={18}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Reseñas
            </button>
            <button
                class="tab"
                class:active={activeTab === "events"}
                onclick={() => switchTab("events")}
            >
                <Calendar
                    size={18}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Eventos
            </button>
        </div>

        {#if activeTab === "menu"}
            <div class="tab-content">
                <div class="tab-header">
                    <h2>Platos ({dishes.length})</h2>
                    <button
                        class="btn-add"
                        onclick={() => (showAddDish = !showAddDish)}
                    >
                        {#if showAddDish}
                            Cancelar
                        {:else}
                            <Plus
                                size={16}
                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                            /> Añadir plato
                        {/if}
                    </button>
                </div>

                {#if showAddDish}
                    <div class="dish-form-card">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="new-name">Nombre</label>
                                <input
                                    id="new-name"
                                    type="text"
                                    bind:value={newDishName}
                                    placeholder="Ej. Hamburguesa"
                                    disabled={addDishSaving}
                                />
                            </div>
                            <div class="form-group">
                                <label for="new-desc">Descripción</label>
                                <input
                                    id="new-desc"
                                    type="text"
                                    bind:value={newDishDesc}
                                    placeholder="Ingredientes, alérgenos..."
                                    disabled={addDishSaving}
                                />
                            </div>
                            <div class="form-group">
                                <label for="new-price">Precio (€)</label>
                                <input
                                    id="new-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    bind:value={newDishPrice}
                                    disabled={addDishSaving}
                                />
                            </div>
                            <div class="form-group">
                                <label for="new-stock">Stock</label>
                                <input
                                    id="new-stock"
                                    type="number"
                                    min="0"
                                    bind:value={newDishStock}
                                    disabled={addDishSaving}
                                />
                            </div>
                            <div class="form-group check-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        bind:checked={newDishAvailable}
                                        disabled={addDishSaving}
                                    />
                                    Disponible
                                </label>
                            </div>
                        </div>
                        {#if addDishError}<div class="form-error">
                                {addDishError}
                            </div>{/if}
                        <button
                            class="btn-save"
                            onclick={addDish}
                            disabled={addDishSaving}
                        >
                            {addDishSaving ? "Añadiendo…" : "Añadir plato"}
                        </button>
                    </div>
                {/if}

                {#if dishes.length === 0}
                    <div class="empty-tab">
                        No hay platos en el menú. Añade uno.
                    </div>
                {:else}
                    <div class="dishes-list">
                        {#each dishes as dish (dish.id)}
                            <div
                                class="dish-row"
                                class:unavailable={!dish.available ||
                                    dish.stock <= 0}
                            >
                                {#if editingDishId === dish.id}
                                    <div class="dish-edit-form">
                                        <div class="form-grid compact">
                                            <div class="form-group">
                                                <label for="ed-name"
                                                    >Nombre</label
                                                >
                                                <input
                                                    id="ed-name"
                                                    type="text"
                                                    bind:value={editDishName}
                                                    disabled={editDishSaving}
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label for="ed-desc"
                                                    >Descripción</label
                                                >
                                                <input
                                                    id="ed-desc"
                                                    type="text"
                                                    bind:value={editDishDesc}
                                                    disabled={editDishSaving}
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label for="ed-price"
                                                    >Precio (€)</label
                                                >
                                                <input
                                                    id="ed-price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    bind:value={editDishPrice}
                                                    disabled={editDishSaving}
                                                />
                                            </div>
                                            <div class="form-group">
                                                <label for="ed-stock"
                                                    >Stock</label
                                                >
                                                <input
                                                    id="ed-stock"
                                                    type="number"
                                                    min="0"
                                                    bind:value={editDishStock}
                                                    disabled={editDishSaving}
                                                />
                                            </div>
                                            <div class="form-group check-group">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        bind:checked={
                                                            editDishAvailable
                                                        }
                                                        disabled={editDishSaving}
                                                    />
                                                    Disponible
                                                </label>
                                            </div>
                                        </div>
                                        {#if editDishError}<div
                                                class="form-error"
                                            >
                                                {editDishError}
                                            </div>{/if}
                                        <div class="edit-dish-actions">
                                            <button
                                                class="btn-cancel-sm"
                                                onclick={cancelEditDish}
                                                disabled={editDishSaving}
                                                >Cancelar</button
                                            >
                                            <button
                                                class="btn-save-sm"
                                                onclick={saveEditDish}
                                                disabled={editDishSaving}
                                            >
                                                {editDishSaving
                                                    ? "…"
                                                    : "Guardar"}
                                            </button>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="dish-display">
                                        <div class="dish-main">
                                            <strong>{dish.name}</strong>
                                            <span class="dish-desc"
                                                >{dish.description || ""}</span
                                            >
                                        </div>
                                        <div class="dish-stats">
                                            <span class="dish-price"
                                                >{dish.price?.toFixed(2)}€</span
                                            >
                                            <span class="dish-stock"
                                                >Stock: {dish.stock}</span
                                            >
                                            <span
                                                class="dish-avail {dish.available
                                                    ? 'yes'
                                                    : 'no'}"
                                            >
                                                {dish.available
                                                    ? "✓ Disponible"
                                                    : "✗ No disponible"}
                                            </span>
                                        </div>
                                        <div class="dish-actions">
                                            <button
                                                class="btn-icon"
                                                title="Editar"
                                                onclick={() =>
                                                    startEditDish(dish)}
                                                ><Pencil size={14} /></button
                                            >
                                            <button
                                                class="btn-icon danger"
                                                title="Eliminar"
                                                onclick={() =>
                                                    deleteDish(dish.id)}
                                                disabled={deletingDishId ===
                                                    dish.id}
                                            >
                                                {#if deletingDishId === dish.id}
                                                    …
                                                {:else}
                                                    <Trash2 size={14} />
                                                {/if}
                                            </button>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}

        {#if activeTab === "events"}
            <div class="tab-content">
                <div class="tab-header">
                    <h2>Gestión de Eventos</h2>
                </div>
                <div class="events-card">
                    <p class="events-info">
                        Puedes inscribir tu tienda a un evento para que los
                        clientes te encuentren y compren desde allí.
                        <strong>Importante:</strong> Tu tienda solo puede estar en
                        un evento activo a la vez.
                    </p>

                    <div class="event-actions">
                        <div class="form-group" style="flex: 1;">
                            <label for="event-select"
                                >Selecciona un evento disponible</label
                            >
                            <select
                                id="event-select"
                                bind:value={selectedEventId}
                                disabled={eventSaving}
                                class="event-select"
                            >
                                <option value="">-- Elige un evento --</option>
                                {#each availableEvents as ev}
                                    <option value={ev.id}
                                        >{ev.name} ({new Date(
                                            ev.startDate,
                                        ).toLocaleDateString()})</option
                                    >
                                {/each}
                            </select>
                        </div>
                        <button
                            class="btn-save"
                            onclick={bindToEvent}
                            disabled={eventSaving || !selectedEventId}
                        >
                            Inscribirse
                        </button>
                    </div>

                    <div class="event-actions mt-3">
                        <p
                            class="events-info"
                            style="margin-bottom:0.5rem; flex: 1;"
                        >
                            Si ya estás en un evento o ha finalizado, puedes
                            desinscribirte aquí.
                        </p>
                        <button
                            class="btn-cancel"
                            onclick={() => (showUnenrollModal = true)}
                            disabled={eventSaving}
                        >
                            Desvincular del Evento Actual
                        </button>
                    </div>

                    {#if eventError}<div class="form-error mt-2">
                            {eventError}
                        </div>{/if}
                    {#if eventMsg}<div class="form-success mt-2">
                            {eventMsg}
                        </div>{/if}
                </div>
            </div>
        {/if}

        {#if activeTab === "orders"}
            <div class="tab-content">
                <div class="tab-header">
                    <h2>Pedidos recibidos</h2>
                    <button
                        class="btn-refresh-sm"
                        onclick={loadOrders}
                        disabled={ordersLoading}
                    >
                        {#if ordersLoading}
                            ...
                        {:else}
                            <RefreshCw
                                size={14}
                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                            /> Actualizar
                        {/if}
                    </button>
                </div>

                {#if ordersLoading}
                    <div class="info">Cargando pedidos...</div>
                {:else if orders.length === 0}
                    <div class="empty-tab">No hay pedidos todavía.</div>
                {:else}
                    <div class="orders-list">
                        {#each orders as order (order.id)}
                            <div class="order-row">
                                <div class="order-top">
                                    <div class="order-info">
                                        <span class="order-id"
                                            >#{order.id?.slice(-6)}</span
                                        >
                                        <span class="order-date"
                                            >{formatDate(
                                                order.pickUpDate,
                                            )}</span
                                        >
                                        <div
                                            class="order-user"
                                            style="font-size: 0.9rem; font-weight: 600; color: #475569; margin-top: 0.2rem;"
                                        >
                                            <User
                                                size={14}
                                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                                            />
                                            {order.user?.username ??
                                                order.username ??
                                                "Usuario"}
                                        </div>
                                    </div>
                                    <span
                                        class="state-badge {getStateClass(
                                            order.state,
                                        )}"
                                    >
                                        {getStateLabel(order.state)}
                                    </span>
                                </div>

                                <div class="order-dishes">
                                    {#each getOrderDishes(order) as item}
                                        <span class="order-dish-chip"
                                            >{item.quantity}x {item.name}</span
                                        >
                                    {/each}
                                </div>

                                {#if order.totalPrice != null}
                                    <div class="order-total">
                                        Total: <strong
                                            >{order.totalPrice.toFixed(
                                                2,
                                            )}€</strong
                                        >
                                    </div>
                                {/if}

                                {#if getNextState(order.state)}
                                    <button
                                        class="btn-advance"
                                        onclick={() =>
                                            advanceOrder(order.id, order.state)}
                                        disabled={updatingOrderId === order.id}
                                    >
                                        {updatingOrderId === order.id
                                            ? "Actualizando…"
                                            : getNextLabel(order.state)}
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}

        {#if activeTab === "reviews"}
            <div class="tab-content">
                <div class="tab-header">
                    <h2>Reseñas</h2>
                    <button
                        class="btn-refresh-sm"
                        onclick={loadReviews}
                        disabled={reviewsLoading}
                    >
                        {#if reviewsLoading}
                            ...
                        {:else}
                            <RefreshCw
                                size={14}
                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                            /> Actualizar
                        {/if}
                    </button>
                </div>

                {#if reviewsLoading}
                    <div class="info">Cargando reseñas...</div>
                {:else if reviews.length === 0}
                    <div class="empty-tab">No hay reseñas todavía.</div>
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
                                            >{review.username ??
                                                "Usuario"}</span
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
                                            <span class="review-dish-chip"
                                                >{dish.quantity}x {dish.name}</span
                                            >
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<Modal
    title="Desinscribirse del evento"
    show={showUnenrollModal}
    onClose={() => (showUnenrollModal = false)}
>
    <p>¿Seguro que deseas desvincular tu tienda del evento actual?</p>
    <p class="warning-text">
        Se cancelarán o afectarán tus pedidos pendientes asociados a este
        evento.
    </p>

    <div
        style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;"
    >
        <button
            class="btn-cancel-sm"
            onclick={() => (showUnenrollModal = false)}
            disabled={eventSaving}
        >
            Cancelar
        </button>
        <button
            class="btn-save-sm danger-bg"
            onclick={unbindFromEvent}
            disabled={eventSaving}
            style="background: #ef4444; color: white;"
        >
            {eventSaving ? "Desvinculando..." : "Sí, desinscribir"}
        </button>
    </div>
</Modal>

<style>
    .detail-page {
        max-width: 900px;
        margin: 0 auto;
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
        margin-bottom: 1.5rem;
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
        gap: 1rem;
    }
    .shop-header h1 {
        margin: 0 0 0.4rem 0;
    }
    .header-meta {
        display: flex;
        gap: 1.25rem;
        font-size: 0.88rem;
        color: #64748b;
    }
    .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-shrink: 0;
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

    .btn-edit-shop {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.4rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        color: #475569;
    }
    .btn-edit-shop:hover {
        background: #f1f5f9;
    }

    .edit-form-card,
    .dish-form-card,
    .events-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .edit-form-card h3 {
        margin: 0 0 1rem 0;
        font-size: 1.05rem;
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.9rem;
    }
    .form-grid.compact {
        gap: 0.6rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    .form-group label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
    }
    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group input[type="time"],
    .event-select {
        padding: 0.55rem 0.75rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        color: #1e293b;
        background: #f8fafc;
        outline: none;
        transition: border-color 0.2s;
    }
    .form-group.full-width {
        grid-column: 1 / -1;
        align-items: flex-start;
    }
    .form-group input:focus,
    .event-select:focus {
        border-color: #3b82f6;
        background: #fff;
    }
    .form-group input:disabled {
        opacity: 0.6;
    }

    .check-group label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        cursor: pointer;
    }
    .check-group input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #3b82f6;
    }

    .form-error {
        background: #fee2e2;
        color: #991b1b;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }
    .form-success {
        background: #dcfce7;
        color: #166534;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }

    .btn-location {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
        padding: 0.55rem 0.9rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.2s;
        margin-top: 0.3rem;
    }
    .btn-location:hover:not(:disabled) {
        background: #dcfce7;
    }
    .btn-location:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-save {
        margin-top: 1rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 0.55rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    .btn-save:hover:not(:disabled) {
        opacity: 0.88;
    }
    .btn-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-cancel {
        background: #fee2e2;
        color: #991b1b;
        border: none;
        padding: 0.55rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid #e2e8f0;
        overflow-x: auto;
    }
    .tab {
        background: none;
        border: none;
        padding: 0.75rem 1.25rem;
        font-weight: 600;
        font-size: 0.95rem;
        color: #94a3b8;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s;
    }
    .tab:hover {
        color: #475569;
    }
    .tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }

    .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
    }
    .tab-header h2 {
        margin: 0;
        font-size: 1.1rem;
    }

    .empty-tab {
        text-align: center;
        padding: 3rem 2rem;
        border: 2px dashed #e2e8f0;
        border-radius: 16px;
        color: #94a3b8;
    }

    .btn-add {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        padding: 0.45rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
    }
    .btn-add:hover {
        opacity: 0.88;
    }

    .btn-refresh-sm {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.35rem 0.7rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        color: #64748b;
        font-size: 0.8rem;
    }

    .dishes-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .dish-row {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        transition: box-shadow 0.2s;
    }
    .dish-row:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .dish-row.unavailable {
        opacity: 0.6;
    }

    .dish-display {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .dish-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }
    .dish-main strong {
        font-size: 1rem;
        color: #1e293b;
    }
    .dish-desc {
        font-size: 0.82rem;
        color: #94a3b8;
    }

    .dish-stats {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-shrink: 0;
    }
    .dish-price {
        font-weight: 700;
        color: #3b82f6;
        font-size: 1rem;
    }
    .dish-stock {
        font-size: 0.8rem;
        color: #94a3b8;
    }
    .dish-avail {
        font-size: 0.78rem;
        font-weight: 600;
    }
    .dish-avail.yes {
        color: #16a34a;
    }
    .dish-avail.no {
        color: #dc2626;
    }

    .dish-actions {
        display: flex;
        gap: 0.4rem;
        flex-shrink: 0;
    }
    .btn-icon {
        background: none;
        border: 1.5px solid #e2e8f0;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
    }
    .btn-icon:hover {
        background: #f1f5f9;
    }
    .btn-icon.danger:hover {
        background: #fee2e2;
    }

    .dish-edit-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .edit-dish-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    .btn-cancel-sm {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        color: #64748b;
        font-size: 0.82rem;
    }
    .btn-save-sm {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.82rem;
        cursor: pointer;
    }
    .btn-save-sm:disabled {
        opacity: 0.6;
    }

    .orders-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .order-row {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.15rem 1.35rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .order-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .order-info {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }
    .order-id {
        font-weight: 700;
        color: #1e293b;
        font-size: 0.95rem;
        font-family: monospace;
    }
    .order-date {
        font-size: 0.82rem;
        color: #94a3b8;
    }

    .state-badge {
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .st-pending {
        background: #fef9c3;
        color: #854d0e;
    }
    .st-cancelled {
        background: #fee2e2;
        color: #991b1b;
    }
    .st-confirmed {
        background: #f3e8ff;
        color: #6b21a8;
    }
    .st-preparing {
        background: #e0f2fe;
        color: #0369a1;
    }
    .st-ready {
        background: #dcfce7;
        color: #166534;
        border: 1.5px solid #22c55e;
    }
    .st-delivered {
        background: #f1f5f9;
        color: #475569;
    }

    .order-dishes {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }
    .order-dish-chip {
        background: #f1f5f9;
        color: #475569;
        padding: 0.15rem 0.55rem;
        border-radius: 6px;
        font-size: 0.8rem;
    }
    .order-total {
        font-size: 0.9rem;
        color: #64748b;
    }
    .order-total strong {
        color: #1e293b;
    }

    .btn-advance {
        align-self: flex-end;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 0.45rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.82rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    .btn-advance:hover:not(:disabled) {
        opacity: 0.88;
    }
    .btn-advance:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .reviews-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .review-card {
        background: #f8fafc;
        padding: 1.15rem 1.35rem;
        border-radius: 12px;
        border: 1.5px solid #e2e8f0;
    }
    .review-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
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
    .review-dish-chip {
        background: #e2e8f0;
        color: #475569;
        padding: 0.15rem 0.55rem;
        border-radius: 6px;
        font-size: 0.78rem;
    }

    @media (max-width: 640px) {
        .form-grid {
            grid-template-columns: 1fr;
        }
        .shop-header {
            flex-direction: column;
        }
        .header-actions {
            justify-content: flex-start;
        }
        .dish-display {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        .dish-stats {
            flex-wrap: wrap;
        }
    }

    .events-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1.5px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .events-info {
        font-size: 0.95rem;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }
    .event-actions {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        flex-wrap: wrap;
    }
    .event-select {
        width: 100%;
        padding: 0.65rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        font-family: inherit;
        font-size: 0.95rem;
        outline: none;
    }
    .event-select:focus {
        border-color: #3b82f6;
        background: white;
    }
    .btn-cancel {
        background: #f1f5f9;
        color: #ef4444;
        border: 1.5px solid #fecaca;
        padding: 0.65rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-cancel:hover:not(:disabled) {
        background: #fee2e2;
    }
    .btn-cancel:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .mt-3 {
        margin-top: 1.5rem;
    }
    .mt-2 {
        margin-top: 1rem;
    }
    .mb-0 {
        margin-bottom: 0 !important;
    }
</style>
