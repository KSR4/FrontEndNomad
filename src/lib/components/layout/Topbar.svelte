<script lang="ts">
    import { session } from "$lib/stores/session.svelte";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";
    import { api } from "$lib/api/client";
    import type { NotificationEntity } from "$lib/api/client";
    import { Bell } from "lucide-svelte";

    interface Props {
        title: string;
        onToggleSidebar: () => void;
    }

    let { title, onToggleSidebar }: Props = $props();

    let currentTime = $state("");
    let clockInterval: ReturnType<typeof setInterval>;

    let unreadCount = $state(0);
    let notifInterval: ReturnType<typeof setInterval>;

    function updateClock() {
        const now = new Date();
        currentTime = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    async function fetchUnreadCount() {
        if (!session.user) return;
        try {
            const res = await api.notifications.list();
            if (res.ok) {
                const raw: NotificationEntity[] = Array.isArray(res.data)
                    ? res.data
                    : [];
                unreadCount = raw.filter((n) => !n.isRead).length;
            }
        } catch {}
    }

    onMount(() => {
        updateClock();
        clockInterval = setInterval(updateClock, 1000);

        fetchUnreadCount();
        notifInterval = setInterval(fetchUnreadCount, 30000);
    });

    onDestroy(() => {
        clearInterval(clockInterval);
        clearInterval(notifInterval);
    });

    function getAvatarDataUrl(u: any): string | null {
        if (!u?.avatar) return null;
        const b64 = u.avatar;
        return b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
    }

    function getInitial(u: any): string {
        return (u?.username ?? "?")[0].toUpperCase();
    }
</script>

<header class="topbar">
    <button class="hamburger" aria-label="Abrir menú" onclick={onToggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
    </button>

    <h1 class="page-title">{title}</h1>

    <div class="topbar-right">
        <span class="clock">{currentTime}</span>

        <button
            class="notif-btn"
            onclick={() => goto("/app/profile")}
            aria-label="Notificaciones"
        >
            <Bell size={20} color="#1e293b" />
            {#if unreadCount > 0}
                <span class="notif-badge">{unreadCount}</span>
            {/if}
        </button>

        <button
            class="user-info"
            onclick={() => goto("/app/profile")}
            aria-label="Ver perfil"
        >
            <span class="username"
                >{session.user ? session.user.username : "Usuario"}</span
            >
            {#if getAvatarDataUrl(session.user)}
                <img
                    src={getAvatarDataUrl(session.user)}
                    alt="Perfil"
                    class="avatar"
                />
            {:else}
                <div class="avatar avatar-placeholder">
                    {getInitial(session.user)}
                </div>
            {/if}
        </button>
    </div>
</header>

<style>
    .topbar {
        background: white;
        padding: 0.75rem 2rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 60px;
        gap: 1rem;
    }

    .page-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-shrink: 0;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 8px;
        transition: background 0.15s;
    }

    .user-info:hover {
        background: #f1f5f9;
    }

    .topbar-right {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex-shrink: 0;
    }

    .clock {
        font-size: 0.9rem;
        font-weight: 600;
        color: #64748b;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
    }

    .username {
        font-weight: 600;
        color: #1e293b;
        font-size: 1rem;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #e2e8f0;
        flex-shrink: 0;
    }

    .avatar-placeholder {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #fff;
        font-size: 1.1rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #e2e8f0;
    }

    .notif-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        position: relative;
        padding: 0.4rem;
        border-radius: 50%;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notif-btn:hover {
        background: #f1f5f9;
    }

    .notif-badge {
        position: absolute;
        top: 0;
        right: 0;
        background: #ef4444;
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.1rem 0.35rem;
        border-radius: 999px;
        line-height: 1.2;
        border: 2px solid white;
        transform: translate(25%, -25%);
    }

    .hamburger {
        display: none;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        flex-shrink: 0;
        width: 36px;
        height: 36px;
    }

    .hamburger span {
        display: block;
        height: 2px;
        width: 22px;
        background-color: #1e293b;
        border-radius: 2px;
        transition: all 0.2s;
    }

    @media (max-width: 768px) {
        .topbar {
            padding: 1rem 1.25rem;
        }

        .hamburger {
            display: flex;
        }

        .username {
            display: none;
        }
    }
</style>
