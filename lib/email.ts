/**
 * Jednostavan wrapper za slanje emaila preko Resend (resend.com).
 *
 * Dok RESEND_API_KEY nije postavljen u environment varijablama, poveznica
 * za reset lozinke se samo ispisuje u server log (vidljivo u Vercel
 * Function Logs / lokalnom terminalu), NE prikazuje se korisniku koji
 * traži reset — to bi omogućilo napadaču da otkrije postoji li email u
 * bazi i odmah dobije link za preuzimanje računa. Ovo je privremeno
 * rješenje dok se ne postavi pravi email servis.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email fallback] RESEND_API_KEY nije postavljen. Link za reset lozinke za ${to}:\n${resetUrl}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "Dubrovnik Grand Prix <onboarding@resend.dev>",
      to,
      subject: "Resetiranje lozinke — Dubrovnik Grand Prix",
      html: `
        <p>Zatražen je reset lozinke za tvoj račun na Dubrovnik Grand Prix stranici.</p>
        <p><a href="${resetUrl}">Klikni ovdje za postavljanje nove lozinke</a> (link vrijedi 1 sat).</p>
        <p>Ako nisi ti tražio/la reset, slobodno zanemari ovaj email.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend API greška:", res.status, body);
    throw new Error("Slanje emaila nije uspjelo.");
  }
}

/**
 * Šalje igraču njegov pristupni kod.
 *
 * Kod se prikazuje i u adminu pri generiranju, pa se može poslati i drugim
 * putem (npr. WhatsAppom). Ova funkcija pokriva slučaj kad klub ima adresu
 * e-pošte igrača.
 */
export async function sendLinkCodeEmail(
  to: string,
  playerName: string,
  code: string,
  registerUrl: string
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email fallback] RESEND_API_KEY nije postavljen. Pristupni kod za ${playerName} <${to}>: ${code}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.RESEND_FROM_EMAIL ??
        "Dubrovnik Grand Prix <onboarding@resend.dev>",
      to,
      subject: "Tvoj pristupni kod — Dubrovnik Grand Prix",
      html: `
        <p>Pozdrav ${playerName},</p>
        <p>Na stranici Dubrovnik Grand Prixa možeš pratiti svoje rezultate i
           prijavljivati se na turnire. Za povezivanje s tvojim igračkim
           profilom upotrijebi ovaj kod pri registraciji:</p>
        <p style="font-size:20px;font-family:monospace;letter-spacing:2px;">
          <strong>${code}</strong>
        </p>
        <p><a href="${registerUrl}">Otvori registraciju</a></p>
        <p>Kod vrijedi jednokratno. Ako ga netko drugi upotrijebi prije tebe,
           javi se klubu i dobit ćeš novi.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend API greška:", res.status, body);
    throw new Error("Slanje emaila nije uspjelo.");
  }
}
