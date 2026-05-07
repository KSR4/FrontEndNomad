<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import type {
        SupportTicketEntity,
        SupportTicketStatus,
    } from "$lib/api/client";
    import {
        ClipboardList,
        PenLine,
        CheckCircle2,
        AlertTriangle,
        LifeBuoy,
        Clock,
        Send,
        RefreshCw,
    } from "lucide-svelte";

    let subject = $state("");
    let description = $state("");
    let sending = $state(false);
    let successMsg = $state("");
    let errorMsg = $state("");

    let tickets = $state<SupportTicketEntity[]>([]);
    let loadingTickets = $state(true);
    let ticketsError = $state("");

    let activeView = $state<"list" | "new">("list");

    onMount(async () => {
        await loadMyTickets();
    });

    async function loadMyTickets() {
        loadingTickets = true;
        ticketsError = "";
        try {
            const res = await api.supportTickets.listSelf();
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
            ticketsError = err.message ?? "Error inesperado.";
        } finally {
            loadingTickets = false;
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!subject.trim() || !description.trim()) {
            errorMsg = "El asunto y la descripción son obligatorios.";
            return;
        }
        sending = true;
        successMsg = "";
        errorMsg = "";
        try {
            const res = await api.supportTickets.create(
                subject.trim(),
                description.trim(),
            );
            if (!res.ok)
                throw new Error(res.message || "Error al enviar el ticket.");
            successMsg = "¡Ticket enviado! Nuestro equipo lo revisará pronto.";
            subject = "";
            description = "";

            await loadMyTickets();
            activeView = "list";
        } catch (err: any) {
            errorMsg = err.message ?? "Error inesperado.";
        } finally {
            sending = false;
        }
    }

    function statusLabel(status: SupportTicketStatus): string {
        const labels: Record<SupportTicketStatus, string> = {
            OPEN: "Abierto",
            IN_PROGRESS: "En revisión",
            CLOSED: "Cerrado",
        };
        return labels[status] ?? status;
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
        });
    }
</script>

