import React from 'react';
import type { ModalBehavior } from '@wf-controls/core';
export interface WebFormsModalProps {
    /** Optional ModalBehavior; when given, open state follows its `shown`/`hidden` events. */
    behavior?: ModalBehavior | undefined;
    /** Controlled open state (takes precedence over the behavior/internal state). */
    isOpen?: boolean | undefined;
    /** Dialog title (also the accessible name via aria-labelledby). */
    title?: string | undefined;
    /** Called after the dialog was cancelled/closed (X, Cancel, Escape, backdrop click). */
    onClose?: (() => void) | undefined;
    /** Called after OK was handled. */
    onOk?: (() => void) | undefined;
    okText?: string | undefined;
    cancelText?: string | undefined;
    showFooter?: boolean | undefined;
    /** Extra CSS class for the overlay root (`div.modal`). */
    className?: string | undefined;
    children?: React.ReactNode | undefined;
}
/**
 * React adapter for ModalBehavior.
 *
 * Markup (stable class contract used by the themes):
 * `div.modal.fade.show.d-block[role=dialog][aria-modal=true][tabindex=-1]` >
 * `div.modal-dialog.modal-dialog-centered` > `div.modal-content.shadow` >
 * `div.modal-header` (`h5.modal-title`, `button.btn-close`), `div.modal-body`, `div.modal-footer`.
 *
 * Behaviour: Escape and a backdrop click cancel (`behavior.handleCancel()`), X/Cancel cancel, OK calls
 * `behavior.handleOk()`. On open the dialog receives focus, Tab/Shift+Tab cycle inside it, the page
 * (`body`) scroll is locked, and focus returns to the previously focused element on close.
 * The backdrop colour is `var(--wf-backdrop, rgba(0,0,0,0.5))` so themes can override it.
 */
export declare const WebFormsModal: React.FC<WebFormsModalProps>;
