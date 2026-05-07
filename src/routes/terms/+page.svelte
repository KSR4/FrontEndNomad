<script lang="ts">
    import { goto } from "$app/navigation";
</script>

<div class="legal-container">
    <div class="legal-card">
        <button class="back-btn" onclick={() => goto("/")}>← Volver al inicio</button>
        
        <h1>Términos de Servicio</h1>
        <p class="last-updated">Última actualización: 16 de marzo de 2025</p>

        <section>
            <h2>1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar Nomad, aceptas cumplir y estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.</p>
        </section>

        <section>
            <h2>2. Descripción del Servicio</h2>
            <p>Nomad es una plataforma que conecta a compradores con vendedores locales para la gestión de productos y pedidos. Actuamos como intermediarios y no somos responsables directamente de los productos ofrecidos por terceros.</p>
        </section>

        <section>
            <h2>3. Cuentas de Usuario</h2>
            <p>Para utilizar ciertas funciones, debes registrarte y crear una cuenta. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</p>
        </section>

        <section>
            <h2>4. Conducta del Usuario</h2>
            <p>Te comprometes a no utilizar el servicio para fines ilegales o no autorizados. No debes intentar dañar, deshabilitar o sobrecargar nuestra infraestructura.</p>
        </section>

        <section>
            <h2>5. Propiedad Intelectual</h2>
            <p>Todo el contenido original, características y funcionalidad de Nomad son propiedad de sus licenciantes y están protegidos por leyes internacionales de derechos de autor.</p>
        </section>

        <section>
            <h2>6. Limitación de Responsabilidad</h2>
            <p>En ningún caso Nomad será responsable de daños indirectos, incidentales o especiales que resulten del uso o la imposibilidad de usar el servicio.</p>
        </section>

        <div class="contact">
            <p>¿Tienes dudas? <a href="mailto:support@nomad.com">Contáctanos</a></p>
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
