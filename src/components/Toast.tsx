export function Toast({ message, visible, error }: { message: string; visible: boolean; error?: boolean }) {
    return (
        <div
            className={`plasmo-fixed plasmo-bottom-6 plasmo-left-1/2 plasmo--translate-x-1/2 plasmo-z-[100] plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-2.5  plasmo-bg-[var(--card)] plasmo-border plasmo-border-[var(--border)] plasmo-shadow-[0_8px_32px_var(--shadow)] plasmo-text-[13px] plasmo-font-medium plasmo-text-[var(--text)] plasmo-transition-all plasmo-duration-300 ${visible ? "plasmo-opacity-100 plasmo-translate-y-0" : "plasmo-opacity-0 plasmo-translate-y-3 plasmo-pointer-events-none"
            }`}
        >
            {error ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="plasmo-text-red-500"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="plasmo-text-emerald-500"><polyline points="20 6 9 17 4 12" /></svg>
            )}
            {message}
        </div>
    )
}
