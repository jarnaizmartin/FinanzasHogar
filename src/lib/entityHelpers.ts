// ─── Helpers de entidades persistentes ───────────────────────────────────────
// ✅ FASE 0.5 / Bloque 1.2 — Centralizar creación/actualización de entidades
//
// Estas funciones garantizan que toda entidad que extienda `Timestamped`
// reciba automáticamente `createdAt` y `updatedAt` correctos.
//
// Beneficios:
//   - Imposible olvidarse de los timestamps al crear/modificar entidades
//   - Base sólida para sync E2E v2 (last-write-wins, tombstones)
//   - Punto único de extensión futura (logging, métricas, auditoría)

import type { Timestamped } from '../types';

/**
 * Genera un ID único razonablemente robusto para entidades nuevas.
 * Usa crypto.randomUUID() cuando está disponible (browsers modernos),
 * con fallback a timestamp + random para entornos antiguos.
 */
export function generateEntityId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback simple para entornos sin crypto.randomUUID
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Crea una nueva entidad añadiendo `createdAt` y `updatedAt` automáticamente.
 * Si no se proporciona `id`, genera uno con `generateEntityId()`.
 *
 * @example
 *   const account = createEntity<Account>({ name: 'BBVA', balance: 1000, ... });
 *   // → { id: 'uuid-xxx', name: 'BBVA', balance: 1000, ..., createdAt: 123, updatedAt: 123 }
 */
export function createEntity<T extends Timestamped & { id: string }>(
    data: Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }
): T {
    const now = Date.now();
    return {
        ...data,
        id: data.id ?? generateEntityId(),
        createdAt: now,
        updatedAt: now,
    } as T;
}

/**
 * Actualiza una entidad existente refrescando `updatedAt`.
 * Preserva `createdAt` original y permite cambios parciales.
 *
 * @example
 *   const updated = touchEntity(account, { balance: 1500 });
 *   // → { ...account, balance: 1500, updatedAt: <now> }
 */
export function touchEntity<T extends Timestamped & { id: string }>(
    entity: T,
    changes: Partial<Omit<T, 'id' | 'createdAt'>> = {}
): T {
    return {
        ...entity,
        ...changes,
        id: entity.id,            // protegemos id de cambios accidentales
        createdAt: entity.createdAt, // protegemos createdAt
        updatedAt: Date.now(),
    } as T;
}

/**
 * Borrado lógico (tombstone): marca la entidad como eliminada sin perder el registro.
 * Esencial para sync E2E: permite propagar deletes entre dispositivos.
 *
 * Las queries de UI deben filtrar entidades con `deletedAt !== undefined`.
 *
 * @example
 *   const deleted = softDeleteEntity(account);
 *   // → { ...account, deletedAt: <now>, updatedAt: <now> }
 */
export function softDeleteEntity<T extends Timestamped & { id: string }>(
    entity: T
): T {
    const now = Date.now();
    return {
        ...entity,
        deletedAt: now,
        updatedAt: now,
    };
}

/**
 * Filtra entidades borradas lógicamente (deletedAt definido).
 * Helper de conveniencia para queries de UI.
 *
 * @example
 *   const visibleAccounts = filterActive(allAccounts);
 */
export function filterActive<T extends Timestamped>(entities: T[]): T[] {
    return entities.filter((e) => e.deletedAt === undefined);
}
