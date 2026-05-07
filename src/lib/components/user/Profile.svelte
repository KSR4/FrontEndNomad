<script lang="ts">
    import { session } from "$lib/stores/session.svelte";
    import { api } from "$lib/api/client";
    import Modal from "$lib/components/layout/Modal.svelte";
    import Notifications from "$lib/components/user/Notifications.svelte";
    import SupportTickets from "$lib/components/user/SupportTickets.svelte";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";
    import type { NotificationEntity } from "$lib/api/client";
    import { User, Bell, LifeBuoy, AlertTriangle } from "lucide-svelte";

    let activeTab = $state<"profile" | "notifications" | "support">("profile");
    let editing = $state(false);
    let saving = $state(false);
    let successMsg = $state("");
    let errorMsg = $state("");

    let formUsername = $state("");
    let formEmail = $state("");
    let formPassword = $state("");
    let formConfirmPassword = $state("");
    let formCurrentPassword = $state("");
    let formAvatarBase64 = $state("");
    let avatarPreview = $state("");

    let resending = $state(false);
    let resendMsg = $state("");
    let resendError = $state("");

    let showDeleteModal = $state(false);

    const AVATAR_MAX_SIZE = 256;
    const MAX_FILE_BYTES = 5 * 1024 * 1024;

    function base64ToDataUrl(b64: string): string {
        if (!b64) return "";
        if (b64.startsWith("data:")) return b64;
        return `data:image/jpeg;base64,${b64}`;
    }

    function resizeImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let w = img.width;
                    let h = img.height;

                    if (w > h) {
                        if (w > AVATAR_MAX_SIZE) {
                            h = Math.round((h * AVATAR_MAX_SIZE) / w);
                            w = AVATAR_MAX_SIZE;
                        }
                    } else {
                        if (h > AVATAR_MAX_SIZE) {
                            w = Math.round((w * AVATAR_MAX_SIZE) / h);
                            h = AVATAR_MAX_SIZE;
                        }
                    }

                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext("2d")!;
                    ctx.drawImage(img, 0, 0, w, h);

                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
                    resolve(dataUrl.split(",")[1]);
                };
                img.onerror = reject;
                img.src = e.target!.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function startEdit() {
        formUsername = session.user?.username ?? "";
        formEmail = session.user?.email ?? "";
        formPassword = "";
        formConfirmPassword = "";
        formCurrentPassword = "";
        avatarPreview = session.user?.avatar
            ? base64ToDataUrl(session.user.avatar)
            : "";
        formAvatarBase64 = session.user?.avatar ?? "";
        editing = true;
        successMsg = "";
        errorMsg = "";
    }

    function cancelEdit() {
        editing = false;
        successMsg = "";
        errorMsg = "";
    }

    async function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_BYTES) {
            errorMsg = "La imagen no puede superar 5 MB.";
            input.value = "";
            return;
        }
        errorMsg = "";

        try {
            formAvatarBase64 = await resizeImage(file);
            avatarPreview = `data:image/jpeg;base64,${formAvatarBase64}`;
        } catch {
            errorMsg = "No se pudo procesar la imagen.";
        }
    }

    async function saveChanges() {
        if (!session.user?.id) return;
        saving = true;
        errorMsg = "";
        successMsg = "";

        try {
            if (formUsername && formUsername !== session.user.username) {
                const res = await api.user.updateUsername(
                    session.user.id,
                    formUsername,
                );
                if (!res.ok)
                    throw new Error(
                        res.message || "Error al actualizar nombre de usuario.",
                    );
                session.setUser({ ...session.user, username: formUsername });
            }

            if (formEmail && formEmail !== session.user.email) {
                const res = await api.user.updateEmail(
                    session.user.id,
                    formEmail,
                );
                if (!res.ok)
                    throw new Error(
                        res.message || "Error al actualizar email.",
                    );
                session.setUser({ ...session.user, email: formEmail });
            }

            if (formPassword) {
                if (!formCurrentPassword) {
                    throw new Error(
                        "Debes introducir tu contraseña actual para cambiarla.",
                    );
                }
                if (formPassword !== formConfirmPassword) {
                    throw new Error(
                        "La nueva contraseña y su confirmación no coinciden.",
                    );
                }
                const res = await api.user.changePassword({
                    currentPassword: formCurrentPassword,
                    newPassword: formPassword,
                });
                if (!res.ok)
                    throw new Error(
                        res.message || "Error al cambiar la contraseña.",
                    );
            }

            if (formAvatarBase64 && formAvatarBase64 !== session.user.avatar) {
                const res = await api.user.updateAvatar(
                    session.user.id,
                    formAvatarBase64,
                );
                if (!res.ok)
                    throw new Error(
                        res.message || "Error al actualizar el avatar.",
                    );
                session.setUser({ ...session.user, avatar: formAvatarBase64 });
            }

            successMsg = "Perfil actualizado correctamente.";
            editing = false;
        } catch (err: any) {
            errorMsg = err.message ?? "Error al guardar los cambios.";
        } finally {
            saving = false;
        }
    }

    async function handleResendVerification() {
        resending = true;
        resendMsg = "";
        resendError = "";

        try {
            const res = await api.auth.resendVerification();
            if (res.ok) {
                resendMsg = "Correo de verificación reenviado correctamente.";
            } else {
                resendError = res.message || "Error al reenviar el correo.";
            }
        } catch (err: any) {
            resendError = err.message || "Error inesperado.";
        } finally {
            resending = false;
        }
    }

    async function handleDeleteAccount() {
        try {
            const res = await api.user.deleteSelf();
            if (res.ok) {
                session.setToken(null);
                goto("/");
            } else {
                errorMsg = res.message || "Error al eliminar la cuenta.";
            }
        } catch (err: any) {
            errorMsg = err.message || "Error inesperado.";
        } finally {
            showDeleteModal = false;
        }
    }

    let unreadCount = $state(0);
    let pollInterval: ReturnType<typeof setInterval>;

    async function fetchUnreadCount() {
        try {
            const res = await api.notifications.list();
            if (res.ok) {
                const raw: NotificationEntity[] = Array.isArray(res.data)
                    ? res.data
                    : [];
                unreadCount = raw.filter(
                    (n: NotificationEntity) => !n.isRead,
                ).length;
            }
        } catch {}
    }

    onMount(() => {
        fetchUnreadCount();
        pollInterval = setInterval(fetchUnreadCount, 30000);
    });

    onDestroy(() => clearInterval(pollInterval));

    let currentAvatar = $derived(
        session.user?.avatar ? base64ToDataUrl(session.user.avatar) : "",
    );
