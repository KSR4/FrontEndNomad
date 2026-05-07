<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import AuthCard from "$lib/components/user/AuthCard.svelte";

    let status = $state("loading");
    let message = $state("Verificando tu cuenta...");
    let error = $state("");
    let resending = $state(false);
    let resendMessage = $state("");

    const token = $page.url.searchParams.get("token");

    onMount(async () => {
        if (!token) {
            status = "error";
            message = "No se ha proporcionado un token de verificación.";
            return;
        }

        try {
            const response = await api.auth.verifyEmail(token);
            if (response.ok) {
                status = "success";
                message = "Tu cuenta ha sido verificada correctamente.";
            } else {
                status = "error";
                message =
                    response.message ||
                    "La verificación ha fallado. El enlace puede haber expirado.";
            }
        } catch (err) {
            console.error(err);
            status = "error";
            message = "Ocurrió un error inesperado durante la verificación.";
        }
    });

    async function handleResendVerification() {
        resending = true;
        resendMessage = "";
        error = "";

        try {
            const response = await api.auth.resendVerification();
            if (response.ok) {
                resendMessage =
                    "Se ha enviado un nuevo correo de verificación.";
            } else {
                error =
                    response.message ||
                    "No se pudo reenviar el correo. Asegúrate de haber iniciado sesión.";
            }
        } catch (err) {
            console.error(err);
            error = "Error al intentar reenviar el correo.";
        } finally {
            resending = false;
        }
    }
</script>

<AuthCard
    title="Verificación de cuenta"
    subtitle={status === "loading" ? "Por favor, espera un momento." : ""}
    {error}
>
    <div class="status-container">
        {#if status === "loading"}
            <div class="loader"></div>
            <p class="status-text">{message}</p>
        {:else if status === "success"}
            <div class="success-icon">✓</div>
            <p class="success-text">{message}</p>
            <button class="submit-btn" onclick={() => goto("/login")}>
                Ir al inicio de sesión
            </button>
        {:else}
            <div class="error-icon">✕</div>
            <p class="error-text">{message}</p>

            {#if resendMessage}
                <p class="resend-success">{resendMessage}</p>
            {/if}

            <div class="actions">
                <button
                    class="secondary-btn"
                    onclick={handleResendVerification}
                    disabled={resending}
                >
                    {resending
                        ? "Enviando..."
                        : "Reenviar correo de verificación"}
                </button>
                <button class="link-btn" onclick={() => goto("/login")}>
                    Volver al login
                </button>
            </div>
        {/if}
    </div>

    {#snippet footer()}
        <p>© {new Date().getFullYear()} Tu Aplicación</p>
    {/snippet}
</AuthCard>

<style>
    .status-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 1rem 0;
    }

    .status-text {
        font-size: 1.1rem;
        color: var(--text-color);
        margin-top: 1rem;
    }

    .loader {
        width: 48px;
        height: 48px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .success-icon {
        font-size: 3rem;
        color: #10b981;
        background-color: #ecfdf5;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
    }

    .error-icon {
        font-size: 3rem;
        color: #ef4444;
        background-color: #fef2f2;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
    }

    .success-text {
        color: #10b981;
        font-weight: 500;
        margin-bottom: 2rem;
    }

    .error-text {
        color: #ef4444;
        font-weight: 500;
        margin-bottom: 1.5rem;
    }

    .resend-success {
        color: #10b981;
        font-size: 0.9rem;
        margin-bottom: 1rem;
    }

    .submit-btn {
        width: 100%;
        background-color: var(--primary-color, #000000);
        color: white;
        border: none;
        padding: 0.8rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
    }

    .secondary-btn {
        width: 100%;
        background-color: white;
        color: var(--text-color);
        border: 1px solid var(--border-color);
        padding: 0.8rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .actions {
        width: 100%;
        margin-top: 1rem;
    }

    .link-btn {
        background: none;
        border: none;
        color: var(--accent-color);
        font-weight: 600;
        cursor: pointer;
    }

    .link-btn:hover {
        text-decoration: underline;
    }
</style>
