<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import {
        RefreshCw,
        CheckCircle2,
        AlertTriangle,
        X,
        Store,
        MapPin,
        User,
        Mail,
        Clock,
    } from "lucide-svelte";

    let tickets: any[] = $state([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let acceptingId = $state<string | null>(null);
    let acceptError = $state("");
    let acceptSuccess = $state("");

    onMount(async () => {
        await loadTickets();
    });

    async function loadTickets() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.tickets.list();
            if (res?.error) throw new Error(res.error);
            tickets = Array.isArray(res)
                ? res
                : (res?.tickets ?? res?.data ?? []);
        } catch (err: any) {
            errorMsg = err.message ?? "Error al cargar los tickets.";
        } finally {
            loading = false;
        }
    }

    async function acceptTicket(ticket: any) {
        acceptingId = ticket.id;
        acceptError = "";
        acceptSuccess = "";

        try {
            const actualUserId = ticket.userID;

            if (!actualUserId) {
                throw new Error(
                    "No se ha encontrado el ID del usuario en el ticket (userID).",
                );
            }

            const res = await api.tickets.accept(
                ticket.shopName,
                actualUserId,
                ticket.latitude,
                ticket.longitude,
            );
            if (!res.ok) {
                throw new Error(res.message || "Error al crear la tienda.");
            }

            const acceptRes = await api.tickets.updateAccepted(ticket.id, true);
            if (!acceptRes.ok) {
                console.error(
                    "Error al marcar ticket como aceptado:",
                    acceptRes.message,
                );
            }

            const roleRes = await api.user.updateRole(actualUserId, "OWNER");
            if (!roleRes.ok) {
                console.error(
                    "Error al actualizar rol a OWNER:",
                    roleRes.message,
                );
            }
            acceptSuccess = `¡Tienda "${ticket.shopName}" creada correctamente!`;
            tickets = tickets.map((t) =>
                t.id === ticket.id ? { ...t, accepted: true } : t,
            );
        } catch (err: any) {
            acceptError = err.message ?? "Error al aceptar el ticket.";
        } finally {
            acceptingId = null;
        }
    }
</script>

