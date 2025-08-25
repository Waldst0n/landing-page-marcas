export function getEMSFromURL(): string | null {
    try {
        const qs = new URLSearchParams(window.location.search);
        const v = (qs.get("EMS") || qs.get("ems") || "").trim();
        return v || null;
    } catch {
        return null;
    }
}