</script>

<div class="centered-content">
    <div class="avatar-wrapper">
        {#if avatarPreview}
            <img src={avatarPreview} alt="Avatar" class="avatar-img" />
        {:else if currentAvatar}
            <img src={currentAvatar} alt="Avatar" class="avatar-img" />
        {:else}
            <div class="avatar-placeholder">
                {(session.user?.username ?? "?")[0].toUpperCase()}
            </div>
        {/if}
    </div>

    <div class="profile-tabs">
        <button
            class="ptab"
            class:active={activeTab === "profile"}
            onclick={() => (activeTab = "profile")}
            ><User size={18} /> Mi Perfil</button
        >
        {#if session.user?.isVerified}
            <button
                class="ptab"
                class:active={activeTab === "notifications"}
                onclick={() => {
                    activeTab = "notifications";
                    unreadCount = 0;
                }}
            >
                <Bell size={18} /> Notificaciones
                {#if unreadCount > 0}
                    <span class="tab-badge">{unreadCount}</span>
                {/if}
            </button>
            <button
                class="ptab"
                class:active={activeTab === "support"}
                onclick={() => (activeTab = "support")}
                ><LifeBuoy size={18} /> Mis Tickets</button
            >
        {/if}
    </div>

    <div class="tab-content">
        {#if activeTab === "profile"}
            {#if successMsg}
                <p class="msg success">{successMsg}</p>
            {/if}
            {#if errorMsg}
                <p class="msg error">{errorMsg}</p>
            {/if}

            {#if session.user && !session.user.isVerified}
                <div class="verification-banner">
                    <div class="banner-content">
                        <span class="icon"
                            ><AlertTriangle size={20} color="#92400e" /></span
                        >
                        <div class="text">
                            <strong>Cuenta no verificada</strong>
                            <p>
                                Debes verificar tu cuenta para acceder a todas
                                las funciones de la aplicación.
                            </p>
                        </div>
                    </div>
                    <button
                        class="btn resend"
                        onclick={handleResendVerification}
                        disabled={resending}
                    >
                        {resending ? "Enviando..." : "Reenviar correo"}
                    </button>
                </div>
                {#if resendMsg}
                    <p class="msg success">{resendMsg}</p>
                {/if}
                {#if resendError}
                    <p class="msg error">{resendError}</p>
                {/if}
            {/if}

            {#if !editing}
                <div class="info-grid">
                    <div class="info-item">
                        <span class="field-label">Nombre de usuario</span>
                        <p>{session.user?.username ?? "Cargando..."}</p>
                    </div>
                    <div class="info-item">
                        <span class="field-label">Email</span>
                        <p>{session.user?.email ?? "Cargando..."}</p>
                    </div>
                </div>
                <button class="btn primary" onclick={startEdit}
                    >Editar perfil</button
                >
                <button
                    class="btn danger-link"
                    onclick={() => (showDeleteModal = true)}
                    >Eliminar cuenta</button
                >
            {:else}
                <form
                    class="edit-form"
                    onsubmit={(e) => {
                        e.preventDefault();
                        saveChanges();
                    }}
                >
                    <div class="form-group">
                        <label for="avatar-input"
                            >Avatar (máx. 5 MB · se redimensiona a {AVATAR_MAX_SIZE}px)</label
                        >
                        <input
                            id="avatar-input"
                            type="file"
                            accept="image/*"
                            onchange={handleFileChange}
                        />
                    </div>

                    <div class="form-group">
                        <label for="username-input">Nombre de usuario</label>
                        <input
                            id="username-input"
                            type="text"
                            bind:value={formUsername}
                            placeholder="Nuevo username"
                        />
                    </div>

                    <div class="form-group">
                        <label for="email-input">Email</label>
                        <input
                            id="email-input"
                            type="email"
                            bind:value={formEmail}
                            placeholder="Nuevo email"
                        />
                    </div>

                    <div class="form-group">
                        <label for="password-input">Contraseña actual</label>
                        <input
                            id="current-password-input"
                            type="password"
                            bind:value={formCurrentPassword}
                            placeholder="Contraseña actual"
                        />
                    </div>

                    <div class="form-group">
                        <label for="password-input"
                            >Nueva contraseña <span class="hint"
                                >(dejar vacío para no cambiar)</span
                            ></label
                        >
                        <input
                            id="password-input"
                            type="password"
                            bind:value={formPassword}
                            placeholder="Nueva contraseña"
                        />
                    </div>

                    <div class="form-group">
                        <label for="confirm-password-input"
                            >Confirmar nueva contraseña</label
                        >
                        <input
                            id="confirm-password-input"
                            type="password"
                            bind:value={formConfirmPassword}
                            placeholder="Repite la nueva contraseña"
                        />
                    </div>

                    <div class="btn-row">
                        <button
                            type="submit"
                            class="btn primary"
                            disabled={saving}
                        >
                            {saving ? "Guardando…" : "Guardar"}
                        </button>
                        <button
                            type="button"
                            class="btn secondary"
                            onclick={cancelEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            {/if}
        {/if}

        {#if session.user?.isVerified}
            {#if activeTab === "notifications"}
                <Notifications />
            {/if}

            {#if activeTab === "support"}
                <SupportTickets />
            {/if}
        {/if}
    </div>

    <Modal
        show={showDeleteModal}
        title="Eliminar cuenta"
        onClose={() => (showDeleteModal = false)}
    >
        <p class="delete-warning">
            ¿Estás completamente seguro? Esta acción es <strong
                >permanente</strong
            > y eliminará todos tus datos, negocios, y pedidos de nuestra plataforma.
        </p>

        {#snippet footer()}
            <button
                class="btn secondary"
                onclick={() => (showDeleteModal = false)}>Cancelar</button
            >
            <button class="btn danger" onclick={handleDeleteAccount}
                >Eliminar permanentemente</button
            >
        {/snippet}
    </Modal>
</div>

<style>
    .centered-content {
        max-width: 660px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
        padding: 1rem 0;
    }

    .profile-tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 2px solid #e2e8f0;
        width: 100%;
        padding-bottom: 0;
    }

    .ptab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        padding: 0.65rem 1rem;
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

    .ptab:hover {
        color: #1e293b;
        background: #f8fafc;
    }
    .ptab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
    }

    .tab-badge {
        background: #ef4444;
        color: white;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.1rem 0.42rem;
        border-radius: 999px;
        line-height: 1.4;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.65;
        }
    }

    .tab-content {
        width: 100%;
    }

    .avatar-wrapper {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid #3b82f6;
        flex-shrink: 0;
    }
    .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .avatar-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #fff;
        font-size: 2.5rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info-grid {
        display: grid;
        gap: 1.25rem;
        width: 100%;
    }
    .info-item .field-label {
        display: block;
        font-size: 0.82rem;
        color: #64748b;
        margin-bottom: 0.2rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .info-item p {
        font-size: 1.05rem;
        font-weight: 500;
        color: #1e293b;
        margin: 0;
    }

    .edit-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }
    .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
    }
    .form-group input[type="text"],
    .form-group input[type="email"],
    .form-group input[type="password"] {
        padding: 0.55rem 0.85rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 1rem;
        color: #1e293b;
        background: #f8fafc;
        transition: border-color 0.2s;
        outline: none;
    }
    .form-group input:focus {
        border-color: #3b82f6;
        background: #fff;
    }
    .form-group input[type="file"] {
        font-size: 0.9rem;
        color: #475569;
    }
    .hint {
        font-weight: 400;
        color: #94a3b8;
        font-size: 0.78rem;
    }

    .btn-row {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }
    .btn {
        padding: 0.6rem 1.4rem;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            opacity 0.15s,
            transform 0.1s;
    }
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .btn:not(:disabled):hover {
        opacity: 0.88;
        transform: translateY(-1px);
    }
    .btn.primary {
        background: #3b82f6;
        color: #fff;
    }
    .btn.secondary {
        background: #e2e8f0;
        color: #334155;
    }
    .btn.danger {
        background: #ef4444;
        color: #fff;
    }
    .btn.danger-link {
        background: transparent;
        color: #ef4444;
        font-size: 0.9rem;
        padding: 0.5rem;
        margin-top: 1rem;
    }
    .btn.danger-link:hover {
        text-decoration: underline;
        transform: none;
        box-shadow: none;
    }

    .msg {
        width: 100%;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        margin: 0;
    }
    .msg.success {
        background: #dcfce7;
        color: #166534;
    }
    .msg.error {
        background: #fee2e2;
        color: #991b1b;
    }

    .verification-banner {
        width: 100%;
        background-color: #fffbeb;
        border: 1px solid #fef3c7;
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .banner-content {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
    }

    .banner-content .icon {
        font-size: 1.25rem;
    }

    .banner-content .text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }

    .banner-content strong {
        color: #92400e;
        font-size: 0.95rem;
    }

    .banner-content p {
        color: #b45309;
        font-size: 0.85rem;
        margin: 0;
    }

    .btn.resend {
        background: #f59e0b;
        color: white;
        font-size: 0.85rem;
        padding: 0.5rem 1rem;
        flex-shrink: 0;
    }

    .btn.resend:hover {
        background: #d97706;
    }

    @media (max-width: 480px) {
        .verification-banner {
            flex-direction: column;
            align-items: stretch;
        }
        .btn.resend {
            width: 100%;
        }
    }

    .delete-warning {
        color: #1e293b;
        line-height: 1.5;
        font-size: 1rem;
    }

    .delete-warning strong {
        color: #ef4444;
    }
</style>
