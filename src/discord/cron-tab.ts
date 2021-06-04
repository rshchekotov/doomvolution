import { Logger } from '@/services/logger.service';
import * as cron from 'node-cron';

let functions: {
    [module: string]: {[id: string]: {
        time: string,
        action: () => Promise<void>
    }}
} = {};

let schedules: {
    [module: string]: {[id: string]: cron.ScheduledTask}
} = {};

export function timer(s: number) {
    let time: Date = new Date(Date.now() + s*1000);
    return `${time.getSeconds()} ${time.getMinutes()} ${time.getHours()} ${time.getDate()} ${time.getMonth()+1} *`;
}

export function getScheduledFunction(module: string, id: string) {
    return functions[module][id].action;
}

export function addSchedule(module: string, id: string, time: string, action: () => Promise<void>) {
    Logger.debug(`Added Schedule for ${module}/${id} and time: '${time}'`);
    if(!functions[module]) functions[module] = {};
    if(!schedules[module]) schedules[module] = {};
    functions[module][id] = { time: time, action: action }; // Load Action into Cache
    if(schedules[module][id]) schedules[module][id].stop();
    schedules[module][id] = cron.schedule(time, action);
}

export function reloadSchedules(module?: string) {
    const reloadModule = (module: string) => {
        for(let schedule in schedules[module]) {
            schedules[module][schedule].stop();
            delete schedules[module][schedule];
        }

        for(let func in functions[module]) {
            let o = functions[module][func];
            schedules[module][func] = cron.schedule(o.time, o.action);
        }
    };

    for(let mod in (module ? [module] : schedules))
        reloadModule(mod);
}