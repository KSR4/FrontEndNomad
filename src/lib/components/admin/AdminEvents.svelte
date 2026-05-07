<script lang="ts">
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";
    import type { EventEntity, EventData } from "$lib/api/client";

    let events = $state<EventEntity[]>([]);
    let loading = $state(true);
    let errorMsg = $state("");

    let showModal = $state(false);
    let isEditing = $state(false);
    let currentId = $state<string | null>(null);

    let formName = $state("");
    let formDesc = $state("");
    let formLoc = $state("");
    let formLat = $state<number>(40.4168);
    let formLng = $state<number>(-3.7038);
    let formStart = $state("");
    let formEnd = $state("");

    let saving = $state(false);
    let formError = $state("");

    onMount(async () => {
        await loadEvents();
    });

    async function loadEvents() {
        loading = true;
        errorMsg = "";
        try {
            const res = await api.events.list();
            if (res.ok) {
                events = Array.isArray(res.data)
                    ? res.data
                    : (res.events ?? []);
                events.sort(
                    (a, b) =>
                        new Date(b.startDate).getTime() -
                        new Date(a.startDate).getTime(),
                );
            } else {
                errorMsg = res.message || "Error al cargar eventos.";
            }
        } catch {
            errorMsg = "Error inesperado.";
        } finally {
            loading = false;
        }
    }

    function openCreateModal() {
        isEditing = false;
        currentId = null;
        formName = "";
        formDesc = "";
        formLoc = "";
        formLat = 40.4168;
        formLng = -3.7038;

        // Defaults to today and tomorrow
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        formStart = now.toISOString().slice(0, 16);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        formEnd = tomorrow.toISOString().slice(0, 16);

        formError = "";
        showModal = true;
    }

    function openEditModal(ev: EventEntity) {
        isEditing = true;
        currentId = ev.id;
        formName = ev.name;
        formDesc = ev.description;
        formLoc = ev.location;
        formLat = ev.latitude;
        formLng = ev.longitude;

        // Convert to local datetime-local format
        formStart = formatForInput(ev.startDate);
        formEnd = formatForInput(ev.finishDate);

        formError = "";
        showModal = true;
    }

    function formatForInput(iso: string) {
        if (!iso) return "";
        try {
            const d = new Date(iso);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().slice(0, 16);
        } catch {
            return iso.slice(0, 16);
        }
    }

    async function saveEvent() {
        if (!formName || !formStart || !formEnd || !formLoc) {
            formError = "Faltan campos obligatorios.";
            return;
        }

        saving = true;
        formError = "";

        const payload: EventData = {
            name: formName,
            description: formDesc,
            location: formLoc,
            latitude: Number(formLat),
            longitude: Number(formLng),
            startDate: new Date(formStart).toISOString(),
            finishDate: new Date(formEnd).toISOString(),
        };

        try {
            if (isEditing && currentId) {
                const res = await api.events.update(currentId, payload);
                if (res.ok) {
                    showModal = false;
                    await loadEvents();
                } else {
                    formError = res.message || "Error al actualizar evento.";
                }
            } else {
                const res = await api.events.create(payload);
                if (res.ok) {
                    showModal = false;
                    await loadEvents();
                } else {
                    formError = res.message || "Error al crear evento.";
                }
            }
        } catch {
            formError = "Error de red al guardar.";
        } finally {
            saving = false;
        }
    }

    async function deleteEvent(id: string) {
        if (!confirm("¿Seguro que deseas eliminar este evento?")) return;
        try {
            const res = await api.events.delete(id);
            if (res.ok) {
                await loadEvents();
            } else {
                alert(res.message || "Error al eliminar");
            }
        } catch {
            alert("Error al eliminar");
        }
    }

    function formatDisplayDate(iso: string) {
        if (!iso) return "N/A";
        return new Date(iso).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    async function setMyLocation() {
        if (!navigator.geolocation) {
            formError = "Geolocalización no soportada por el navegador.";
            return;
        }
        formError = "";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                formLat = pos.coords.latitude;
                formLng = pos.coords.longitude;
            },
            () => {
                formError = "No se pudo obtener la ubicación actual.";
            },
            { enableHighAccuracy: true, timeout: 5000 },
        );
    }
</script>

