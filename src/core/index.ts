import { DefaultOptons, Options, TrackerConfig } from '../types/index'
import { createHistoryEvent } from '../utils/pv'
export default class Tracker {
  private data: Options;
  constructor(options: Options) {
      this.data = Object.assign(this.initDef(), options)
      this.installTracker()
  }
  private initDef(): DefaultOptons{
    window.history['pushState'] = createHistoryEvent('pushState')
    window.history['replaceState'] = createHistoryEvent('replaceState')
    return<DefaultOptons> {
      sdkVersion: TrackerConfig.version,
      historyTracker: false,
      domTracker: false,
      jsError: false,
    }
  }
  //设置用户的id
  public setUserId<T extends DefaultOptons['uuid']>(uuid: T){
    this.data.uuid = uuid
  }
  // 设置用户的额外信息 透传字段
  public setExtra <T extends DefaultOptons['extra']>(extra: T){
    this.data.extra = extra
  }
  // 手动上报
  public sendReport<T>(data: T){
    this.reportTracker(data)
  }
  private captureEvents <T>(mouseEventList: string[], keyTracker: string, data?: T){
    //将监听的事件绑定到window上
    mouseEventList.forEach(event => {
      window.addEventListener(event, function(this: any){
        console.log(event, '监听到了')
        this.reportTracker(data)
      })
    })
  }
  //初始化这个监听路由的方法
  private installTracker(){
    //如果开启了路由监听
    if(this.data.historyTracker) {
      //监听路由的变化
      this.captureEvents(['popstate', 'pushState', 'replaceState'], 'history-v')
    }
    // 如果开启了hash监听
    if(this.data.hashTracker){
      //监听hash的变化
      this.captureEvents(['hashchange'], 'hash-v')
    }
  }
  private reportTracker<T>(data: T){
    console.log(data, '上报')
    const params = Object.assign(this.data, data, {time: new Date().getTime()})
    const headers = {type: 'application/json'}
    const blob = new Blob([JSON.stringify(params)], headers)
    navigator.sendBeacon(this.data.requestUrl, blob)
  }
}
