// Substitui a API "window.storage" do Claude por armazenamento local do navegador.
export const storage = {
  async get(key) {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  async delete(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};