<div class="admin-tickets">
    <div class="header-row">
        <button class="refresh-btn" onclick={loadTickets} disabled={loading}>
            {#if loading}
                <span class="spin-inline"><RefreshCw size={14} /></span> Cargando…
            {:else}
                <RefreshCw
                    size={14}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Actualizar
            {/if}
        </button>
    </div>

    {#if acceptSuccess}
        <div class="alert success" role="alert">
            <span class="alert-icon"><CheckCircle2 size={18} /></span>
            {acceptSuccess}
            <button
                class="alert-close"
                onclick={() => (acceptSuccess = "")}
                aria-label="Cerrar"
            >
                <X size={16} />
            </button>
        </div>
    {/if}

    {#if acceptError}
        <div class="alert error" role="alert">
            <span class="alert-icon"><AlertTriangle size={18} /></span>
            {acceptError}
            <button
                class="alert-close"
                onclick={() => (acceptError = "")}
                aria-label="Cerrar"
            >
                <X size={16} />
            </button>
        </div>
    {/if}

    {#if errorMsg}
        <div class="alert error" role="alert">{errorMsg}</div>
    {/if}

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets…</p>
        </div>
    {:else if tickets.length === 0}
        <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No hay tickets pendientes.</p>
        </div>
    {:else}
        <div class="tickets-grid">
            {#each tickets as ticket}
                <div class="ticket-card" class:accepted={ticket.accepted}>
                    <div class="ticket-header">
                        <span class="store-name">
                            <Store
                                size={18}
                                style="display:inline; vertical-align:middle; margin-right: 4px;"
                            />
                            {ticket.shopName ?? ticket.name ?? "Sin nombre"}
                        </span>
                        <span class="ticket-id"
                            >Ticket ID: #{ticket.id ?? "—"}</span
                        >
                        <span class="ticket-id"
                            >User ID: {ticket.userID ??
                                ticket.userId ??
                                "—"}</span
                        >
                    </div>

                    <p class="ticket-message">
                        {ticket.message ?? ticket.description ?? "Sin mensaje"}
                    </p>

                    {#if ticket.latitude != null && ticket.longitude != null}
                        <div class="ticket-location">
                            <span class="location-icon"
                                ><MapPin size={14} /></span
                            >
                            <span>
                                {Number(ticket.latitude).toFixed(4)}, {Number(
                                    ticket.longitude,
                                ).toFixed(4)}
                            </span>
                        </div>
                    {/if}

                    <div class="ticket-meta">
                        {#if ticket.user || ticket.username}
                            <span class="meta-item user-meta">
                                {#if ticket.user?.avatar || ticket.avatar}
                                    {@const avatarData =
                                        ticket.user?.avatar ?? ticket.avatar}
                                    <img
                                        src={avatarData.startsWith("data:") ||
                                        avatarData.startsWith("http")
                                            ? avatarData
                                            : `data:image/jpeg;base64,${avatarData}`}
                                        alt="Avatar de {ticket.user?.username ??
                                            ticket.username}"
                                        class="ticket-avatar"
                                    />
                                {:else}
                                    <span class="meta-icon"
                                        ><User size={14} /></span
                                    >
                                {/if}
                                {ticket.user?.username ??
                                    ticket.username ??
                                    "Desconocido"}
                            </span>
                        {/if}
                        {#if ticket.user?.email || ticket.email}
                            <span class="meta-item">
                                <Mail
                                    size={14}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                />
                                {ticket.user?.email ?? ticket.email}
                            </span>
                        {/if}
                        {#if ticket.createdAt || ticket.created_at}
                            <span class="meta-item">
                                <Clock
                                    size={14}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                />
                                {new Date(
                                    ticket.createdAt ?? ticket.created_at,
                                ).toLocaleDateString("es-ES")}
                            </span>
                        {/if}
                    </div>

                    <div class="ticket-actions">
                        {#if ticket.accepted}
                            <span class="status-badge status-approved">
                                ✓ Aceptado
                            </span>
                        {:else}
                            <button
                                class="accept-btn"
                                onclick={() => acceptTicket(ticket)}
                                disabled={acceptingId === ticket.id}
                            >
                                {#if acceptingId === ticket.id}
                                    <span class="btn-spinner"></span>
                                    Creando tienda…
                                {:else}
                                    <CheckCircle2 size={18} /> Aceptar y crear tienda
                                {/if}
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .admin-tickets {
        max-width: 900px;
        margin: 0 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .refresh-btn {
        padding: 0.5rem 1rem;
        background: #f1f5f9;
        border: 1.5px solid #e2e8f0;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
        background: #e2e8f0;
        color: #1e293b;
    }

    .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .alert {
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    }

    .alert-icon {
        flex-shrink: 0;
    }

    .alert-close {
        margin-left: auto;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.6;
        transition: opacity 0.2s;
        padding: 0 0.25rem;
    }

    .alert-close:hover {
        opacity: 1;
    }

    .alert.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    .alert.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
    }

    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 3rem;
        color: #64748b;
    }

    .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 3rem;
        color: #94a3b8;
    }

    .empty-icon {
        font-size: 3rem;
    }

    .tickets-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .ticket-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition:
            box-shadow 0.2s,
            border-color 0.2s;
    }

    .ticket-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    }

    .ticket-card.accepted {
        border-color: #86efac;
        background: #fafffe;
    }

    .ticket-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .store-name {
        font-weight: 700;
        font-size: 1.05rem;
        color: #1e293b;
    }

    .ticket-id {
        font-size: 0.8rem;
        color: #94a3b8;
        font-weight: 600;
    }

    .ticket-message {
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.6;
        margin: 0;
    }

    .ticket-location {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.82rem;
        color: #3b82f6;
        font-weight: 500;
        background: #eff6ff;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        width: fit-content;
    }

    .location-icon {
        font-size: 0.9rem;
    }

    .ticket-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .meta-item {
        font-size: 0.82rem;
        color: #64748b;
    }

    .user-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .ticket-avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
    }

    .meta-icon {
        font-size: 1rem;
    }
    .ticket-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-top: 0.5rem;
        border-top: 1px solid #f1f5f9;
    }

    .accept-btn {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
        border: none;
        padding: 0.55rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition:
            opacity 0.2s,
            transform 0.1s,
            box-shadow 0.2s;
    }

    .accept-btn:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);
    }

    .accept-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
        margin-right: 6px;
        vertical-align: middle;
    }

    .spin-inline {
        display: inline-block;
        animation: spin 1s linear infinite;
        vertical-align: middle;
        margin-right: 4px;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.02em;
    }

    .status-approved {
        background: #dcfce7;
        color: #166534;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
