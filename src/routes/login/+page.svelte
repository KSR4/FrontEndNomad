<script lang="ts">
    import { api } from "$lib/api/client";
    import { session } from "$lib/stores/session.svelte";
    import { goto } from "$app/navigation";
    import AuthCard from "$lib/components/user/AuthCard.svelte";

    let email = $state("");
    let password = $state("");
    let error = $state("");
    let loading = $state(false);

    async function handleLogin(e: Event) {
        e.preventDefault();
        error = "";
        loading = true;

        try {
            const response = await api.auth.login({ email, password });

            if (response.ok && response.data?.token) {
                session.setToken(response.data.token);

                const meResponse = await api.auth.me();
                if (meResponse.ok && meResponse.data) {
                    session.setUser(meResponse.data);

                    if (!meResponse.data.isVerified) {
                        goto("/app/profile");
                    } else {
                        goto("/app/sellers");
                    }
                }
            } else {
                error = response.message || "Credenciales incorrectas.";
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
    title="Bienvenido"
    subtitle="Introduce tus credenciales para acceder a tu cuenta."
    {error}
>
    <form onsubmit={handleLogin}>
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

        <div class="actions">
            <a href="/forgot-password" class="forgot"
                >¿Olvidaste tu contraseña?</a
            >
        </div>

        <button type="submit" class="submit-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
    </form>

    {#snippet footer()}
        <p>
            No tienes una cuenta? <button
                class="link-btn"
                onclick={() => goto("/register")}>Registrate</button
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

    input[type="email"],
    input[type="password"] {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        font-size: 1rem;
        transition: all 0.2s;
        outline: none;
    }

    input[type="email"]:focus,
    input[type="password"]:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-bottom: 2rem;
        font-size: 0.9rem;
    }

    .forgot {
        color: var(--text-color);
        text-decoration: none;
        font-weight: 500;
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
</style>
