<script lang="ts">
    import { api } from "$lib/api/client";
    import {
        Rocket,
        CheckCircle2,
        AlertTriangle,
        MapPin,
        Info,
    } from "lucide-svelte";

    let shopName = $state("");
    let message = $state("");
    let sending = $state(false);
    let successMsg = $state("");
    let errorMsg = $state("");
    let geoStatus = $state<"idle" | "loading" | "success" | "error">("idle");
    let userLat = $state<number | null>(null);
    let userLng = $state<number | null>(null);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        sending = true;
        successMsg = "";
        errorMsg = "";
        geoStatus = "loading";

        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(
                            new Error(
                                "Tu navegador no soporta geolocalización.",
                            ),
                        );
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0,
                    });
                },
            );

            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
            geoStatus = "success";

            const res = await api.tickets.create(
                shopName,
                message,
                userLat,
                userLng,
            );
            if (!res.ok)
                throw new Error(res.message || "Error al enviar la solicitud.");
            successMsg = "¡Solicitud enviada! Revisaremos tu petición pronto.";
            shopName = "";
            message = "";
            geoStatus = "idle";
            userLat = null;
            userLng = null;
        } catch (err: any) {
            if (err.code === 1) {
                errorMsg =
                    "Necesitas permitir el acceso a tu ubicación para enviar la solicitud.";
            } else if (err.code === 2) {
                errorMsg =
                    "No se pudo obtener tu ubicación. Comprueba tu conexión GPS.";
            } else if (err.code === 3) {
                errorMsg =
                    "La solicitud de ubicación ha expirado. Inténtalo de nuevo.";
            } else {
                errorMsg = err.message ?? "Error al enviar la solicitud.";
            }
            geoStatus = "error";
        } finally {
            sending = false;
        }
    }
</script>

<div class="centered-content">
    <div class="hero">
        <div class="hero-icon-wrap">
            <span class="hero-icon"><Rocket size={32} color="#3b82f6" /></span>
        </div>
        <p class="description">
            Empieza a vender tus productos en los mejores eventos. Rellena el
            formulario y nuestro equipo revisará tu solicitud. Al enviar,
            capturaremos tu ubicación actual.
        </p>
    </div>

    {#if successMsg}
        <div class="alert success">
            <span class="alert-icon"><CheckCircle2 size={18} /></span>
            {successMsg}
        </div>
    {/if}
    {#if errorMsg}
        <div class="alert error">
            <span class="alert-icon"><AlertTriangle size={18} /></span>
            {errorMsg}
        </div>
    {/if}

    <form onsubmit={handleSubmit}>
        <div class="form-group">
            <label for="store-name">Nombre de la tienda</label>
            <input
                type="text"
                id="store-name"
                bind:value={shopName}
                placeholder="Ej. Tacos El Pastor"
                required
                disabled={sending}
            />
        </div>

        <div class="form-group">
            <label for="store-message">Mensaje</label>
            <textarea
                id="store-message"
                bind:value={message}
                placeholder="Cuéntanos sobre tu tienda, qué vendes y por qué quieres unirte..."
                required
                disabled={sending}
            ></textarea>
        </div>

        {#if geoStatus === "loading"}
            <div class="geo-info loading">
                <div class="geo-spinner"></div>
                <span>Obteniendo tu ubicación…</span>
            </div>
        {:else if geoStatus === "success" && userLat !== null && userLng !== null}
            <div class="geo-info success">
                <span class="geo-icon"><MapPin size={16} /></span>
                <span
                    >Ubicación capturada: {userLat.toFixed(4)}, {userLng.toFixed(
                        4,
                    )}</span
                >
            </div>
        {/if}

        <button type="submit" class="cta-btn" disabled={sending}>
            {#if sending}
                <span class="btn-spinner"></span> Enviando…
            {:else}
                <MapPin size={18} /> Enviar solicitud con mi ubicación
            {/if}
        </button>

        <p class="geo-note">
            <span><Info size={14} /></span> Al pulsar enviar, tu navegador te pedirá
            permiso para acceder a tu ubicación.
        </p>
    </form>
</div>

<style>
    .centered-content {
        max-width: 600px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
    }

    .hero {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .hero-icon-wrap {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        background: linear-gradient(135deg, #dbeafe, #ede9fe);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hero-icon {
        font-size: 1.8rem;
        line-height: 1;
    }

    .description {
        color: #64748b;
        font-size: 0.95rem;
        line-height: 1.6;
        max-width: 480px;
        margin: 0;
    }

    .alert {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    }

    .alert-icon {
        flex-shrink: 0;
    }

    .alert.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
    }

    .alert.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }

    form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
    }

    input,
    textarea {
        width: 100%;
        padding: 0.65rem 0.9rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-family: inherit;
        font-size: 1rem;
        color: #1e293b;
        background: #f8fafc;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        outline: none;
        box-sizing: border-box;
    }

    input:focus,
    textarea:focus {
        border-color: #3b82f6;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input:disabled,
    textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    textarea {
        min-height: 120px;
        resize: vertical;
    }

    .geo-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    }

    .geo-info.loading {
        background: #fff7ed;
        color: #9a3412;
        border: 1px solid #fed7aa;
    }

    .geo-info.success {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
    }

    .geo-icon {
        font-size: 1.1rem;
    }

    .geo-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #fed7aa;
        border-top-color: #ea580c;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        flex-shrink: 0;
    }

    .cta-btn {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition:
            opacity 0.2s,
            transform 0.1s,
            box-shadow 0.2s;
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .cta-btn:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }

    .cta-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        display: inline-block;
    }

    .geo-note {
        font-size: 0.8rem;
        color: #94a3b8;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
