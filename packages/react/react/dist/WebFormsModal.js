import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useId, useRef } from 'react';
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
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
export const WebFormsModal = ({ behavior, isOpen: controlledOpen, title = 'Dialog', onClose, onOk, okText = 'OK', cancelText = 'Cancel', showFooter = true, className = '', children }) => {
    const [internalOpen, setInternalOpen] = useState(behavior ? behavior.isOpen : (controlledOpen ?? false));
    const titleId = `wf-modal-title-${useId()}`;
    const dialogRef = useRef(null);
    useEffect(() => {
        if (!behavior)
            return;
        const unsubShown = behavior.shown.subscribe(() => setInternalOpen(true));
        const unsubHidden = behavior.hidden.subscribe(() => setInternalOpen(false));
        return () => {
            unsubShown();
            unsubHidden();
        };
    }, [behavior]);
    useEffect(() => {
        if (controlledOpen !== undefined) {
            setInternalOpen(controlledOpen);
        }
    }, [controlledOpen]);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    // Keep the latest handlers reachable from the (stable) keydown listener below.
    const handleCancel = async () => {
        try {
            if (behavior) {
                await behavior.handleCancel();
            }
            else {
                setInternalOpen(false);
            }
        }
        catch (err) {
            // Never leave an unhandled rejection and never swallow the error silently.
            console.error('WebFormsModal: cancel failed', err);
            return;
        }
        if (onClose) {
            onClose();
        }
    };
    const handleOk = async () => {
        try {
            if (behavior) {
                await behavior.handleOk();
            }
            else {
                setInternalOpen(false);
            }
        }
        catch (err) {
            console.error('WebFormsModal: ok failed', err);
            return;
        }
        if (onOk) {
            onOk();
        }
    };
    const cancelRef = useRef(handleCancel);
    cancelRef.current = handleCancel;
    // While open: lock body scroll, move focus into the dialog, restore both on close.
    useEffect(() => {
        if (!isOpen)
            return;
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, [isOpen]);
    // While open: Escape cancels, Tab / Shift+Tab are trapped inside the dialog.
    useEffect(() => {
        if (!isOpen)
            return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                void cancelRef.current();
                return;
            }
            if (e.key !== 'Tab')
                return;
            const dialog = dialogRef.current;
            if (!dialog)
                return;
            const items = Array.from(dialog.querySelectorAll(FOCUSABLE));
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (!first || !last) {
                e.preventDefault();
                dialog.focus();
            }
            else if (e.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);
    if (!isOpen) {
        return null;
    }
    return (_jsx("div", { ref: dialogRef, className: `modal fade show d-block ${className}`.trim(), tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, style: { backgroundColor: 'var(--wf-backdrop, rgba(0,0,0,0.5))' }, onClick: () => void handleCancel(), children: _jsx("div", { className: "modal-dialog modal-dialog-centered", role: "document", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "modal-content shadow", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h5", { className: "modal-title", id: titleId, children: title }), _jsx("button", { type: "button", className: "btn-close", "aria-label": "Close", onClick: () => void handleCancel() })] }), _jsx("div", { className: "modal-body", children: children }), showFooter && (_jsxs("div", { className: "modal-footer", children: [_jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => void handleCancel(), children: cancelText }), _jsx("button", { type: "button", className: "btn btn-primary", onClick: () => void handleOk(), children: okText })] }))] }) }) }));
};
//# sourceMappingURL=WebFormsModal.js.map