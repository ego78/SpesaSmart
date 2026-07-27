import{appEvents}from'./event-bus.js';
import{AppStore}from'./store.js';
import{createLogger}from'./logger.js';
import{appCache}from'../services/cache-service.js';
import{performanceMonitor}from'../services/performance-monitor.js';
import{NotificationService}from'../services/notification-service.js';
import{supermarketPlugins}from'../plugins/registry.js';
import{createDefaultRules}from'../rules/rule-engine.js';
const production=!['localhost','127.0.0.1'].includes(location.hostname);
export const appStore=new AppStore({products:[],pantry:[],receipts:[],offers:[],stores:[],settings:{}},appEvents);
export const logger=createLogger({level:production?'warn':'debug'});
export const notifications=new NotificationService(appEvents);
export const rules=createDefaultRules();
export const kernel={events:appEvents,store:appStore,cache:appCache,performance:performanceMonitor,notifications,plugins:supermarketPlugins,rules};
export function syncKernelState(partial,source='legacy-bridge'){return appStore.patch(partial,{source})}
