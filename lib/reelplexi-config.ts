export class ReelplexiConfig {
  static get apiKey(): string {
    return (process.env.REELPLEXI_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim()
  }

  static get baseUrl(): string {
    return (process.env.REELPLEXI_BASE_URL || 'https://api.reelplexi.com').replace(/[^\x20-\x7E]/g, '').trim()
  }

  static get isConfigured(): boolean {
    return this.apiKey.length > 0
  }
}
