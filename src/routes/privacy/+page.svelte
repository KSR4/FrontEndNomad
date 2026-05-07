<script lang="ts">
    import { goto } from "$app/navigation";
</script>

<div class="legal-container">
    <div class="legal-card">
        <button class="back-btn" onclick={() => goto("/")}>← Volver al inicio</button>
        
        <h1>Política de Privacidad</h1>
        <p class="last-updated">Última actualización: 16 de marzo de 2025</p>

        <section>
            <h2>1. Información que Recopilamos</h2>
            <p>Recopilamos información que nos proporcionas directamente al crear una cuenta, como tu nombre, correo electrónico y cualquier otra información que decidas compartir.</p>
        </section>

        <section>
            <h2>2. Uso de la Información</h2>
            <p>Utilizamos tu información para proporcionar, mantener y mejorar nuestros servicios, procesar transacciones y enviarte notificaciones relacionadas con tu cuenta.</p>
        </section>

        <section>
            <h2>3. Compartir Información</h2>
            <p>No vendemos tu información personal a terceros. Solo compartimos datos con proveedores de servicios necesarios para operar la plataforma o cuando sea requerido por ley.</p>
        </section>

        <section>
            <h2>4. Seguridad de los Datos</h2>
            <p>Implementamos medidas de seguridad para proteger tu información personal. Sin embargo, ningún método de transmisión por Internet es 100% seguro.</p>
        </section>

        <section>
            <h2>5. Tus Derechos</h2>
            <p>Tienes derecho a acceder, rectificar o eliminar tu información personal en cualquier momento a través de la configuración de tu perfil.</p>
        </section>

        <section>
            <h2>6. Cookies</h2>
            <p>Utilizamos cookies para mejorar la experiencia del usuario y analizar el tráfico del sitio. Puedes configurar tu navegador para rechazar todas las cookies.</p>
        </section>

        <div class="contact">
            <p>¿Preguntas sobre tu privacidad? <a href="mailto:privacy@nomad.com">Escríbenos</a></p>
        </div>
    </div>
</div>

<style>
    .legal-container {
        min-height: 100vh;
        background-color: #f8fafc;
        display: flex;
        justify-content: center;
        padding: 4rem 2rem;
        font-family: 'DM Sans', sans-serif;
    }

    .legal-card {
        background: white;
        width: 100%;
        max-width: 800px;
        padding: 4rem;
        border-radius: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
        position: relative;
    }

    .back-btn {
        background: none;
        border: none;
        color: #64748b;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: color 0.2s;
        padding: 0;
    }

    .back-btn:hover {
        color: #0f172a;
    }

    h1 {
        font-family: 'Fraunces', serif;
        font-size: 2.5rem;
        color: #0f172a;
        margin-bottom: 0.5rem;
    }

    .last-updated {
        color: #94a3b8;
        font-size: 0.9rem;
        margin-bottom: 3rem;
    }

    section {
        margin-bottom: 2.5rem;
    }

    h2 {
        font-family: 'Fraunces', serif;
        font-size: 1.5rem;
        color: #1e293b;
        margin-bottom: 1rem;
    }

    p {
        color: #475569;
        line-height: 1.7;
        font-size: 1.05rem;
    }

    .contact {
        margin-top: 4rem;
        padding-top: 2rem;
        border-top: 1px solid #f1f5f9;
        text-align: center;
        color: #64748b;
    }

    .contact a {
        color: #0ea5e9;
        font-weight: 600;
        text-decoration: none;
    }

    .contact a:hover {
        text-decoration: underline;
    }

    @media (max-width: 640px) {
        .legal-card {
            padding: 2.5rem;
            border-radius: 16px;
        }

        h1 { font-size: 2rem; }
    }
</style>
