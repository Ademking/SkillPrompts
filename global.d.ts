declare module "*.css"

export {}

declare global {
    class Highlight {
        constructor(...ranges: Range[])
        add(range: Range): void
        delete(range: Range): void
        has(range: Range): boolean
        clear(): void
        readonly size: number
    }

    interface HighlightRegistry {
        set(name: string, highlight: Highlight): void
        delete(name: string): void
        get(name: string): Highlight | undefined
        has(name: string): boolean
        clear(): void
        readonly size: number
    }

    namespace CSS {
        var highlights: HighlightRegistry
    }
}