declare module "cls-hooked" {
  export interface Namespace {
    set(key: string, value: unknown): Namespace;
    get<T = unknown>(key: string): T | undefined;
    run(callback: (...args: unknown[]) => void): void;
    runAndReturn<T>(callback: (...args: unknown[]) => T): T;
  }

  export function createNamespace(name: string): Namespace;
  export function getNamespace(name: string): Namespace | undefined;
}
