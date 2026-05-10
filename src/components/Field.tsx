export function Field({ label, error, errorMessage, children }: { label: string; error?: boolean; errorMessage?: string; children: React.ReactNode }) {
    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-1.5">
            <label className="plasmo-text-[11px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-uppercase plasmo-tracking-widest">{label}</label>
            {children}
            {error && <p className="plasmo-text-[10.5px] plasmo-text-red-400">{errorMessage || "Required"}</p>}
        </div>
    )
}
