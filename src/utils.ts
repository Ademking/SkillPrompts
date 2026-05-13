import type { Block } from "~types"

export function resolveBlocks(template: string, blocks: Block[]): string {
    let result = template
    for (const b of blocks) {
        const regex = new RegExp(`\\{\\{\\s*${escapeRegex(b.name)}\\s*\\}\\}`, "g")
        result = result.replace(regex, b.value)
    }
    return result
}

export function blockNames(blocks: Block[]): Set<string> {
    return new Set(blocks.map(b => b.name.toLowerCase()))
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}