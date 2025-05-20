import { useAtom, useAtomValue } from "jotai";
import {
  loginAtom,
  registerAtom,
  logoutAtom,
  errorAtom,
  userAtom,
} from "../state/authStore";

export const useAuthService = () => {
  const [, login] = useAtom(loginAtom);
  const [, register] = useAtom(registerAtom);
  const [, logout] = useAtom(logoutAtom);
  const error = useAtomValue(errorAtom);
  const user = useAtomValue(userAtom);

  return {
    user,
    error,
    login: (email: string, password: string) => login({ email, password }),
    register: (email: string, password: string) =>
      register({ email, password }),
    logout: () => logout(),
  };
};
