import { Icons } from "~components/Icons"

export function ViewToggle({ viewMode, onToggle }: { viewMode: "grid" | "list"; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            role="switch"
            aria-checked={viewMode === "grid"}
            aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            className="
        plasmo-relative plasmo-flex plasmo-h-[41.5px] plasmo-w-[72px]
        plasmo-items-center 
        plasmo-border plasmo-border-[var(--border)]
        
        plasmo-p-1
    "
        >
            {/* track */}
            <div className="plasmo-relative plasmo-flex plasmo-h-full plasmo-w-full">

                {/* slider */}
                <div
                    className={`
                plasmo-absolute plasmo-top-0 plasmo-left-0
                plasmo-h-full plasmo-w-1/2
                
                
                plasmo-transition-transform plasmo-duration-200 plasmo-ease-out
                ${viewMode === "list" ? "plasmo-translate-x-full" : "plasmo-translate-x-0"}
            `}
                />

                {/* icons */}
                <div className="plasmo-relative plasmo-z-10 plasmo-flex plasmo-w-full plasmo-items-center">
                    <div className="plasmo-w-1/2 plasmo-flex plasmo-items-center plasmo-justify-center">
                        <span className={viewMode === "grid" ? "" : "plasmo-text-[var(--muted)]"}>
                            <Icons.grid />
                        </span>
                    </div>

                    <div className="plasmo-w-1/2 plasmo-flex plasmo-items-center plasmo-justify-center">
                        <span className={viewMode === "list" ? "" : "plasmo-text-[var(--muted)]"}>
                            <Icons.list />
                        </span>
                    </div>
                </div>

            </div>
        </button>
    )
}
