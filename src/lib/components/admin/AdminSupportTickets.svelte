<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import type {
        SupportTicketEntity,
        SupportTicketStatus,
    } from "$lib/api/client";

    let tickets = $state<SupportTicketEntity[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let updatingId = $state<string | null>(null);
    let updateError = $state("");
    let updateSuccess = $state("");

    let resolvingTicketId = $state<string | null>(null);
    let resolutionMessage = $state("");

    let filter = $state<"ALL" | SupportTicketStatus>("ALL");

    onMount(async () => {
        await loadTickets();
    });

    async function loadTickets() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.supportTickets.listAll();
            if (!res.ok)
                throw new Error(res.message || "Error al cargar tickets.");
            const raw = res.data ?? res;
            tickets = Array.isArray(raw) ? raw : [];
            tickets = tickets.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );
        } catch (err: any) {
            errorMsg = err.message ?? "Error inesperado.";
        } finally {
            loading = false;
        }
    }

    async function updateStatus(
        ticket: SupportTicketEntity,
        status: SupportTicketStatus,
    ) {
        if (ticket.status === status) return;
        updatingId = ticket.id;
        updateError = "";
        updateSuccess = "";
        try {
            const res = await api.supportTickets.updateStatus(
                ticket.id,
                status,
            );
            if (!res.ok)
                throw new Error(
                    res.message || "Error al actualizar el estado.",
                );
            tickets = tickets.map((t) =>
                t.id === ticket.id ? { ...t, status } : t,
            );
            updateSuccess = `Ticket actualizado a "${statusLabel(status)}".`;
            setTimeout(() => (updateSuccess = ""), 3000);
        } catch (err: any) {
            updateError = err.message ?? "Error inesperado.";
        } finally {
            updatingId = null;
        }
    }

    function startResolveContext(ticket: SupportTicketEntity) {
        if (ticket.status === "CLOSED") return;
        resolvingTicketId = ticket.id;
        resolutionMessage = "";
    }

    function cancelResolveContext() {
        resolvingTicketId = null;
        resolutionMessage = "";
    }

    async function confirmResolve(
        ticket: SupportTicketEntity,
        notify: boolean,
    ) {
        updatingId = ticket.id;
        updateError = "";
        updateSuccess = "";
        try {
            const res = await api.supportTickets.updateStatus(
                ticket.id,
                "CLOSED",
            );
            if (!res.ok)
                throw new Error(
                    res.message || "Error al actualizar el estado.",
                );

            if (notify && resolutionMessage.trim().length > 0) {
                if (ticket.userId) {
                    await api.notifications.create(
                        `Ticket Resuelto: ${ticket.subject}`,
                        resolutionMessage.trim(),
                        ticket.userId,
                    );
                }
            }

            tickets = tickets.map((t) =>
                t.id === ticket.id ? { ...t, status: "CLOSED" } : t,
            );
            updateSuccess = notify
                ? "Ticket cerrado y usuario notificado."
                : "Ticket cerrado sin notificar.";
            setTimeout(() => (updateSuccess = ""), 3000);
        } catch (err: any) {
            updateError = err.message ?? "Error inesperado.";
        } finally {
            updatingId = null;
            resolvingTicketId = null;
        }
    }

    function statusLabel(status: SupportTicketStatus): string {
        return (
            { OPEN: "Abierto", IN_PROGRESS: "En revisión", CLOSED: "Cerrado" }[
                status
            ] ?? status
        );
    }

    function statusClass(status: SupportTicketStatus): string {
        return (
            {
                OPEN: "status-open",
                IN_PROGRESS: "status-progress",
                CLOSED: "status-closed",
            }[status] ?? ""
        );
    }

    function formatDate(d: Date | string): string {
        return new Date(d).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getAvatarSrc(avatar: string | null | undefined): string | null {
        if (!avatar) return null;
        return avatar.startsWith("data:") || avatar.startsWith("http")
            ? avatar
            : `data:image/jpeg;base64,${avatar}`;
    }

    let filteredTickets = $derived(
        filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter),
    );

    let counts = $derived({
        ALL: tickets.length,
        OPEN: tickets.filter((t) => t.status === "OPEN").length,
        IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
    });
</script>

