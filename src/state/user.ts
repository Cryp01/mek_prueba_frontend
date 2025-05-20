import { atomWithStorage } from "jotai/utils";

export const UserAtom = atomWithStorage("user", {
  id: 0,
  email: "",
});

export const TokenAtom = atomWithStorage("token", "");