<div class="support-container">
    <div class="view-tabs">
        <button
            class="tab-btn"
            class:active={activeView === "list"}
            onclick={() => {
                activeView = "list";
                successMsg = "";
            }}
        >
            <ClipboardList size={18} /> Mis tickets
            {#if tickets.length > 0}
                <span class="tab-count">{tickets.length}</span>
            {/if}
        </button>
        <button
            class="tab-btn"
            class:active={activeView === "new"}
            onclick={() => {
                activeView = "new";
                errorMsg = "";
            }}
        >
            <PenLine size={18} /> Nuevo ticket
        </button>
    </div>

    {#if successMsg}
        <div class="alert success">
            <span><CheckCircle2 size={18} /></span>
            {successMsg}
        </div>
    {/if}

    {#if activeView === "list"}
        <div class="list-section">
            <div class="list-header">
                <button
                    class="btn-refresh"
                    onclick={loadMyTickets}
                    disabled={loadingTickets}
                    title="Actualizar"
                >
                    {#if loadingTickets}
                        <span class="spin-inline"><RefreshCw size={16} /></span>
                    {:else}
                        <RefreshCw size={16} />
                    {/if}
                </button>
            </div>

            {#if ticketsError}
                <div class="alert error">
                    <AlertTriangle size={18} />
                    {ticketsError}
                </div>
            {/if}

            {#if loadingTickets && tickets.length === 0}
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Cargando tickets…</p>
                </div>
            {:else if tickets.length === 0}
                <div class="empty-state">
                    <div class="empty-icon"><LifeBuoy size={48} /></div>
                    <p class="empty-title">Sin tickets de soporte</p>
                    <p class="empty-sub">
                        ¿Necesitas ayuda? Abre un nuevo ticket y te atenderemos.
                    </p>
                    <button
                        class="cta-btn"
                        onclick={() => (activeView = "new")}
                    >
                        <PenLine
                            size={18}
                            style="display:inline; vertical-align:middle; margin-right: 4px;"
                        /> Abrir ticket
                    </button>
                </div>
            {:else}
                <div class="tickets-list">
                    {#each tickets as ticket (ticket.id)}
                        <div class="ticket-card">
                            <div class="ticket-top">
                                <span class="ticket-subject"
                                    >{ticket.subject}</span
                                >
                                <span
                                    class="status-badge {statusClass(
                                        ticket.status,
                                    )}"
                                >
                                    {statusLabel(ticket.status)}
                                </span>
                            </div>
                            <p class="ticket-desc">{ticket.description}</p>
                            <div class="ticket-meta">
                                <span class="ticket-date"
                                    ><Clock
                                        size={14}
                                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                                    />
                                    {formatDate(ticket.createdAt)}</span
                                >
                                <span class="ticket-id-label"
                                    >#{ticket.id.slice(0, 8)}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    {#if activeView === "new"}
        <div class="form-section">
            <p class="form-description">
                Describe tu problema con detalle. Nuestro equipo te responderá
                lo antes posible.
            </p>

            {#if errorMsg}
                <div class="alert error">
                    <AlertTriangle size={18} />
                    {errorMsg}
                </div>
            {/if}

            <form onsubmit={handleSubmit} class="support-form">
                <div class="form-group">
                    <label for="support-subject">Asunto</label>
                    <input
                        id="support-subject"
                        type="text"
                        bind:value={subject}
                        placeholder="Ej. No puedo acceder a mi cuenta"
                        required
                        disabled={sending}
                        maxlength="120"
                    />
                    <span class="char-count">{subject.length}/120</span>
                </div>

                <div class="form-group">
                    <label for="support-description">Descripción</label>
                    <textarea
                        id="support-description"
                        bind:value={description}
                        placeholder="Explica el problema con el mayor detalle posible…"
                        required
                        disabled={sending}
                        rows="5"
                    ></textarea>
                </div>

                <div class="form-actions">
                    <button type="submit" class="submit-btn" disabled={sending}>
                        {#if sending}
                            <span class="btn-spinner"></span> Enviando…
                        {:else}
                            <Send size={18} /> Enviar ticket
                        {/if}
                    </button>
                    <button
                        type="button"
                        class="cancel-btn"
                        onclick={() => {
                            activeView = "list";
                            errorMsg = "";
                        }}
                        disabled={sending}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    {/if}
</div>

<style>
    .support-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .view-tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0;
    }

    .tab-btn {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: 6px 6px 0 0;
    }

    .tab-btn:hover {
        color: #1e293b;
        background: #f8fafc;
    }

    .tab-btn.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }

    .tab-count {
        background: #e0f2fe;
        color: #0284c7;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
    }

    .alert {
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
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

    .list-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .list-header {
        display: flex;
        justify-content: flex-end;
    }

    .btn-refresh {
        background: none;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.35rem 0.65rem;
        font-size: 1rem;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s;
        display: flex;
        align-items: center;
    }

    .btn-refresh:hover:not(:disabled) {
        background: #f1f5f9;
        color: #1e293b;
    }
    .btn-refresh:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spin-inline {
        display: inline-block;
        animation: spin 1s linear infinite;
        vertical-align: middle;
    }

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
        padding: 3.5rem 2rem;
        text-align: center;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }
    .empty-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
    }
    .empty-sub {
        color: #94a3b8;
        font-size: 0.88rem;
        margin: 0 0 1rem;
    }

    .cta-btn {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition:
            opacity 0.2s,
            transform 0.1s;
    }

    .cta-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    .tickets-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .ticket-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        transition: box-shadow 0.2s;
    }

    .ticket-card:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .ticket-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .ticket-subject {
        font-weight: 700;
        font-size: 0.95rem;
        color: #1e293b;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ticket-desc {
        font-size: 0.87rem;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .ticket-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .ticket-date {
        font-size: 0.78rem;
        color: #94a3b8;
    }
    .ticket-id-label {
        font-size: 0.72rem;
        color: #cbd5e1;
        font-family: monospace;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.65rem;
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

    .form-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-description {
        font-size: 0.9rem;
        color: #64748b;
        margin: 0;
        line-height: 1.5;
    }

    .support-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        position: relative;
    }

    .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
    }

    .form-group input,
    .form-group textarea {
        padding: 0.6rem 0.9rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-family: inherit;
        font-size: 1rem;
        color: #1e293b;
        background: #f8fafc;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        outline: none;
        resize: vertical;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        border-color: #3b82f6;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled,
    .form-group textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .char-count {
        font-size: 0.72rem;
        color: #94a3b8;
        align-self: flex-end;
        margin-top: -0.1rem;
    }

    .form-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.25rem;
    }

    .submit-btn {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 0.65rem 1.4rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition:
            opacity 0.2s,
            transform 0.1s;
    }

    .submit-btn:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .cancel-btn {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.65rem 1.1rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn:hover:not(:disabled) {
        background: #e2e8f0;
    }
    .cancel-btn:disabled {
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

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
