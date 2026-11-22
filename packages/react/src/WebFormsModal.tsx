import React, { useState, useEffect, useId, useRef } from 'react';
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

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

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
export const WebFormsModal: React.FC<WebFormsModalProps> = ({
  behavior,
  isOpen: controlledOpen,
  title = 'Dialog',
  onClose,
  onOk,
  okText = 'OK',
  cancelText = 'Cancel',
  showFooter = true,
  className = '',
  children
}) => {
  const [internalOpen, setInternalOpen] = useState(
    behavior ? behavior.isOpen : (controlledOpen ?? false)
  );
  const titleId = `wf-modal-title-${useId()}`;
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!behavior) return;

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
      } else {
        setInternalOpen(false);
      }
    } catch (err) {
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
      } else {
        setInternalOpen(false);
      }
    } catch (err) {
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
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
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
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void cancelRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first || !last) {
        e.preventDefault();
        dialog.focus();
      } else if (e.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
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

  return (
    <div
      ref={dialogRef}
      className={`modal fade show d-block ${className}`.trim()}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ backgroundColor: 'var(--wf-backdrop, rgba(0,0,0,0.5))' }}
      onClick={() => void handleCancel()}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title" id={titleId}>{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => void handleCancel()}
            />
          </div>
          <div className="modal-body">{children}</div>
          {showFooter && (
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => void handleCancel()}>
                {cancelText}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void handleOk()}>
                {okText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
