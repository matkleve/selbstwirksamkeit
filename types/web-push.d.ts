declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string }
  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: Record<string, unknown>,
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>

  const webpush: {
    setVapidDetails: typeof setVapidDetails
    generateVAPIDKeys: typeof generateVAPIDKeys
    sendNotification: typeof sendNotification
  }
  export default webpush
}
