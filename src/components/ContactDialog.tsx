import React, { useEffect, useRef, useState } from 'react';
import {
  CONTACT_EMAIL,
  ContactErrors,
  ContactRequest,
  buildGmailUrl,
  buildMailto,
  composeEmail,
  submitContactRequest,
  validateContact,
} from '../lib/contactRequest';

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY: ContactRequest = { name: '', email: '', company: '', message: '' };

/** "Contact us for Demo": sends the request directly or composes the email to CONTACT_EMAIL. */
export const ContactDialog: React.FC<ContactDialogProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<ContactRequest>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [mailto, setMailto] = useState<string | null>(null);
  const [gmailUrl, setGmailUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY);
    setErrors({});
    setMailto(null);
    setGmailUrl(null);
    setSending(false);
    setDelivered(null);
    setStatusNote(null);
    setCopied(false);
    const t = window.setTimeout(() => firstField.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const set = (k: keyof ContactRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateContact(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const url = buildMailto(form);
    const gmail = buildGmailUrl(form);
    setMailto(url);
    setGmailUrl(gmail);
    setSending(true);
    setDelivered(null);
    setStatusNote(null);

    const result = await submitContactRequest(form);
    setSending(false);
    setDelivered(result.delivered);
    if (!result.delivered) {
      setStatusNote(result.message ?? null);
      window.location.href = url; // automatic mailto fallback when direct delivery is unavailable
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const copyMessage = async () => {
    const { subject, body } = composeEmail(form);
    try {
      await navigator.clipboard.writeText(
        `To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body.replace(/\r\n/g, '\n')}`
      );
      setCopied(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose} data-testid="contact-overlay">
      <div
        className="contact-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="contact-head">
          <h2 id="contact-title">Contact us for a demo</h2>
          <button className="icon-action-btn" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>

        <p className="contact-lead">
          Write to us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="contact-address" data-testid="contact-address">
            {CONTACT_EMAIL}
          </a>{' '}
          <button type="button" className="contact-copy" onClick={() => void copyAddress()}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          , or fill in the form below to send your demo request directly.
        </p>

        <form onSubmit={(e) => void send(e)} noValidate data-testid="contact-form">
          <label className="contact-field">
            <span>Your name *</span>
            <input
              ref={firstField}
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
              data-testid="contact-name"
            />
            {errors.name && <em role="alert">{errors.name}</em>}
          </label>
          <label className="contact-field">
            <span>Work email *</span>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              data-testid="contact-email"
            />
            {errors.email && <em role="alert">{errors.email}</em>}
          </label>
          <label className="contact-field">
            <span>Company</span>
            <input
              value={form.company}
              onChange={set('company')}
              autoComplete="organization"
              data-testid="contact-company"
            />
          </label>
          <label className="contact-field">
            <span>What would you like to see? *</span>
            <textarea rows={4} value={form.message} onChange={set('message')} data-testid="contact-message" />
            {errors.message && <em role="alert">{errors.message}</em>}
          </label>

          <div className="contact-actions">
            <button type="submit" className="btn-primary" disabled={sending} data-testid="contact-send">
              {sending ? 'Sending...' : 'Send request'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

        {mailto && (
          <p className="contact-sent" role="status" data-testid="contact-sent">
            {delivered ? (
              <>
                Your demo request has been sent to <strong>{CONTACT_EMAIL}</strong>! You can also{' '}
              </>
            ) : (
              <>
                {statusNote ? `(${statusNote}) ` : ''}Your email app should open with the request addressed to{' '}
                <strong>{CONTACT_EMAIL}</strong>. If nothing opened,{' '}
              </>
            )}
            <a href={mailto} data-testid="contact-mailto">
              open in your mail app
            </a>
            {gmailUrl && (
              <>
                ,{' '}
                <a href={gmailUrl} target="_blank" rel="noopener noreferrer" data-testid="contact-gmail">
                  open in Gmail
                </a>
              </>
            )}{' '}
            or{' '}
            <button type="button" className="contact-copy" onClick={() => void copyMessage()}>
              copy the message
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
};
