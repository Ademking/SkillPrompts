export interface Prompt {
    id: string
    label: string
    description: string
    template: string
    favorite?: boolean
}

export interface Block {
    id: string
    name: string
    value: string
}

export interface LibraryPrompt {
    label: string
    description: string
    prompt: string
}
