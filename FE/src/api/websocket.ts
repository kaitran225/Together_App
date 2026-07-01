type MessageCallback = (body: any) => void

export class StompClient {
  private ws: WebSocket | null = null
  private connected = false
  private subscriptions = new Map<string, { destination: string; callback: MessageCallback }>()
  private subCounter = 0
  private connectPromise: Promise<void> | null = null
  private onConnectCallbacks: (() => void)[] = []

  constructor(private url: string) {}

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)
      } catch (err) {
        reject(err)
        return
      }

      this.ws.onopen = () => {
        const connectFrame = `CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\0`
        this.ws?.send(connectFrame)
      }

      this.ws.onmessage = (event) => {
        const frameStr = event.data as string
        const lines = frameStr.split('\n')
        const command = lines[0].trim()

        if (command === 'CONNECTED') {
          this.connected = true
          resolve()
          this.onConnectCallbacks.forEach((cb) => cb())
          this.onConnectCallbacks = []
          // Resubscribe if reconnected
          this.subscriptions.forEach((sub, id) => {
            this.sendSubscribe(id, sub.destination)
          })
        } else if (command === 'MESSAGE') {
          // Parse headers and body
          let bodyIndex = -1
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') {
              bodyIndex = i + 1
              break
            }
          }
          if (bodyIndex !== -1) {
            const bodyStr = lines.slice(bodyIndex).join('\n').replace(/\0$/, '').trim()
            let parsed = bodyStr
            try {
              parsed = JSON.parse(bodyStr)
            } catch {
              // fallback
            }
            // Find subscription id from headers
            let subId = ''
            for (let i = 1; i < bodyIndex - 1; i++) {
              const parts = lines[i].split(':')
              if (parts[0].trim() === 'subscription') {
                subId = parts[1].trim()
                break
              }
            }
            if (subId) {
              const sub = this.subscriptions.get(subId)
              if (sub) {
                sub.callback(parsed)
              }
            }
          }
        }
      }

      this.ws.onclose = () => {
        this.connected = false
        this.connectPromise = null
      }

      this.ws.onerror = (err) => {
        reject(err)
      }
    })

    return this.connectPromise
  }

  private sendSubscribe(id: string, destination: string) {
    const frame = `SUBSCRIBE\nid:${id}\ndestination:${destination}\n\n\0`
    this.ws?.send(frame)
  }

  subscribe(destination: string, callback: MessageCallback): string {
    const id = `sub-${this.subCounter++}`
    this.subscriptions.set(id, { destination, callback })
    if (this.connected) {
      this.sendSubscribe(id, destination)
    }
    return id
  }

  unsubscribe(id: string) {
    const sub = this.subscriptions.get(id)
    if (sub) {
      if (this.connected) {
        const frame = `UNSUBSCRIBE\nid:${id}\n\n\0`
        this.ws?.send(frame)
      }
      this.subscriptions.delete(id)
    }
  }

  send(destination: string, body: any) {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    const frame = `SEND\ndestination:${destination}\ncontent-type:application/json\ncontent-length:${bodyStr.length}\n\n${bodyStr}\0`
    if (this.connected) {
      this.ws?.send(frame)
    } else {
      this.onConnectCallbacks.push(() => {
        this.ws?.send(frame)
      })
      void this.connect()
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
    this.connectPromise = null
    this.subscriptions.clear()
  }
}
