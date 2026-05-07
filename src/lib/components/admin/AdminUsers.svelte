<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import {
        Users,
        RefreshCw,
        Search,
        Inbox,
        Mail,
        CheckCircle2,
        XCircle,
    } from "lucide-svelte";

    let users: any[] = $state([]);
    let loading = $state(true);
    let errorMsg = $state("");
    let searchQuery = $state("");

    onMount(async () => {
        await loadUsers();
    });

    async function loadUsers() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.user.list();
            if (res?.error) throw new Error(res.error);
            users = Array.isArray(res) ? res : (res?.users ?? res?.data ?? []);
        } catch (err: any) {
            errorMsg = err.message ?? "Error al cargar los usuarios.";
        } finally {
            loading = false;
        }
    }

    let filteredUsers = $derived.by(() => {
        if (!searchQuery.trim()) return users;
        const q = searchQuery.toLowerCase().trim();
        return users.filter(
            (u) =>
                (u.id && String(u.id).toLowerCase().includes(q)) ||
                (u.username && u.username.toLowerCase().includes(q)),
        );
    });

    function avatarUrl(avatar: string | null | undefined): string | null {
        if (!avatar) return null;
        return avatar.startsWith("data:") || avatar.startsWith("http")
            ? avatar
            : `data:image/jpeg;base64,${avatar}`;
    }

    function getInitial(username: string | undefined): string {
        return (username ?? "?")[0].toUpperCase();
    }
</script>

<div class="admin-users">
    <div class="header-row">
        <h2>
            <Users
                size={24}
                style="display:inline; vertical-align:middle; margin-right: 8px;"
            /> Usuarios Registrados ({users.length})
        </h2>
        <button class="refresh-btn" onclick={loadUsers} disabled={loading}>
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

    <div class="search-container">
        <span class="search-icon"><Search size={18} /></span>
        <input
            type="text"
            placeholder="Buscar por ID o Nombre de usuario..."
            bind:value={searchQuery}
            class="search-input"
        />
    </div>

    {#if errorMsg}
        <div class="alert error" role="alert">{errorMsg}</div>
    {/if}

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando usuarios…</p>
        </div>
    {:else if users.length === 0}
        <div class="empty-state">
            <span class="empty-icon"><Inbox size={48} /></span>
            <p>No hay usuarios registrados en la plataforma.</p>
        </div>
    {:else if filteredUsers.length === 0}
        <div class="empty-state">
            <span class="empty-icon"><Search size={48} /></span>
            <p>No se encontraron usuarios que coincidan con "{searchQuery}".</p>
        </div>
    {:else}
        <div class="users-grid">
            {#each filteredUsers as user}
                <div class="user-card">
                    <div class="user-avatar-container">
                        {#if avatarUrl(user.avatar)}
                            <img
                                src={avatarUrl(user.avatar)}
                                alt="Avatar de {user.username}"
                                class="user-avatar"
                            />
                        {:else}
                            <div class="user-avatar-placeholder">
                                {getInitial(user.username)}
                            </div>
                        {/if}
                    </div>

                    <div class="user-details">
                        <div class="user-header">
                            <span class="username"
                                >{user.username ?? "Sin nombre"}</span
                            >
                            <span
                                class="role-badge role-{user.role?.toLowerCase() ??
                                    'user'}"
                            >
                                {user.role ?? "USER"}
                            </span>
                        </div>

                        <div class="user-meta">
                            <span class="user-id">#{user.id ?? "—"}</span>
                            <span class="user-email"
                                ><Mail
                                    size={14}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                />
                                {user.email ?? "Sin email"}</span
                            >

                            <span
                                class="verify-badge {user.isVerified
                                    ? 'verified'
                                    : 'unverified'}"
                            >
                                {#if user.isVerified}
                                    <CheckCircle2
                                        size={12}
                                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                                    /> Verificado
                                {:else}
                                    <XCircle
                                        size={12}
                                        style="display:inline; vertical-align:middle; margin-right: 4px;"
                                    /> Sin verificar
                                {/if}
                            </span>
                        </div>

                        {#if user.createdAt || user.created_at}
                            <div class="user-date">
                                Miembro desde: {new Date(
                                    user.createdAt ?? user.created_at,
                                ).toLocaleDateString("es-ES")}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .admin-users {
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

    .header-row h2 {
        margin: 0;
        font-size: 1.4rem;
        color: #1e293b;
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

    .search-container {
        position: relative;
        width: 100%;
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        font-size: 1.1rem;
    }

    .search-input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 2.8rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 12px;
        font-family: inherit;
        font-size: 1rem;
        color: #1e293b;
        background: white;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        box-sizing: border-box;
    }

    .search-input:focus {
        border-color: #3b82f6;
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

    .alert.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 4rem;
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
        padding: 4rem;
        color: #94a3b8;
        background: white;
        border-radius: 12px;
        border: 1.5px dashed #cbd5e1;
    }

    .empty-icon {
        font-size: 3rem;
    }

    .users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.25rem;
    }

    .user-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        gap: 1.25rem;
        align-items: flex-start;
        transition: box-shadow 0.2s;
    }

    .user-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }

    .user-avatar-container {
        flex-shrink: 0;
    }

    .user-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #f1f5f9;
        background: #f8fafc;
    }

    .user-avatar-placeholder {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e0f2fe, #bae6fd);
        color: #0284c7;
        font-weight: 700;
        font-size: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #f1f5f9;
    }

    .user-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        overflow: hidden;
    }

    .user-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .username {
        font-weight: 700;
        font-size: 1.1rem;
        color: #1e293b;
        word-break: break-all;
    }

    .role-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .role-admin {
        background: #fee2e2;
        color: #991b1b;
    }
    .role-owner {
        background: #fef3c7;
        color: #92400e;
    }
    .role-user {
        background: #e0e7ff;
        color: #3730a3;
    }

    .user-meta {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.85rem;
    }

    .user-id {
        color: #94a3b8;
        font-family: monospace;
        font-size: 0.8rem;
    }

    .user-email {
        color: #475569;
        word-break: break-all;
    }

    .verify-badge {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .verify-badge.verified {
        background: #dcfce7;
        color: #166534;
    }
    .verify-badge.unverified {
        background: #f1f5f9;
        color: #64748b;
    }

    .user-header .role-badge.role-owner {
        background: #dcfce7;
        color: #166534;
    }
    .user-header .role-badge.role-admin {
        background: #fee2e2;
        color: #991b1b;
    }

    .spin-inline {
        display: inline-block;
        animation: spin 1s linear infinite;
        vertical-align: middle;
        margin-right: 4px;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .user-date {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #94a3b8;
    }
</style>
