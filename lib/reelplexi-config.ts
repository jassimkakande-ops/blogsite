export class ReelplexiConfig {
  // Strip non-printable characters and trim whitespace — exactly as streamit does.
  // This prevents 403s caused by invisible chars copied into the env file.
  static get apiKey(): string {
    return (process.env.REELPLEXI_API_KEY || process.env.NEXT_PUBLIC_REELPLEXI_API_KEY || '')
      .replace(/[^\x20-\x7E]/g, '')
      .trim()
  }

  static get baseUrl(): string {
    return process.env.REELPLEXI_BASE_URL || 'https://api.reelplexi.com'
  }

  static get isConfigured(): boolean {
    return this.apiKey.length > 0
  }
}
