/**
 * Role → webhook channel mapping types (used for notice/announcement routing).
 *
 * @author StockOps Team
 * @since 2.3
 */

export interface RoleWebhookConfig {
  id: number
  role: string
  providerType: string
  enabled: boolean
}

export interface RoleWebhookConfigRequest {
  role: string
  providerType?: string
  webhookUrl: string
  enabled?: boolean
}
