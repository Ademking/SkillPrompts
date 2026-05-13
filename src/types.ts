export interface Prompt {
    id: string
    label: string
    description: string
    template: string
    favorite?: boolean
}

export interface LibraryPrompt {
    label: string
    description: string
    prompt: string
}
