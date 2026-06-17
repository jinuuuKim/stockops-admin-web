export interface SystemGeneralSettings {
  userCount: number
  centerCount: number
  warehouseCount: number
  productCount: number
  purchaseOrderCount: number
  bedrockEnabled: boolean
  vertexEnabled: boolean
  businessZone: string
  activeProfile: string
}

export interface BedrockIntegration {
  enabled: boolean
  region: string
  modelReference: string
  hasKnowledgeBase: boolean
  hasAgent: boolean
}

export interface VertexIntegration {
  enabled: boolean
  location: string
  modelId: string
  hasCredentials: boolean
}

export interface SystemIntegrations {
  bedrock: BedrockIntegration
  vertex: VertexIntegration
}
