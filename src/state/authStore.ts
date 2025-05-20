import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import axios from "axios";

export interface User {
  id: number;
  email: string;
}

export const tokenAtom = atomWithStorage<string | null>(
  "token",
  localStorage.getItem("token")
);
export const userAtom = atomWithStorage<User | null>("user", null);
export const loadingAtom = atom<boolean>(true);
export const errorAtom = atom<string | null>(null);
export const isAuthenticatedAtom = atom<boolean>((get) => !!get(userAtom));

export const authStateAtom = atom((get) => ({
  user: get(userAtom),
  token: get(tokenAtom),
  loading: get(loadingAtom),
  error: get(errorAtom),
  isAuthenticated: get(isAuthenticatedAtom),
}));

export const setupAxiosAuth = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

export const initAuthAtom = atom(null, async (_, set) => {
  const token = localStorage.getItem("token");
  console.log({ token });
  if (!token) {
    set(loadingAtom, false);
    return;
  }

  try {
    setupAxiosAuth(token);
    const response = await axios.get(
      "https://n8wks000s84gsw8go4cggckk.softver.cc/profile"
    );
    if (response.data?.user) {
      set(userAtom, response.data.user);
    } else {
      // set(tokenAtom, null);
    }
  } catch {
    // set(tokenAtom, null);
  } finally {
    set(loadingAtom, false);
  }
});

// Auth actions
export const loginAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }) => {
    set(errorAtom, null);

    try {
      const response = await axios.post(
        "https://n8wks000s84gsw8go4cggckk.softver.cc/login",
        {
          email,
          password,
        }
      );

      if (response.data) {
        set(userAtom, response.data.user);
        set(tokenAtom, response.data.token);
        setupAxiosAuth(response.data.token);
        localStorage.setItem("token", response.data.token);
        return { success: true };
      } else {
        const errorMessage = response.data.message || "Login failed";
        set(errorAtom, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      let errorMessage = "Login failed";

      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
);

export const registerAtom = atom(
  null,
  async (_, set, { email, password }: { email: string; password: string }) => {
    set(errorAtom, null);

    try {
      const response = await axios.post(
        "https://n8wks000s84gsw8go4cggckk.softver.cc/register",
        {
          email,
          password,
        }
      );

      if (response.data) {
        set(userAtom, response.data.user);
        set(tokenAtom, response.data.token);
        localStorage.setItem("token", response.data.token);

        setupAxiosAuth(response.data.token);
        return { success: true };
      } else {
        const errorMessage = response.data.message || "Registration failed";
        set(errorAtom, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      let errorMessage = "registration failed";

      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
      return { success: false, error: errorMessage };
    }
  }
);

export const logoutAtom = atom(null, (_, set) => {
  set(userAtom, null);
  set(tokenAtom, null);
  set(errorAtom, null);
  setupAxiosAuth(null);
});
