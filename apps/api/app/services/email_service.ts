interface EmailOptions {
  to: string
  subject: string
  text: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📧 ─────────────────────────────────────')
    console.log(`To:      ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`─────────────────────────────────────────`)
    console.log(options.text)
    console.log('─────────────────────────────────────────\n')
    return
  }

  // TODO: production email (Resend/SMTP)
  throw new Error('Production email not configured')
}