<div class="admin-support">
    <div class="header-row">
        <button class="refresh-btn" onclick={loadTickets} disabled={loading}>
            <span class={loading ? "spin" : ""}>↻</span>
            {loading ? "Cargando…" : "Actualizar"}
        </button>
    </div>

    {#if updateSuccess}
        <div class="alert success">✅ {updateSuccess}</div>
    {/if}
    {#if updateError}
        <div class="alert error">
            ⚠️ {updateError}
            <button onclick={() => (updateError = "")}>✕</button>
        </div>
    {/if}
    {#if errorMsg}
        <div class="alert error">⚠️ {errorMsg}</div>
    {/if}

    <div class="filter-tabs">
        {#each ["ALL", "OPEN", "IN_PROGRESS", "CLOSED"] as const as f}
            <button
                class="filter-tab"
                class:active={filter === f}
                onclick={() => (filter = f)}
            >
                {f === "ALL" ? "Todos" : statusLabel(f as SupportTicketStatus)}
                <span class="filter-count">{counts[f]}</span>
            </button>
        {/each}
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets de soporte…</p>
        </div>
    {:else if filteredTickets.length === 0}
        <div class="empty-state">
            <span class="empty-icon">🆘</span>
            <p>
                No hay tickets {filter !== "ALL"
                    ? `con estado "${statusLabel(filter as SupportTicketStatus)}"`
                    : "de soporte"}.
            </p>
        </div>
    {:else}
        <div class="tickets-grid">
            {#each filteredTickets as ticket (ticket.id)}
                <div
                    class="ticket-card"
                    class:status-open-card={ticket.status === "OPEN"}
                    class:status-progress-card={ticket.status === "IN_PROGRESS"}
                    class:status-closed-card={ticket.status === "CLOSED"}
                >
                    <div class="card-header">
                        <span class="ticket-subject">{ticket.subject}</span>
                        <span class="status-badge {statusClass(ticket.status)}">
                            {statusLabel(ticket.status)}
                        </span>
                    </div>

                    <p class="ticket-desc">{ticket.description}</p>

                    <div class="card-meta">
                        {#if ticket.username}
                            <span class="user-meta">
                                {#if getAvatarSrc(ticket.avatar)}
                                    <img
                                        src={getAvatarSrc(ticket.avatar)}
                                        alt={ticket.username}
                                        class="user-avatar"
                                    />
                                {:else}
                                    <span class="avatar-placeholder"
                                        >{ticket.username[0].toUpperCase()}</span
                                    >
                                {/if}
                                {ticket.username}
                            </span>
                        {/if}
                        {#if ticket.email}
                            <span
                                class="user-meta"
                                style="margin-left: 0.5rem;"
                            >
                                📧 {ticket.email}
                            </span>
                        {/if}
                        <span class="ticket-date"
                            >🕐 {formatDate(ticket.createdAt)}</span
                        >
                        <span class="ticket-id"
                            >User ID: {ticket.userId ?? "—"} | Ticket: #{ticket.id.slice(
                                0,
                                8,
                            )}</span
                        >
                    </div>

                    <div class="card-actions">
                        {#if resolvingTicketId === ticket.id}
                            <div class="resolve-form">
                                <span
                                    class="actions-label"
                                    style="display:block; margin-bottom:0.5rem; color:#1e293b;"
                                    >Cerrar ticket:</span
                                >
                                <textarea
                                    bind:value={resolutionMessage}
                                    placeholder="Mensaje de resolución para notificar al usuario (opcional)..."
                                    class="resolve-textarea"
                                    disabled={updatingId === ticket.id}
                                ></textarea>
                                <div class="resolve-actions-row">
                                    <button
                                        class="btn-cancel-sm"
                                        onclick={cancelResolveContext}
                                        disabled={updatingId === ticket.id}
                                        >Cancelar</button
                                    >
                                    <button
                                        class="btn-secondary-sm"
                                        onclick={() =>
                                            confirmResolve(ticket, false)}
                                        disabled={updatingId === ticket.id}
                                        >Solo cerrar</button
                                    >
                                    <button
                                        class="btn-success-sm"
                                        onclick={() =>
                                            confirmResolve(ticket, true)}
                                        disabled={updatingId === ticket.id ||
                                            !resolutionMessage.trim()}
                                    >
                                        {#if updatingId === ticket.id}<span
                                                class="btn-spinner"
                                            ></span>{/if}
                                        Cerrar y notificar
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <span class="actions-label">Cambiar estado:</span>
                            <div class="status-actions">
                                {#each ["OPEN", "IN_PROGRESS", "CLOSED"] as const as s}
                                    <button
                                        class="status-btn"
                                        class:active={ticket.status === s}
                                        class:btn-open={s === "OPEN"}
                                        class:btn-progress={s === "IN_PROGRESS"}
                                        class:btn-closed={s === "CLOSED"}
                                        onclick={() =>
                                            s === "CLOSED"
                                                ? startResolveContext(ticket)
                                                : updateStatus(ticket, s)}
                                        disabled={ticket.status === s ||
                                            updatingId === ticket.id}
                                    >
                                        {#if updatingId === ticket.id && ticket.status !== s}
                                            <span class="btn-spinner"></span>
                                        {/if}
                                        {statusLabel(s)}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .admin-support {
        max-width: 900px;
        margin: 0 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .header-row {
        display: flex;
        justify-content: flex-end;
    }

    .refresh-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
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

    .spin {
        display: inline-block;
        animation: spin 0.8s linear infinite;
    }

    .alert {
        padding: 0.7rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .alert button {
        margin-left: auto;
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0.6;
        font-size: 1rem;
    }
    .alert.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
    }
    .alert.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    .filter-tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0;
    }

    .filter-tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        padding: 0.55rem 0.9rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 6px 6px 0 0;
    }

    .filter-tab:hover {
        color: #1e293b;
        background: #f8fafc;
    }
    .filter-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }

    .filter-count {
        background: #f1f5f9;
        color: #64748b;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 999px;
    }

    .filter-tab.active .filter-count {
        background: #dbeafe;
        color: #1d4ed8;
    }

    /* Loading / empty */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 3rem;
        color: #94a3b8;
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 3rem;
        color: #94a3b8;
    }

    .empty-icon {
        font-size: 2.5rem;
    }

    .tickets-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .ticket-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        transition:
            box-shadow 0.2s,
            border-color 0.2s;
    }

    .ticket-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
    .status-open-card {
        border-left: 4px solid #3b82f6;
    }
    .status-progress-card {
        border-left: 4px solid #f59e0b;
    }
    .status-closed-card {
        border-left: 4px solid #94a3b8;
        opacity: 0.85;
    }

    .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .ticket-subject {
        font-weight: 700;
        font-size: 1rem;
        color: #1e293b;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ticket-desc {
        font-size: 0.88rem;
        color: #475569;
        margin: 0;
        line-height: 1.55;
    }

    .card-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .user-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.82rem;
        color: #475569;
        font-weight: 600;
    }

    .user-avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-placeholder {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .ticket-date {
        font-size: 0.78rem;
        color: #94a3b8;
    }
    .ticket-id {
        font-size: 0.7rem;
        color: #cbd5e1;
        font-family: monospace;
    }

    .card-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-top: 0.5rem;
        border-top: 1px solid #f1f5f9;
        flex-wrap: wrap;
    }

    .actions-label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #94a3b8;
        white-space: nowrap;
    }

    .status-actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    .status-btn {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3rem 0.75rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        border: 1.5px solid transparent;
        cursor: pointer;
        transition: all 0.18s;
        background: #f8fafc;
        color: #64748b;
        border-color: #e2e8f0;
    }

    .status-btn.active {
        cursor: default;
        opacity: 0.7;
    }

    .status-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .status-btn.btn-open:not(.active):hover {
        background: #dbeafe;
        color: #1d4ed8;
        border-color: #93c5fd;
    }
    .status-btn.btn-open.active {
        background: #dbeafe;
        color: #1d4ed8;
        border-color: #93c5fd;
    }

    .status-btn.btn-progress:not(.active):hover {
        background: #fef3c7;
        color: #92400e;
        border-color: #fcd34d;
    }
    .status-btn.btn-progress.active {
        background: #fef3c7;
        color: #92400e;
        border-color: #fcd34d;
    }

    .status-btn.btn-closed:not(.active):hover {
        background: #f1f5f9;
        color: #475569;
        border-color: #cbd5e1;
    }
    .status-btn.btn-closed.active {
        background: #f1f5f9;
        color: #475569;
        border-color: #cbd5e1;
    }

    .resolve-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .resolve-textarea {
        width: 100%;
        min-height: 70px;
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

    .resolve-textarea:focus {
        border-color: #3b82f6;
        background: #fff;
    }
    .resolve-textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .resolve-actions-row {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .btn-cancel-sm {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.8rem;
        color: #64748b;
        transition: background 0.2s;
    }
    .btn-cancel-sm:hover:not(:disabled) {
        background: #f1f5f9;
    }
    .btn-cancel-sm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary-sm {
        background: #f1f5f9;
        border: 1.5px solid #e2e8f0;
        color: #475569;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-secondary-sm:hover:not(:disabled) {
        background: #e2e8f0;
        color: #1e293b;
        border-color: #cbd5e1;
    }
    .btn-secondary-sm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-success-sm {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        padding: 0.45rem 0.95rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    .btn-success-sm:hover:not(:disabled) {
        opacity: 0.9;
    }
    .btn-success-sm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.7rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .status-open {
        background: #dbeafe;
        color: #1d4ed8;
    }
    .status-progress {
        background: #fef3c7;
        color: #92400e;
    }
    .status-closed {
        background: #f1f5f9;
        color: #64748b;
    }

    .btn-spinner {
        width: 10px;
        height: 10px;
        border: 1.5px solid rgba(0, 0, 0, 0.2);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        display: inline-block;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
