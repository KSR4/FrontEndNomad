<script lang="ts">
    import { api } from "$lib/api/client";
    import { goto } from "$app/navigation";
    import AuthCard from "$lib/components/user/AuthCard.svelte";

    let email = $state("");
    let error = $state("");
    let success = $state("");
    let loading = $state(false);

    async function handleForgotPassword(e: Event) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        try {
            const response = await api.auth.forgotPassword(email);

            if (response.ok) {
                success =
                    "Se ha enviado un enlace para restablecer tu contraseña.";
            } else {
                error =
                    response.message ||
                    "Ocurrió un error al procesar tu solicitud.";
            }
        } catch (err) {
            console.error(err);
            error = "Ocurrió un error inesperado.";
        } finally {
            loading = false;
        }
    }
</script>

<AuthCard
    title="Recuperar contraseña"
    subtitle="Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
    {error}
>
    {#if success}
        <div class="success-container">
            <p class="success-message">{success}</p>
            <button class="submit-btn" onclick={() => goto("/login")}>
                Volver al inicio de sesión
            </button>
        </div>
    {:else}
        <form onsubmit={handleForgotPassword}>
            <div class="input-group">
                <label for="email">Correo electrónico</label>
                <input
                    type="email"
                    id="email"
                    placeholder="name@company.com"
                    bind:value={email}
                    required
                />
            </div>

            <button type="submit" class="submit-btn" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
        </form>
    {/if}

    {#snippet footer()}
        <p>
            ¿Recordaste tu contraseña? <button
                class="link-btn"
                onclick={() => goto("/login")}>Inicia sesión</button
            >
        </p>
    {/snippet}
</AuthCard>

<style>
    .input-group {
        margin-bottom: 2rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
    }

    input[type="email"] {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.2s;
        outline: none;
    }

    input[type="email"]:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
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
        transition: all 0.2s;
        cursor: pointer;
    }

    .submit-btn:hover {
        background-color: #1a1a1a;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .link-btn {
        background: none;
        border: none;
        color: var(--accent-color);
        font-weight: 600;
        padding: 0;
        cursor: pointer;
    }

    .link-btn:hover {
        text-decoration: underline;
    }

    .success-container {
        text-align: center;
    }

    .success-message {
        color: #10b981;
        background-color: #ecfdf5;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        font-size: 0.95rem;
        line-height: 1.5;
    }
</style>