<div class="admin-events">
    <div class="header-row">
        <button class="btn-refresh" onclick={loadEvents} disabled={loading}>
            ↻ Actualizar
        </button>
        <button class="btn-create" onclick={openCreateModal}>
            + Crear Evento
        </button>
    </div>

    {#if errorMsg}
        <div class="alert error">{errorMsg}</div>
    {/if}

    {#if loading}
        <div class="loading">Cargando eventos...</div>
    {:else if events.length === 0}
        <div class="empty">No hay eventos creados.</div>
    {:else}
        <div class="events-grid">
            {#each events as ev}
                <div class="event-card">
                    <div class="card-header">
                        <h3>{ev.name}</h3>
                        <div class="card-actions">
                            <button
                                class="icon-btn edit"
                                onclick={() => openEditModal(ev)}>✏️</button
                            >
                            <button
                                class="icon-btn del"
                                onclick={() => deleteEvent(ev.id)}>🗑️</button
                            >
                        </div>
                    </div>
                    <p class="desc">{ev.description}</p>
                    <div class="meta-info">
                        <span>📍 {ev.location}</span>
                        <span class="coords"
                            >({ev.latitude?.toFixed(4)}, {ev.longitude?.toFixed(
                                4,
                            )})</span
                        >
                    </div>
                    <div class="meta-dates">
                        <span
                            ><strong>Inicio:</strong>
                            {formatDisplayDate(ev.startDate)}</span
                        >
                        <span
                            ><strong>Fin:</strong>
                            {formatDisplayDate(ev.finishDate)}</span
                        >
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if showModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={() => !saving && (showModal = false)}>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? "Editar Evento" : "Crear Nuevo Evento"}</h2>

            <div class="form-grid">
                <div class="form-group full">
                    <label for="name">Nombre</label>
                    <input
                        id="name"
                        type="text"
                        bind:value={formName}
                        disabled={saving}
                    />
                </div>

                <div class="form-group full">
                    <label for="desc">Descripción</label>
                    <textarea
                        id="desc"
                        bind:value={formDesc}
                        disabled={saving}
                        rows="3"
                    ></textarea>
                </div>

                <div class="form-group full">
                    <label for="loc">Lugar / Ubicación física (texto)</label>
                    <input
                        id="loc"
                        type="text"
                        bind:value={formLoc}
                        disabled={saving}
                    />
                </div>

                <div class="form-group">
                    <label for="lat">Latitud</label>
                    <input
                        id="lat"
                        type="number"
                        step="0.0001"
                        bind:value={formLat}
                        disabled={saving}
                    />
                </div>

                <div class="form-group">
                    <label for="lng">Longitud</label>
                    <input
                        id="lng"
                        type="number"
                        step="0.0001"
                        bind:value={formLng}
                        disabled={saving}
                    />
                </div>

                <div class="form-group full">
                    <button
                        class="btn-location"
                        onclick={setMyLocation}
                        type="button">📍 Usar mi ubicación actual</button
                    >
                </div>

                <div class="form-group">
                    <label for="start">Fecha de inicio</label>
                    <input
                        id="start"
                        type="datetime-local"
                        bind:value={formStart}
                        disabled={saving}
                    />
                </div>

                <div class="form-group">
                    <label for="end">Fecha de fin</label>
                    <input
                        id="end"
                        type="datetime-local"
                        bind:value={formEnd}
                        disabled={saving}
                    />
                </div>
            </div>

            {#if formError}
                <div class="form-error">{formError}</div>
            {/if}

            <div class="modal-actions">
                <button
                    class="btn-cancel"
                    onclick={() => (showModal = false)}
                    disabled={saving}>Cancelar</button
                >
                <button class="btn-save" onclick={saveEvent} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar Evento"}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .admin-events {
        max-width: 1000px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .btn-refresh {
        background: #f1f5f9;
        border: 1.5px solid #e2e8f0;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        color: #475569;
    }

    .btn-create {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .empty,
    .loading {
        text-align: center;
        padding: 4rem;
        color: #64748b;
        background: white;
        border-radius: 12px;
        border: 1.5px dashed #cbd5e1;
    }

    .events-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
    }

    .event-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        transition: box-shadow 0.2s;
    }

    .event-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.5rem;
    }

    .card-header h3 {
        margin: 0;
        font-size: 1.15rem;
        color: #1e293b;
    }

    .card-actions {
        display: flex;
        gap: 0.25rem;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.7;
        transition: opacity 0.2s;
    }

    .icon-btn:hover {
        opacity: 1;
    }

    .desc {
        font-size: 0.9rem;
        color: #64748b;
        margin: 0 0 1rem 0;
        line-height: 1.5;
    }

    .meta-info,
    .meta-dates {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.85rem;
        color: #475569;
        margin-bottom: 0.5rem;
    }

    .coords {
        color: #94a3b8;
        font-family: monospace;
        font-size: 0.8rem;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
    }

    .modal-content {
        background: white;
        width: 100%;
        max-width: 500px;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-content h2 {
        margin: 0 0 1.5rem 0;
    }

    .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .form-group.full {
        grid-column: 1 / -1;
    }

    .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.6rem;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-family: inherit;
        outline: none;
        box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        border-color: #3b82f6;
    }

    .btn-location {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
        padding: 0.5rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
    }

    .form-error {
        margin-top: 1rem;
        background: #fee2e2;
        color: #991b1b;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.9rem;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 2rem;
    }

    .btn-cancel {
        background: none;
        border: 1.5px solid #cbd5e1;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }

    .btn-save {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
    }
</style>
