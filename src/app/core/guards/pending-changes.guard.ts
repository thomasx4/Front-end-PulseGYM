import { CanDeactivateFn } from '@angular/router';

export interface ComponentWithUnsavedChanges {
    tieneCambiosPendientes: () => boolean;
    mostrarModalCambiosPendientes?: () => void;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentWithUnsavedChanges> = (component) => {
    if (component.tieneCambiosPendientes && component.tieneCambiosPendientes()) {
        if (component.mostrarModalCambiosPendientes) {
            component.mostrarModalCambiosPendientes();
        }
        return false;
    }
    return true;
};