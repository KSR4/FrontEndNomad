<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import type { NotificationEntity } from "$lib/api/client";
    import { AlertTriangle, Bell, Megaphone, RefreshCw } from "lucide-svelte";

    let notifications = $state<NotificationEntity[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let markingId = $state<string | null>(null);
    let markingAll = $state(false);

    onMount(async () => {
        await loadNotifications();
    });

    async function loadNotifications() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.notifications.list();
            if (!res.ok)
                throw new Error(
                    res.message || "Error al cargar notificaciones.",
                );
            const raw = res.data ?? res;
            notifications = Array.isArray(raw) ? raw : [];
            notifications = notifications.sort((a, b) => {
                if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            });
        } catch (err: any) {
            errorMsg = err.message ?? "Error inesperado.";
        } finally {
            loading = false;
        }
    }

    async function markRead(notification: NotificationEntity) {
        if (notification.isRead) return;
        markingId = notification.id;
        try {
            const res = await api.notifications.markRead(notification.id);
            if (!res.ok) throw new Error(res.message);
            notifications = notifications.map((n) =>
                n.id === notification.id ? { ...n, isRead: true } : n,
            );
        } catch (err: any) {
        } finally {
            markingId = null;
        }
    }

    async function markAllRead() {
        const unread = notifications.filter((n) => !n.isRead);
        if (unread.length === 0) return;
        markingAll = true;
        try {
            await Promise.all(
                unread.map((n) => api.notifications.markRead(n.id)),
            );
            notifications = notifications.map((n) => ({ ...n, isRead: true }));
        } finally {
            markingAll = false;
        }
    }

    function formatDate(date: Date | string): string {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffMin < 1) return "Ahora mismo";
        if (diffMin < 60) return `Hace ${diffMin} min`;
        if (diffHour < 24) return `Hace ${diffHour}h`;
        if (diffDay === 1) return "Ayer";
        if (diffDay < 7) return `Hace ${diffDay} días`;
        return d.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }

    let unreadCount = $derived(notifications.filter((n) => !n.isRead).length);
</script>

<div class="notifications-container">
    <div class="header-row">
        <div class="header-left">
            <h2 class="section-title">
                Notificaciones
                {#if unreadCount > 0}
                    <span class="unread-badge">{unreadCount}</span>
                {/if}
            </h2>
        </div>
        <div class="header-actions">
            <button
                class="btn-ghost"
                onclick={loadNotifications}
                disabled={loading}
                title="Actualizar"
            >
                {#if loading}
                    <span class="spin">
                        <RefreshCw size={16} />
                    </span>
                {:else}
                    <RefreshCw size={16} />
                {/if}
            </button>
            {#if unreadCount > 0}
                <button
                    class="btn-mark-all"
                    onclick={markAllRead}
                    disabled={markingAll}
                >
                    {markingAll ? "Marcando…" : "✓ Marcar todas como leídas"}
                </button>
            {/if}
        </div>
    </div>

    {#if errorMsg}
        <div class="alert-error"><AlertTriangle size={18} /> {errorMsg}</div>
    {/if}

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando notificaciones…</p>
        </div>
    {:else if notifications.length === 0}
        <div class="empty-state">
            <div class="empty-icon-wrap"><Bell size={48} /></div>
            <p class="empty-title">Todo al día</p>
            <p class="empty-sub">No tienes notificaciones por ahora.</p>
        </div>
    {:else}
        <div class="notifications-list">
            {#each notifications as notif (notif.id)}
                <button
                    class="notif-card"
                    class:unread={!notif.isRead}
                    class:marking={markingId === notif.id}
                    onclick={() => markRead(notif)}
                    disabled={notif.isRead || markingId === notif.id}
                    title={notif.isRead ? "" : "Clic para marcar como leída"}
                >
                    <div class="notif-icon-col">
                        {#if !notif.isRead}
                            <span class="unread-dot"></span>
                        {:else}
                            <span class="read-check">✓</span>
                        {/if}
                    </div>

                    <div class="notif-body">
                        <div class="notif-header">
                            <span class="notif-title">{notif.title}</span>
                            <span class="notif-time"
                                >{formatDate(notif.createdAt)}</span
                            >
                        </div>
                        <p class="notif-message">{notif.message}</p>
                        {#if notif.userId === null}
                            <span class="broadcast-badge"
                                ><Megaphone size={12} /> Mensaje general</span
                            >
                        {/if}
                    </div>

                    {#if !notif.isRead && markingId === notif.id}
                        <div class="marking-spinner"></div>
                    {/if}
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .notifications-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .section-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .unread-badge {
        background: #ef4444;
        color: white;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        line-height: 1.4;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-ghost {
        background: none;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.35rem 0.65rem;
        font-size: 1rem;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s;
        line-height: 1;
    }

    .btn-ghost:hover:not(:disabled) {
        background: #f1f5f9;
        color: #1e293b;
    }

    .btn-ghost:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spin {
        display: inline-block;
        animation: spin 0.8s linear infinite;
    }

    .btn-mark-all {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.4rem 0.9rem;
        font-size: 0.82rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-mark-all:hover:not(:disabled) {
        background: #e2e8f0;
        color: #1e293b;
    }

    .btn-mark-all:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
        padding: 4rem 2rem;
        text-align: center;
    }

    .empty-icon-wrap {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        filter: grayscale(0.4);
    }

    .empty-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
    }

    .empty-sub {
        color: #94a3b8;
        font-size: 0.9rem;
        margin: 0;
    }

    .alert-error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
        border-radius: 10px;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
    }

    .notifications-list {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .notif-card {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        padding: 1rem 1.1rem;
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        width: 100%;
        transition:
            box-shadow 0.2s,
            border-color 0.2s,
            background 0.2s;
        position: relative;
        overflow: hidden;
    }

    .notif-card.unread {
        border-color: #bfdbfe;
        background: #f0f7ff;
    }

    .notif-card.unread:hover:not(:disabled) {
        border-color: #93c5fd;
        box-shadow: 0 2px 12px rgba(59, 130, 246, 0.12);
    }

    .notif-card:not(.unread) {
        cursor: default;
        opacity: 0.75;
    }

    .notif-card.marking {
        opacity: 0.6;
        cursor: wait;
    }

    .notif-icon-col {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 0.15rem;
    }

    .unread-dot {
        width: 10px;
        height: 10px;
        background: #3b82f6;
        border-radius: 50%;
        display: block;
        flex-shrink: 0;
    }

    .read-check {
        color: #94a3b8;
        font-size: 0.85rem;
        font-weight: 700;
    }

    .notif-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
    }

    .notif-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
    }

    .notif-title {
        font-weight: 700;
        font-size: 0.92rem;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .notif-time {
        font-size: 0.75rem;
        color: #94a3b8;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .notif-message {
        font-size: 0.87rem;
        color: #475569;
        margin: 0;
        line-height: 1.5;
    }

    .broadcast-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.72rem;
        font-weight: 600;
        color: #7c3aed;
        background: #ede9fe;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        width: fit-content;
        margin-top: 0.2rem;
    }

    .marking-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid #bfdbfe;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        flex-shrink: 0;
        align-self: center;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
