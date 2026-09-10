export interface AppInstance {
  left: HTMLElement
  right: HTMLElement
  onKey?(event: KeyboardEvent): boolean
  onActivate?(): void
  onDeactivate?(): void
}

export interface PhoneApp {
  id: string
  name: string
  icon: string
  color: string
  create(): AppInstance
}
