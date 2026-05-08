<script lang="ts">
    import { session } from "$lib/stores/session.svelte";
    import { page } from "$app/stores";
    import {
        User,
        Calendar,
        UtensilsCrossed,
        ShoppingBag,
        Star,
        LifeBuoy,
        Store,
        UserPlus,
        Users,
        Ticket,
        Settings,
        CalendarRange,
        LogOut,
    } from "lucide-svelte";

    interface Props {
        isOpen: boolean;
        onNavigate: (path: string) => void;
        onLogout: () => void;
    }

    let { isOpen, onNavigate, onLogout }: Props = $props();
</script>

<aside class="sidebar" class:open={isOpen}>
    <div class="logo">Nomad<span class="dot">.</span></div>

    <nav>
        <div class="section-label">General</div>
        <button
            class:active={$page.url.pathname === "/app/profile"}
            onclick={() => onNavigate("/app/profile")}
        >
            <User size={18} class="icon" />
            <span>Perfil</span>
        </button>

        {#if session.user?.isVerified}
            <button
                class:active={$page.url.pathname === "/app/events"}
                onclick={() => onNavigate("/app/events")}
            >
                <Calendar size={18} class="icon" />
                <span>Eventos</span>
            </button>
            <button
                class:active={$page.url.pathname === "/app/sellers"}
                onclick={() => onNavigate("/app/sellers")}
            >
                <UtensilsCrossed size={18} class="icon" />
                <span>Explorar Comida</span>
            </button>
            <button
                class:active={$page.url.pathname === "/app/orders"}
                onclick={() => onNavigate("/app/orders")}
            >
                <ShoppingBag size={18} class="icon" />
                <span>Mis Pedidos</span>
            </button>
            <button
                class:active={$page.url.pathname === "/app/reviews"}
                onclick={() => onNavigate("/app/reviews")}
            >
                <Star size={18} class="icon" />
                <span>Mis Reseñas</span>
            </button>
            <button
                class:active={$page.url.pathname === "/app/support-tickets"}
                onclick={() => onNavigate("/app/support-tickets")}
            >
                <LifeBuoy size={18} class="icon" />
                <span>Mis Tickets de Ayuda</span>
            </button>

            {#if session.user?.role === "OWNER" || session.user?.role === "ADMIN"}
                <div class="section-label">Negocio</div>
                <button
                    class:active={$page.url.pathname === "/app/my-shops"}
                    onclick={() => onNavigate("/app/my-shops")}
                >
                    <Store size={18} class="icon" />
                    <span>Mis Negocios</span>
                </button>
            {:else}
                <div class="section-label">Socios</div>
                <button
                    class:active={$page.url.pathname === "/app/become-seller"}
                    onclick={() => onNavigate("/app/become-seller")}
                >
                    <UserPlus size={18} class="icon" />
                    <span>Ser un Vendedor</span>
                </button>
            {/if}

            {#if session.user?.role === "ADMIN"}
                <div class="section-label">Administración</div>
                <button
                    class:active={$page.url.pathname === "/app/users"}
                    onclick={() => onNavigate("/app/users")}
                >
                    <Users size={18} class="icon" />
                    <span>Usuarios</span>
                </button>
                <button
                    class:active={$page.url.pathname === "/app/tickets"}
                    onclick={() => onNavigate("/app/tickets")}
                >
                    <Ticket size={18} class="icon" />
                    <span>Solicitudes Vendedor</span>
                </button>
                <button
                    class:active={$page.url.pathname === "/app/admin-support"}
                    onclick={() => onNavigate("/app/admin-support")}
                >
                    <Settings size={18} class="icon" />
                    <span>Ayuda y Soporte</span>
                </button>
                <button
                    class:active={$page.url.pathname === "/app/admin-events"}
                    onclick={() => onNavigate("/app/admin-events")}
                >
                    <CalendarRange size={18} class="icon" />
                    <span>Gestión de Eventos</span>
                </button>
            {/if}
        {/if}
    </nav>

    <div class="sidebar-footer">
        <button class="logout-btn" onclick={onLogout}>
            <LogOut size={18} class="icon" />
            <span>Cerrar sesión</span>
        </button>
    </div>
</aside>

<style>
    .sidebar {
        width: 240px;
        height: 100vh;
        position: sticky;
        top: 0;
        background: white;
        border-right: 1px solid #e2e8f0;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        transition: transform 0.3s ease;
        overflow-y: auto;
        scrollbar-width: thin;
    }

    .logo {
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 3rem;
    }

    .dot {
        color: var(--accent-color, #0ea5e9);
    }

    nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
    }

    nav button {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-align: left;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        border-radius: 8px;
        color: #64748b;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        font-size: 0.95rem;
    }

    :global(nav button .icon) {
        color: #0f172a;
        flex-shrink: 0;
    }

    nav button:hover {
        background-color: #f1f5f9;
        color: #0f172a;
        transform: translateX(4px);
    }

    nav button.active {
        background-color: #e0f2fe;
        color: #0284c7;
        font-weight: 600;
    }

    nav button.active :global(.icon) {
        color: #0284c7;
    }

    .section-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        padding: 1rem 1rem 0.25rem;
        margin-top: 0.25rem;
        border-top: 1px solid #e2e8f0;
    }

    .sidebar-footer {
        margin-top: auto;
        padding-top: 2rem;
        border-top: 1px solid #e2e8f0;
    }

    .logout-btn {
        width: 100%;
        padding: 0.75rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        background-color: var(--primary-color, #ef4444);
        color: white;
        border: 1px solid var(--primary-color, #ef4444);
        font-size: 0.95rem;
    }

    .logout-btn:hover {
        background-color: rgb(255, 84, 84);
    }

    @media (max-width: 768px) {
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
        }

        .sidebar.open {
            transform: translateX(0);
        }
    }
</style>
