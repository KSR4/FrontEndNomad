/**
 * API Documentation 🚀
 * 
 * URL Base: http://localhost:3000/v1
 * Authentication: Bearer <token> in the Authorization header.
 * 
 * Roles: 
 * - USER: Regular client.
 * - OWNER: Business owner.
 * - ADMIN: Platform administrator.
 * 
 * Routes Summary:
 * - Auth: register, verify-email, resend-verification, login, forgot-password, reset-password, me
 * - User: list (admin), update-avatar, update-email, change-password (requires current), update-username, update-role (admin), delete (self)
 * - Events: list, get, create (admin), update (admin), delete (admin)
 * - Shops: list (filter by eventId), get, list-self (owner), get-menu, register (owner/admin), update (owner/admin)
 * - Dishes: add (owner), update (owner), delete (owner)
 * - Orders: list-self, list-shop (owner), create, update-state (owner)
 * - Tickets (owner requests): list (admin), create (user), accept/reject (admin) → auto-creates Notification
 * - Notifications: list (user), list-all (admin), create (admin), mark-read (user)
 * - SupportTickets: create (user), list-self (user), list (admin), update-status (admin)
 * - Reviews: list-self, list-shop, create (rate order)
 */

import { session } from '$lib/stores/session.svelte';

const BASE_URL = 'https://backendtest-xwwp.onrender.com/v1';

async function request(endpoint: string, method: string = 'GET', body: any = null) {
    const currentToken = session.token;
    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const options: RequestInit = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    // Si recibimos un 401 (Unauthorized), limpiamos el token para forzar el logout
    // exceptuando la página de login y acciones específicas como el cambio de contraseña.
    const isChangePasswordUrl = endpoint.includes('/change-password') || endpoint.includes('/password');
    if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !isChangePasswordUrl) {
        const currentUser = session.user;
        if (!currentUser || currentUser.isVerified) {
            session.setSessionExpired(true);
            session.setToken(null);
        }
    }

    const contentType = response.headers.get("content-type");
    let data;
    try {
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text || response.statusText };
        }
    } catch (e) {
        data = { message: response.statusText };
    }

    return {
        ok: response.ok,
        status: response.status,
        ...(typeof data === 'object' && !Array.isArray(data) ? data : { data })
    };
}

// ── Interfaces de Datos ──

import type {
    RegisterData,
    LoginData,
    ResetPasswordData,
    ChangePasswordData,
    EventData,
    ShopRegisterData,
    ShopUpdateData,
    DishAddData,
    DishUpdateData,
    OrderCreateData,
    ReviewCreateData,
    SupportTicketStatus
} from '../types/models';

export * from '../types/models';

