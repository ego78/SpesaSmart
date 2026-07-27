export class NotificationService {
  constructor(events){this.events=events}
  show(message,{tone='info',timeout=3500}={}){const payload={message:String(message||''),tone,timeout,at:Date.now()};this.events?.emit('notification:show',payload);return payload}
}
