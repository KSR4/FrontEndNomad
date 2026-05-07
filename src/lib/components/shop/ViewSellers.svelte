<script lang="ts">
    import { onMount } from "svelte";
    import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { api } from "$lib/api/client";
    import { ArrowRight } from "lucide-svelte";

    function getShopStatus(shop: any): { label: string; cls: string } {
        if (!shop.openDate || !shop.closeDate)
            return { label: "Sin horario", cls: "" };
        const toMin = (iso: string) => {
            const d = new Date(iso);
            return isNaN(d.getTime()) ? 0 : d.getHours() * 60 + d.getMinutes();
        };
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const open =
            nowMins >= toMin(shop.openDate) && nowMins < toMin(shop.closeDate);
        return open
            ? { label: "Abierto", cls: "open" }
            : { label: "Cerrado", cls: "closed" };
    }

    let shops = $state<any[]>([]);
    let filteredShops = $state<any[]>([]);
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
        const R = 6371;
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

    const mockShops = [
        { name: "Tienda Centro", lat: 40.4168, lng: -3.7038 },
        { name: "Tienda Norte", lat: 40.45, lng: -3.69 },
        { name: "Tienda Sur", lat: 40.38, lng: -3.71 },
    ];

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
                    zoom: 13,
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
                        glyphText: title ? title[0].toUpperCase() : "",
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

                // Filtrar solo las tiendas que están a 100km o menos
                const realShops =
                    shops.length > 0 && shops[0].latitude ? shops : mockShops;
                filteredShops = realShops.filter((shop) => {
                    if (!shop.latitude || !shop.longitude) return false;
                    const dist = getDistanceFromLatLonInKm(
                        lat,
                        lng,
                        shop.latitude,
                        shop.longitude,
                    );
                    return dist <= 100;
                });

                filteredShops.forEach((shop) => {
                    if (shop.latitude && shop.longitude) {
                        const marker = new AdvancedMarkerElement({
                            position: {
                                lat: shop.latitude,
                                lng: shop.longitude,
                            },
                            map,
                            title: shop.name,
                            content: createMarkerContent(shop.name, "#EA4335"),
                        });

                        marker.addListener("click", () => {
                            if (shop.id) goto(`/app/shops/${shop.id}`);
                        });
                    }
                });
            }
        } catch (e) {
            console.error("Error loading map:", e);
        }
    }

    async function loadShops() {
        loading = true;
        try {
            const eventId = page.url.searchParams.get("eventId");
            const response = await api.shops.list(eventId || undefined);
            if (response.ok) {
                shops = response.data;
            }
        } catch (e) {
            console.error(e);
            error = "Error al cargar tiendas";
        } finally {
            loading = false;
        }
    }

    onMount(async () => {
        await loadShops();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    initMap(
                        position.coords.latitude,
                        position.coords.longitude,
                    );
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    // Default to Madrid if geolocation fails
                    initMap(40.4168, -3.7038);
                },
            );
        } else {
            // Default a Madrid
            initMap(40.4168, -3.7038);
        }
    });
</script>

{#if loading}
    <p>Cargando vendedores...</p>
{:else}
    <div class="container">
        <div class="map-container" bind:this={mapContainer}></div>

        {#if filteredShops.length === 0}
            <p>
                No hay vendedores disponibles a menos de 100km de tu ubicación.
            </p>
        {:else}
            <div class="grid">
                {#each filteredShops as s}
                    {@const st = getShopStatus(s)}
                    <button
                        class="grid-card"
                        onclick={() => goto(`/app/shops/${s.id}`)}
                    >
                        <h3>{s.name}</h3>
                        <p>
                            <strong>Estado:</strong>
                            <span class="status {st.cls}">{st.label}</span>
                        </p>
                        <p class="view-menu">
                            Ver carta <ArrowRight
                                size={14}
                                style="display:inline; vertical-align:middle;"
                            />
                        </p>
                    </button>
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
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .grid-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s;
    }

    .grid-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .grid-card h3 {
        font-family: var(--heading-font);
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: #1e293b;
    }

    .grid-card p {
        color: #64748b;
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
    }

    .view-menu {
        margin-top: 1rem !important;
        color: #3b82f6 !important;
        font-weight: 600;
    }

    .status {
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
    }

    .status.open {
        background: #dcfce7;
        color: #166534;
    }
    .status.closed {
        background: #fee2e2;
        color: #991b1b;
    }

    button.grid-card {
        text-align: left;
        width: 100%;
        border: 1.5px solid #e2e8f0;
        cursor: pointer;
    }

    button.grid-card:hover {
        border-color: #3b82f6;
    }
</style>