export const api = {
    health: () => request('/health', 'GET'),
    auth: {
        register: (data: RegisterData) => request('/register', 'POST', data),
        verifyEmail: (token: string) => request('/verify-email', 'POST', { token }),
        resendVerification: () => request('/resend-verification', 'POST'),
        login: (data: LoginData) => request('/login', 'POST', data),
        forgotPassword: (email: string) => request('/forgot-password', 'POST', { email }),
        resetPassword: (data: ResetPasswordData) => request('/reset-password', 'POST', data),
        me: () => request('/me', 'GET'),
    },
    user: {
        list: () => request('/user', 'GET'),
        updateAvatar: (id: string | number, avatar: string) => request(`/user/${id}/avatar`, 'PATCH', { avatar }),
        updateEmail: (id: string | number, email: string) => request(`/user/${id}/email`, 'PATCH', { email }),
        updatePassword: (id: string | number, password: string) => request(`/user/${id}/password`, 'PATCH', { password }),
        changePassword: (data: ChangePasswordData) => request('/user/change-password', 'POST', data),
        updateUsername: (id: string | number, username: string) => request(`/user/${id}/username`, 'PATCH', { username }),
        updateRole: (id: string | number, role: 'USER' | 'OWNER' | 'ADMIN') => request(`/user/${id}/role`, 'PATCH', { role }),
        deleteSelf: () => request('/user', 'DELETE'),
        deleteUser: (id: string | number) => request(`/user/${id}`, 'DELETE'),
    },
    events: {
        list: () => request('/event', 'GET'),
        getOne: (id: string | number) => request(`/event/${id}`, 'GET'),
        create: (data: EventData) => request('/event', 'POST', data),
        update: (id: string | number, data: EventData) => request(`/event/${id}`, 'PUT', data),
        delete: (id: string | number) => request(`/event/${id}`, 'DELETE'),
        addShop: (eventId: string, shopId: string) => request('/shop-event', 'POST', { eventId, shopId }),
        removeShop: (shopId: string) => request(`/shop-event/shop/${shopId}`, 'DELETE'),
    },
    shops: {
        list: (eventId?: string | number) => request(`/shop${eventId ? `?eventId=${eventId}` : ''}`, 'GET'),
        getOne: (id: string | number) => request(`/shop/${id}`, 'GET'),
        listSelf: () => request('/shop/self', 'GET'),
        getMenu: (id: string | number) => request(`/shop/menu/${id}`, 'GET'),
        register: (data: ShopRegisterData) => request('/shop', 'POST', data),
        update: (id: string | number, data: ShopUpdateData) => request(`/shop/${id}`, 'PUT', data),
    },
    dishes: {
        add: (data: DishAddData) => request('/dish', 'POST', data),
        update: (id: string | number, data: DishUpdateData) => request(`/dish/${id}`, 'PUT', data),
        delete: (id: string | number) => request(`/dish/${id}`, 'DELETE'),
    },
    orders: {
        listSelf: () => request('/order/self', 'GET'),
        listByShop: (shopId: string | number) => request(`/order/shop/${shopId}`, 'GET'),
        create: (data: OrderCreateData) => request('/order', 'POST', data),
        updateState: (id: string | number, state: 'CANCELLED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED') => request(`/order/${id}`, 'PUT', { state }),
    },
    tickets: {
        list: () => request('/ticket', 'GET'),
        create: (shopName: string, message: string, latitude: number, longitude: number) => request('/ticket', 'POST', { shopName, message, latitude, longitude }),
        accept: (shopName: string, userId: string, latitude: number, longitude: number) => request('/shop', 'POST', { shopName, userId, latitude, longitude }),
        getHolder: (id: string | number) => request(`/ticket/${id}`, 'GET'),
        updateAccepted: (id: string | number, accepted: boolean) => request(`/ticket/${id}/accepted`, 'PATCH', { accepted }),
    },
    notifications: {
        // GET /notification — lista notificaciones del usuario (propias + broadcast)
        list: () => request('/notification', 'GET'),
        // GET /notification/all — histórico de todas (ADMIN)
        listAll: () => request('/notification/all', 'GET'),
        // POST /notification — crear notificación (ADMIN). userId null = broadcast
        create: (title: string, message: string, userId: string | null) => request('/notification', 'POST', { title, message, userId }),
        // PATCH /notification/:id/read — marcar como leída
        markRead: (id: string) => request(`/notification/${id}/read`, 'PATCH'),
    },
    supportTickets: {
        // POST /support-ticket — crear ticket de soporte (USER)
        create: (subject: string, description: string) => request('/support-ticket', 'POST', { subject, description }),
        // GET /support-ticket/me — tickets propios del usuario autenticado
        listSelf: () => request('/support-ticket/me', 'GET'),
        // GET /support-ticket — todos los tickets (ADMIN)
        listAll: () => request('/support-ticket', 'GET'),
        // PATCH /support-ticket/:id/status — cambiar estado (ADMIN)
        updateStatus: (id: string, status: SupportTicketStatus) => request(`/support-ticket/${id}/status`, 'PATCH', { status }),
    },
    reviews: {
        listSelf: () => request('/review/self', 'GET'),
        listByShop: (shopId: string | number) => request(`/review/shop/${shopId}`, 'GET'),
        create: (orderId: string | number, data: ReviewCreateData) => request(`/review/${orderId}`, 'POST', data),
    },
};
