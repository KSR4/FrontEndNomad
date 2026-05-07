<script lang="ts">
    import { onMount } from "svelte";
    import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
    import { goto } from "$app/navigation";
    import { api } from "$lib/api/client";
    import { MapPin, Calendar, Clock, ArrowRight } from "lucide-svelte";

    let events = $state<any[]>([]);
    let filteredEvents = $state<any[]>([]);
    let loading = $state(false);
    let error = $state("");
    let mapContainer = $state<HTMLElement>();
    let map = $state<google.maps.Map>();

    function getDistanceFromLatLonInKm(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
                Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async function initMap(lat: number, lng: number) {
        setOptions({
            key:
                import.meta.env.VITE_MAPS_KEY ||
                "AIzaSyA66xtC5kdxpk2cna-sHnv93Rg0TX7VB3c",
            v: "weekly",
        });

        try {
            const { Map } = (await importLibrary(
                "maps",
            )) as google.maps.MapsLibrary;
            const { AdvancedMarkerElement, PinElement } = (await importLibrary(
                "marker",
            )) as google.maps.MarkerLibrary;

            if (mapContainer) {
                map = new Map(mapContainer, {
                    center: { lat, lng },
                    zoom: 12,
                    mapId: "DEMO_MAP_ID",
                    streetViewControl: false,
                });

                const createMarkerContent = (
                    title: string,
                    color: string = "#FBBC04",
                ) => {
                    const container = document.createElement("div");
                    container.style.display = "flex";
                    container.style.flexDirection = "column";
                    container.style.alignItems = "center";
                    container.style.cursor = "pointer";

                    const pin = new (PinElement as any)({
                        background: color,
                        borderColor: "white",
                        glyphColor: "white",
                        glyphText: "E",
                    });

                    container.appendChild(pin as unknown as Node);

                    const label = document.createElement("div");
                    label.textContent = title;
                    label.style.background = "white";
                    label.style.padding = "2px 6px";
                    label.style.borderRadius = "4px";
                    label.style.boxShadow = "0 1px 2px rgba(0,0,0,0.3)";
                    label.style.fontSize = "12px";
                    label.style.marginTop = "4px";
                    label.style.fontWeight = "bold";
                    label.style.whiteSpace = "nowrap";

                    container.appendChild(label);
                    return container;
                };

                const userContent = createMarkerContent(
                    "Tu ubicación",
                    "#4285F4",
                );
                new AdvancedMarkerElement({
                    position: { lat, lng },
                    map,
                    title: "Tu ubicación",
                    content: userContent,
                });
                filteredEvents = events.filter((e) => {
                    if (!e.latitude || !e.longitude) return true;
                    const dist = getDistanceFromLatLonInKm(
                        lat,
                        lng,
                        e.latitude,
                        e.longitude,
                    );
                    return dist <= 200;
                });

                filteredEvents.forEach((ev) => {
                    if (ev.latitude && ev.longitude) {
                        const marker = new AdvancedMarkerElement({
                            position: { lat: ev.latitude, lng: ev.longitude },
                            map,
                            title: ev.name,
                            content: createMarkerContent(ev.name, "#9c27b0"),
                        });

                        marker.addListener("click", () => {
                            if (ev.id) goto(`/app/events/${ev.id}`);
                        });
                    }
                });
            }
        } catch (e) {
            console.error("Error loading map:", e);
        }
    }

    async function loadEvents() {
        loading = true;
        try {
            const response = await api.events.list();
            if (response.ok) {
                events = Array.isArray(response.data)
                    ? response.data
                    : (response.data?.events ?? []);
                events = events.filter(
                    (e) =>
                        new Date(e.finishDate).getTime() > new Date().getTime(),
                );
            }
        } catch (e) {
            error = "Error al cargar eventos";
        } finally {
            loading = false;
        }
    }

    onMount(async () => {
        await loadEvents();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    initMap(
                        position.coords.latitude,
                        position.coords.longitude,
                    );
                },
                (err) => {
                    initMap(40.4168, -3.7038);
                },
            );
        } else {
            initMap(40.4168, -3.7038);
        }
    });

    function formatTime(iso: string) {
        return new Date(iso).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
        });
    }
</script>

{#if loading}
    <div class="loading-state">
        <p>Buscando eventos cercanos...</p>
    </div>
{:else}
    <div class="container">
        <div class="map-container" bind:this={mapContainer}></div>

        {#if filteredEvents.length === 0}
            <div class="empty-state">
                No hay eventos programados cerca de tu ubicación.
            </div>
        {:else}
            <div class="grid">
                {#each filteredEvents as ev}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_interactive_supports_focus -->
                    <div
                        class="grid-card clickable"
                        onclick={() => goto(`/app/events/${ev.id}`)}
                        role="button"
                    >
                        <h3>{ev.name}</h3>
                        <p class="desc">{ev.description}</p>
                        <hr />
                        <div class="meta">
                            <span
                                ><MapPin
                                    size={14}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                />
                                {ev.location}</span
                            >
                            <span
                                ><Calendar
                                    size={14}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                />
                                {formatDate(ev.startDate)} - {formatDate(
                                    ev.finishDate,
                                )}</span
                            >
                            <span
                                ><Clock
                                    size={14}
                                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                                />
                                {formatTime(ev.startDate)}</span
                            >
                        </div>
                        <p class="view-details">
                            Ver puestos disponibles <ArrowRight
                                size={14}
                                style="display:inline; vertical-align:middle;"
                            />
                        </p>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .map-container {
        width: 100%;
        height: 400px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        background: #f8fafc;
    }

    .loading-state,
    .empty-state {
        text-align: center;
        padding: 4rem;
        color: #64748b;
        background: white;
        border-radius: 12px;
        border: 1.5px dashed #cbd5e1;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
    }

    .grid-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition:
            transform 0.2s,
            box-shadow 0.2s;
        display: flex;
        flex-direction: column;
    }

    .grid-card.clickable {
        text-align: left;
        border: 1.5px solid #e2e8f0;
        cursor: pointer;
    }

    .grid-card.clickable:hover {
        border-color: #9c27b0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(156, 39, 176, 0.1);
    }

    .grid-card h3 {
        font-family: var(--heading-font);
        font-size: 1.15rem;
        margin: 0 0 0.5rem 0;
        color: #1e293b;
    }

    .desc {
        color: #475569;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0 0 1rem 0;
        flex-grow: 1;
    }

    hr {
        border: none;
        border-top: 1px dashed #e2e8f0;
        margin: 1rem 0;
    }

    .meta {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 500;
    }

    .view-details {
        margin: 1.5rem 0 0 0;
        color: #9c27b0;
        font-weight: 700;
        font-size: 0.9rem;
    }
</style>
