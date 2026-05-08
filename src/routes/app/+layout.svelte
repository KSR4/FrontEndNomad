<script lang="ts">
    import { session } from "$lib/stores/session.svelte";
    import Sidebar from "$lib/components/layout/Sidebar.svelte";
    import Topbar from "$lib/components/layout/Topbar.svelte";
    import Modal from "$lib/components/layout/Modal.svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let { children } = $props();

    let sidebarOpen = $state(false);
    let showLogoutModal = $state(false);

    const titles: Record<string, string> = {
        "/app/profile": "Mi Perfil",
        "/app/become-seller": "Conviértete en Vendedor",
        "/app/sellers": "Explorar Comida",
        "/app/events": "Eventos",
        "/app/reviews": "Mis Reseñas",
        "/app/tickets": "Gestión de Tickets",
        "/app/support-tickets": "Mis Tickets de Ayuda",
        "/app/admin-support": "Ayuda y Soporte",
        "/app/orders": "Mis Pedidos",
        "/app/my-shops": "Mis Negocios",
        "/app/users": "Gestión de Usuarios",
        "/app/admin-events": "Gestión de Eventos",
    };

    let currentTitle = $derived.by(() => {
        const path = $page.url.pathname;
        if (titles[path]) return titles[path];
        if (path.startsWith("/app/my-shops/")) return "Gestión de Tienda";
        if (path.startsWith("/app/shops/")) return "Menú de Tienda";
        return "Nomad";
    });

    $effect(() => {
        if (!session.token && !session.sessionExpired) {
            goto("/login");
        } else if (session.token && session.user) {
            if (
                !session.user.isVerified &&
                $page.url.pathname !== "/app/profile"
            ) {
                goto("/app/profile");
            }

            // Route protection for ADMIN
            const adminRoutes = [
                "/app/admin-events",
                "/app/admin-support",
                "/app/users",
                "/app/tickets",
            ];
            if (
                adminRoutes.some((route) =>
                    $page.url.pathname.startsWith(route),
                ) &&
                session.user.role !== "ADMIN"
            ) {
                goto("/app/events");
            }

            // Route protection for OWNER (Admins are also allowed to view these)
            const ownerRoutes = ["/app/my-shops"];
            if (
                ownerRoutes.some((route) =>
                    $page.url.pathname.startsWith(route),
                ) &&
                session.user.role !== "OWNER" &&
                session.user.role !== "ADMIN"
            ) {
                goto("/app/events");
            }
        }
    });

    onMount(() => {
        if (!session.token && !session.sessionExpired) {
            goto("/login");
        }
    });

    function handleLogout() {
        showLogoutModal = true;
    }

    function confirmLogout() {
        session.setToken(null);
        goto("/");
        showLogoutModal = false;
    }
    function closeExpirationModal() {
        session.clearExpiration();
    }

    $effect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    });
</script>

{#if session.token || session.sessionExpired}
    <!-- Overlay oscuro (solo móvil) -->
    {#if sidebarOpen}
        <div
            class="overlay"
            role="button"
            tabindex="-1"
            aria-label="Cerrar menú"
            onclick={() => (sidebarOpen = false)}
            onkeydown={(e) => e.key === "Escape" && (sidebarOpen = false)}
        ></div>
    {/if}

    <div class="main-layout">
        <Sidebar
            isOpen={sidebarOpen}
            onNavigate={(path) => {
                sidebarOpen = false;
                goto(path);
            }}
            onLogout={handleLogout}
        />

        <div class="main-wrapper">
            <Topbar
                title={currentTitle}
                onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
            />

            <main class="content">
                {@render children()}
            </main>
        </div>
    </div>

    <Modal
        show={showLogoutModal}
        title="Cerrar sesión"
        onClose={() => (showLogoutModal = false)}
    >
        <p>
            ¿Estás seguro de que deseas cerrar la sesión? Tendrás que volver a
            ingresar tus credenciales para acceder de nuevo.
        </p>

        {#snippet footer()}
            <button class="cancel-btn" onclick={() => (showLogoutModal = false)}
                >Cancelar</button
            >
            <button class="confirm-btn" onclick={confirmLogout}
                >Cerrar sesión</button
            >
        {/snippet}
    </Modal>

    <Modal
        show={session.sessionExpired}
        title="Sesión expirada"
        onClose={closeExpirationModal}
    >
        <p>
            Tu sesión ha expirado por seguridad (30 minutos de inactividad o
            token caducado). Por favor, vuelve a iniciar sesión para continuar.
        </p>

        {#snippet footer()}
            <button
                class="confirm-btn"
                onclick={closeExpirationModal}
                style="background: var(--primary-color, #3b82f6)"
            >
                Entendido
            </button>
        {/snippet}
    </Modal>
{/if}

<style>
    .main-layout {
        display: flex;
        min-height: 100vh;
        background-color: #f8fafc;
    }

    .main-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        min-width: 0;
    }

    .content {
        flex: 1;
        padding: 3rem;
        overflow-y: auto;
    }

    .overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 40;
    }

    @media (max-width: 768px) {
        .overlay {
            display: block;
        }

        .content {
            padding: 1.5rem 1rem;
        }
    }

    .cancel-btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        background: white;
        cursor: pointer;
    }

    .confirm-btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        background: #ef4444;
        color: white;
        border: none;
        cursor: pointer;
    }
</style>
