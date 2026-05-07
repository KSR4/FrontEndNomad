<script lang="ts">
    import { api } from "$lib/api/client";
    import { goto } from "$app/navigation";
    import AuthCard from "$lib/components/user/AuthCard.svelte";

    let username = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let error = $state("");
    let loading = $state(false);

    async function handleRegister(e: Event) {
        e.preventDefault();
        error = "";
        loading = true;

        if (password !== confirmPassword) {
            error = "Las contraseñas no coinciden";
            loading = false;
            return;
        }

        try {
            const response = await api.auth.register({
                username,
                email,
                password,
            });

            if (response.ok) {
                goto("/login");
            } else {
                error =
                    response.message ||
                    "Error al registrar. Inténtalo de nuevo.";
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
    title="Crear cuenta"
    subtitle="Comienza tu viaje con nosotros hoy."
    {error}
>
    <form onsubmit={handleRegister}>
        <div class="input-group">
            <label for="username">Nombre de usuario</label>
            <input
                type="text"
                id="username"
                placeholder="Iker Esquinas"
                bind:value={username}
                required
            />
        </div>

        <div class="input-group">
            <label for="email">Correo electrónico</label>
            <input
                type="email"
                id="email"
                placeholder="ikeresquinas@gmail.com"
                bind:value={email}
                required
            />
        </div>

        <div class="input-group">
            <label for="password">Contraseña</label>
            <input
                type="password"
                id="password"
                placeholder="••••••••"
                bind:value={password}
                required
            />
        </div>

        <div class="input-group">
            <label for="confirm-password">Confirmar contraseña</label>
            <input
                type="password"
                id="confirm-password"
                placeholder="••••••••"
                bind:value={confirmPassword}
                required
            />
        </div>

        <button type="submit" class="submit-btn" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
    </form>

    {#snippet footer()}
        <p>
            ¿Ya tienes una cuenta? <button
                class="link-btn"
                onclick={() => goto("/login")}>Inicia sesión</button
            >
        </p>
    {/snippet}
</AuthCard>

<style>
    .input-group {
        margin-bottom: 1.25rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
    }

    input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.2s;
        outline: none;
    }

    input:focus {
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
        margin-top: 1rem;
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
</style>

