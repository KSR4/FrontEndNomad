<script lang="ts">
    import { goto } from "$app/navigation";
</script>

<div class="landing-container">
    <!-- LEFT SIDE -->
    <div class="left-panel">
        <div class="logo">Nomad<span class="dot">.</span></div>

        <div class="hero-content">
            <div class="badge">Version 1.0</div>
            <h1>
                Los mejores<br />
                productos,<br />
                <em>donde quieras.</em>
            </h1>
            <p class="subtitle">
                Descubra los mejores vendedores en su área, explore menús y pida
                sus productos favoritos.
            </p>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-num"></span> <!-- 50+ -->
                    <span class="stat-label"></span> <!-- Vendedores -->
                </div>
                <div class="divider"></div>
                <div class="stat-item">
                    <span class="stat-num"></span> <!-- 1k -->
                    <span class="stat-label"></span> <!-- Pedidos diarios -->
                </div>
                <div class="divider"></div>
                <div class="stat-item">
                    <span class="stat-num"></span> <!--4.9 -->
                    <span class="stat-label"></span> <!-- valoracion -->
                </div>
            </div>
        </div>

        <p class="footer-text">© 2025 - 2026 Nomad</p>
    </div>

    <!-- RIGHT SIDE -->
    <div class="right-panel">
        <div class="auth-box">
            <p class="auth-eyebrow">Bienvenido</p>
            <h2>Empieza ahora</h2>
            <p class="auth-sub">Elige cómo quieres continuar</p>

            <div class="auth-buttons">
                <button class="btn-primary" onclick={() => goto("/register")}>
                    Crear una cuenta
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M3 8h10M9 4l4 4-4 4"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </button>
                <button class="btn-ghost" onclick={() => goto("/login")}>
                    Iniciar sesión
                </button>
            </div>

            <p class="auth-terms">
                Al registrarte aceptas nuestros <a href="/terms">Términos</a> y
                <a href="/privacy">Privacidad</a>
            </p>
        </div>
    </div>
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600&display=swap");

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .landing-container {
        display: flex;
        height: 100vh;
        width: 100vw;
        font-family: "DM Sans", sans-serif;
    }

    /* ── LEFT ── */
    .left-panel {
        width: 55%;
        background: radial-gradient(
            ellipse 80% 60% at 50% 40%,
            #ddf1ff 0%,
            #ffffff 65%
        );
        padding: 3.5rem 4rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
    }

    .logo {
        font-family: "Fraunces", serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        letter-spacing: -0.02em;
    }

    .dot {
        color: #38bdf8;
    }

    .hero-content {
        animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        background: rgba(56, 189, 248, 0.1);
        border: 1px solid rgba(56, 189, 248, 0.25);
        color: #0284c7;
        padding: 0.3rem 0.85rem;
        border-radius: 100px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        margin-bottom: 1.8rem;
    }

    h1 {
        font-family: "Fraunces", serif;
        font-size: 4rem;
        line-height: 1.08;
        letter-spacing: -0.03em;
        color: #111;
        margin-bottom: 1.4rem;
        font-weight: 700;
    }

    h1 em {
        font-style: italic;
        font-weight: 400;
        color: #38bdf8;
    }

    .subtitle {
        color: #666;
        max-width: 380px;
        line-height: 1.65;
        font-size: 1rem;
        margin-bottom: 3rem;
        margin-left: auto;
        margin-right: auto;
    }

    .stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .stat-num {
        font-family: "Fraunces", serif;
        font-size: 1.6rem;
        font-weight: 700;
        color: #111;
        line-height: 1;
    }

    .stat-label {
        font-size: 0.7rem;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .divider {
        width: 1px;
        height: 28px;
        background: #dde8ef;
    }

    .footer-text {
        font-size: 0.78rem;
        color: #ccc;
    }

    /* ── RIGHT ── */
    .right-panel {
        width: 45%;
        background: #111;
        border-left: 1px solid #222;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem;
    }

    .auth-box {
        width: 100%;
        max-width: 340px;
        text-align: center;
        animation: fadeUp 0.7s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .auth-eyebrow {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #38bdf8;
        margin-bottom: 0.6rem;
    }

    h2 {
        font-family: "Fraunces", serif;
        font-size: 2.2rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.02em;
        margin-bottom: 0.5rem;
    }

    .auth-sub {
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 2.5rem;
    }

    .auth-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.8rem;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: #111;
        color: white;
        border: none;
        padding: 0.95rem 1.8rem;
        border-radius: 10px;
        font-family: "DM Sans", sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            background 0.2s,
            transform 0.15s;
        width: 100%;
    }

    .btn-primary:hover {
        background: #38bdf8;
        transform: translateY(-1px);
    }

    .btn-ghost {
        background: none;
        border: 1.5px solid #333;
        color: #aaa;
        padding: 0.95rem 1.8rem;
        border-radius: 10px;
        font-family: "DM Sans", sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            border-color 0.2s,
            color 0.2s;
        width: 100%;
    }

    .btn-ghost:hover {
        border-color: #fff;
        color: #fff;
    }

    .auth-terms {
        font-size: 0.72rem;
        color: #444;
        line-height: 1.5;
    }

    .auth-terms a {
        color: #38bdf8;
        text-decoration: none;
    }

    .auth-terms a:hover {
        text-decoration: underline;
    }

    @keyframes fadeUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 900px) {
        .landing-container {
            flex-direction: column;
            height: auto;
        }
        .left-panel,
        .right-panel {
            width: 100%;
            padding: 2.5rem;
        }
        h1 {
            font-size: 2.8rem;
        }
    }
</style>
