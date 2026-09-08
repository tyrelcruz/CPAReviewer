import emailjs from '@emailjs/nodejs'

const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } =
  process.env

// No EmailJS account configured locally by default — falls back to logging
// the code to the server console instead of failing outright. Set all four
// EMAILJS_* vars in .env to send real email (the private key specifically
// requires "Allow EmailJS API for non-browser applications" to be enabled in
// the EmailJS account's Security settings, or server-side sends are rejected).
const configured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY && EMAILJS_PRIVATE_KEY,
)

if (configured) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY, privateKey: EMAILJS_PRIVATE_KEY })
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!configured) {
    console.log(`[dev] EmailJS not configured — OTP for ${to}: ${code}`)
    return
  }

  // template_params keys must match the variables used in the EmailJS
  // template (to_email is also set as the template's "To Email" field).
  await emailjs.send(EMAILJS_SERVICE_ID!, EMAILJS_TEMPLATE_ID!, {
    to_email: to,
    otp_code: code,
  })
}
