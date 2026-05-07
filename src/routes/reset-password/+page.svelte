<script lang="ts">
    import { api } from "$lib/api/client";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import AuthCard from "$lib/components/user/AuthCard.svelte";

    let password = $state("");
    let confirmPassword = $state("");
    let error = $state("");
    let success = $state("");
    let loading = $state(false);

    const token = $page.url.searchParams.get("token");

    async function handleResetPassword(e: Event) {
        e.preventDefault();
        error = "";
        success = "";

        if (!token) {
            error = "Token de recuperación no válido o ausente.";
            return;
        }

        if (password !== confirmPassword) {
            error = "Las contraseñas no coinciden.";
            return;
        }

        if (password.length < 8) {
            error = "La contraseña debe tener al menos 8 caracteres.";
            return;
        }

        loading = true;

        try {
            const response = await api.auth.resetPassword({ token, password });

            if (response.ok) {
                success = "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.";
            } else {
                error = response.message || "Ocurrió un error al restablecer tu contraseña.";
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
    title="Restablecer contraseña"
    subtitle="Introduce tu nueva contraseña a continuación."
    {error}
>
    {#if !token}
        <div class="error-container">
            <p class="error-text">El enlace de recuperación no es válido o ha expirado.</p>
            <button class="submit-btn" onclick={() => goto("/forgot-password")}>
                Solicitar nuevo enlace
            </button>
        </div>
    {:else if success}
        <div class="success-container">
            <p class="success-message">{success}</p>
            <button class="submit-btn" onclick={() => goto("/login")}>
                Iniciar sesión
            </button>
        </div>
    {:else}
        <form onsubmit={handleResetPassword}>
            <div class="input-group">
                <label for="password">Nueva contraseña</label>
                <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    bind:value={password}
                    required
                />
            </div>

            <div class="input-group">
                <label for="confirmPassword">Confirmar nueva contraseña</label>
                <input
                    type="password"
                    id="confirmPassword"
                    placeholder="••••••••"
                    bind:value={confirmPassword}
                    required
                />
            </div>

            <button type="submit" class="submit-btn" disabled={loading}>
                {loading ? "Restableciendo..." : "Restablecer contraseña"}
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
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
    }

    input[type="password"] {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.2s;
        outline: none;
    }

    input[type="password"]:focus {
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

    .success-container, .error-container {
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

    .error-text {
        color: #ef4444;
        background-color: #fef2f2;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        font-size: 0.95rem;
        line-height: 1.5;
    }
</style>
