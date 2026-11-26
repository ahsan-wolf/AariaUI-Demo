// "Contact us for Demo": validation, direct delivery via FormSubmit, and Gmail / mailto: composition.

export const CONTACT_EMAIL = 'ahsanalnasar@gmail.com';
export const FORMSUBMIT_AJAX_URL = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

export interface ContactRequest {
  name: string;
  email: string;
  company: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactRequest, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns an error message per invalid field (empty object = valid). */
export function validateContact(r: ContactRequest): ContactErrors {
  const errors: ContactErrors = {};
  if (r.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL.test(r.email.trim())) errors.email = 'Please enter a valid email address.';
  if (r.message.trim().length < 10) errors.message = 'Please tell us a little about what you would like to see (10+ characters).';
  return errors;
}

/** Strips control characters (and so CR/LF header injection) from a single-line value. */
const oneLine = (s: string): string => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

/** The subject and plain-text body of the request email. */
export function composeEmail(r: ContactRequest): { subject: string; body: string } {
  const name = oneLine(r.name);
  const subject = `Aaira demo request from ${name}`;
  const body = [
    'Hello,',
    '',
    'I would like to request a demo of the Aaira Controls Framework.',
    '',
    `Name: ${name}`,
    `Email: ${oneLine(r.email)}`,
    `Company: ${oneLine(r.company) || '-'}`,
    '',
    'What I would like to see:',
    r.message.trim(),
  ].join('\r\n');
  return { subject, body };
}

/** mailto: URL for the request (subject and body percent-encoded). */
export function buildMailto(r: ContactRequest, to: string = CONTACT_EMAIL): string {
  const { subject, body } = composeEmail(r);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Direct Gmail web compose URL pre-filled with recipient, subject, and body. */
export function buildGmailUrl(r: ContactRequest, to: string = CONTACT_EMAIL): string {
  const { subject, body } = composeEmail(r);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Sends the contact request via FormSubmit AJAX endpoint and checks that `data.success` is actually true. */
export async function submitContactRequest(
  r: ContactRequest
): Promise<{ delivered: boolean; needsActivation?: boolean; message?: string }> {
  const { subject } = composeEmail(r);
  try {
    const res = await fetch(FORMSUBMIT_AJAX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        _replyto: oneLine(r.email),
        name: oneLine(r.name),
        email: oneLine(r.email),
        company: oneLine(r.company) || '-',
        message: r.message.trim(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
    const ok = res.ok && (data.success === true || data.success === 'true');
    if (ok) {
      return { delivered: true, message: data.message };
    }
    const needsActivation = typeof data.message === 'string' && /activation|activate/i.test(data.message);
    return { delivered: false, needsActivation, message: data.message };
  } catch (err) {
    return { delivered: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}
