<script lang="ts">
    import { goto } from "$app/navigation";
    import type { Snippet } from "svelte";
    import { ArrowLeft } from "lucide-svelte";

    let {
        title,
        subtitle,
        error,
        children,
        footer,
    }: {
        title: string;
        subtitle: string;
        error?: string;
        children: Snippet;
        footer?: Snippet;
    } = $props();
</script>

<div class="auth-container">
    <div class="auth-card">
        <div class="header">
            <button class="back-btn" onclick={() => goto("/")}>
                <ArrowLeft
                    size={16}
                    style="display:inline; vertical-align:middle; margin-right: 4px;"
                /> Atrás
            </button>
            <h2>{title}</h2>
            <p>{subtitle}</p>
        </div>

        {#if error}
            <div class="error-message">{error}</div>
        {/if}

        {@render children()}

        {#if footer}
            <div class="footer">
                {@render footer()}
            </div>
        {/if}
    </div>
</div>

<style>
    .auth-container {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--secondary-color);
    }

    .auth-card {
        background: white;
        width: 100%;
        max-width: 440px;
        padding: 3rem;
        border-radius: 24px;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -1px rgba(0, 0, 0, 0.03);
        border: 1px solid var(--border-color);
    }

    .header {
        margin-bottom: 2.5rem;
        text-align: center;
        position: relative;
    }

    .back-btn {
        position: absolute;
        left: 0;
        top: -10px;
        background: none;
        border: none;
        color: #666;
        font-size: 0.9rem;
        padding: 0;
        cursor: pointer;
    }

    .header h2 {
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
    }

    .header p {
        color: #666;
        font-size: 0.95rem;
    }

    .footer {
        margin-top: 2rem;
        text-align: center;
        font-size: 0.95rem;
        color: #666;
    }

    .error-message {
        background-color: #fee2e2;
        color: #ef4444;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        text-align: center;
        border: 1px solid #fecaca;
    }
</style>
