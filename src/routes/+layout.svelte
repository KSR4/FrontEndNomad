<script lang="ts">
    import "../app.css";
    import { session } from "$lib/stores/session.svelte";
    import { onMount } from "svelte";
    import { api } from "$lib/api/client";

    let { children } = $props();

    onMount(async () => {
        if (session.token) {
            try {
                const response = await api.auth.me();
                if (response.ok && response.data) {
                    session.setUser(response.data);
                } else {
                    session.setToken(null);
                }
            } catch (e) {
                session.setToken(null);
            }
        }
    });
</script>

{#if children}
    {@render children()}
{/if}

