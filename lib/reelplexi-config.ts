export class ReelplexiConfig {
  static get apiKey(): string {
    return process.env.REELPLEXI_API_KEY || ''
  }

  static get baseUrl(): string {
    return process.env.REELPLEXI_BASE_URL || 'https://api.reelplexi.com'
  }

  static get isConfigured(): boolean {
    return this.apiKey.length > 0
  }
}
