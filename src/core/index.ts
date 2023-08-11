import { DefaultOptons, Options, TrackerConfig } from "../types/index";
import { createHistoryEvent } from "../utils/pv";

const MouseEventList: string[] = [
  "click",
  "dblclick",
  "contextmenu",
  "mousedown",
  "mouseup",
  "mouseenter",
  "mouseout",
  "mouseover",
];
let ip:String = '' 
let agent:String = ''
let titleName:String = ''
export default class Tracker {
  private data: Options;
  constructor(options: Options) {
    this.data = Object.assign(this.initDef(), options);
    this.installTracker();
  }
  private initDef(): DefaultOptons {
    window.history["pushState"] = createHistoryEvent("pushState");
    window.history["replaceState"] = createHistoryEvent("replaceState");
    return <DefaultOptons>{
      sdkVersion: TrackerConfig.version,
      historyTracker: false,
      domTracker: false,
      jsError: false,
      userAgent: false,
      userIP: false,
      title: false,
    };
  }
  //设置用户的id
  public setUserId<T extends DefaultOptons["uuid"]>(uuid: T) {
    this.data.uuid = uuid;
  }
  // 设置用户的额外信息 透传字段
  public setExtra<T extends DefaultOptons["extra"]>(extra: T) {
    this.data.extra = extra;
  }
  // 手动上报
  public sendReport<T>(data: T) {
    this.reportTracker(data);
  }
  // 监听js的错误
  private errorEvent() {
    // 监听window的error事件
    window.addEventListener("error", (e: any) => {
      this.reportTracker({
        event: "jsError",
        targetKey: "message",
        message: e.message,
        position: `${e.filename}:${e.lineno}:${e.colno}`,
        stack: e.error.stack,
      });
    });
  }
  // 监听promise的错误
  private promiseError() {
    // 监听window的unhandledrejection事件
    window.addEventListener("unhandledrejection", (e: any) => {
      this.reportTracker({
        event: "promiseError",
        targetKey: "message",
        message: e,
        position: `${e.filename}:${e.lineno}:${e.colno}`,
        stack: e.error.stack
      });
    });
  }
  // 监听dom的变化
  private targetKeyReport() {
    //将监听的事件绑定到window上
    MouseEventList.forEach((event) => {
      //监听document的事件
      window.addEventListener(event, (e: any) => {
        //获取到当前的dom节点
        const target = e.target as HTMLElement;
        //获取到当前dom节点的target-key属性
        const targetValue = target.getAttribute("target-key");
        //如果有这个属性
        if (targetValue) {
          console.log(targetValue, this.sendReport, "监听到了");
          //上报数据
          this.sendReport({ targetKey: targetValue, event });
        }
      });
    });
  }
  private captureEvents<T>(
    mouseEventList: string[],
    keyTracker: string,
    data?: T
  ) {
    //将监听的事件绑定到window上
    mouseEventList.forEach((event) => {
      window.addEventListener(event, function (this: any) {
        console.log(data, event, "监听到了");
        this.reportTracker({ data, event, targetKey: keyTracker });
      });
    });
  }
  //初始化这个监听路由的方法
  private installTracker() {
    //如果开启了路由监听
    if (this.data.historyTracker) {
      //监听路由的变化
      this.captureEvents(
        ["popstate", "pushState", "replaceState"],
        "history-v"
      );
    }
    // 如果开启了hash监听
    if (this.data.hashTracker) {
      //监听hash的变化
      this.captureEvents(["hashchange"], "hash-v");
    }
    // 如果开启了dom监听
    if (this.data.domTracker) {
      //监听dom的变化
      this.targetKeyReport();
    }
    // 如果开启了js错误监听
    if (this.data.jsError) {
      //监听js的错误
      this.errorEvent();
      this.promiseError();
    }
    if (this.data.userIP) {
      this.getUserIp();
    }
    if (this.data.userAgent) {
      agent = this.getUserAgent();
    }
    if (this.data.title) {
      this.getBrowsertitle();
    }
  }
  private reportTracker<T>(data: T) {
    console.log(data, "上报");
    const params = Object.assign(this.data, data, {
      ip: ip,
      agent: agent,
      title: titleName,
      time: new Date().getTime(),
    });
    const headers = { type: "application/json" };
    const blob = new Blob([JSON.stringify(params)], headers);
    navigator.sendBeacon(this.data.requestUrl, blob);
  }
  private getUserIp() {
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => {
        var ipAddress = data.ip;
        ip = ipAddress;
        console.log(ipAddress);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  private getUserAgent() {
    var userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") !== -1) {
      return "Chrome";
    } else if (userAgent.indexOf("Firefox") !== -1) {
      return "Firefox";
    } else if (userAgent.indexOf("Safari") !== -1) {
      return "Safari";
    } else if (
      userAgent.indexOf("Opera") !== -1 ||
      userAgent.indexOf("OPR") !== -1
    ) {
      return "Opera";
    } else if (userAgent.indexOf("Edge") !== -1) {
      return "Edge";
    } else if (
      userAgent.indexOf("MSIE") !== -1 ||
      userAgent.indexOf("Trident/") !== -1
    ) {
      return "Internet Explorer";
    } else {
      return "Unknown";
    }
  }
  private getBrowsertitle() {
    titleName = document.title;
  }
}
