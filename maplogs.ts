import * as logs from './logs/wendys-rename-addresses.json';
import { each } from 'lodash';

let conflicts: any[] = [];
each(logs, (log: any, id: string) => {
  if (log.status !== 409) {
    conflicts.push({ ID: id, log });
  }
});
console.log(JSON.stringify(conflicts));
