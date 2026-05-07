import Cookies from 'js-cookie';

export class SessionState {
    user = $state<any>(null);
    token = $state<string | null>(null);
    sessionExpired = $state(false);
    isAuthenticated = $derived(!!this.token);

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = Cookies.get('token') || null;
        }
    }

    setToken(newToken: string | null) {
        this.token = newToken;
        if (typeof window !== 'undefined') {
            if (newToken) {
                Cookies.set('token', newToken, { path: '/', sameSite: 'lax' });
            } else {
                Cookies.remove('token', { path: '/' });
                this.user = null;
            }
        }
    }

    setUser(newUser: any) {
        this.user = newUser;
    }

    setSessionExpired(value: boolean) {
        this.sessionExpired = value;
    }

    clearExpiration() {
        this.sessionExpired = false;
    }
}

export const session = new SessionState();

