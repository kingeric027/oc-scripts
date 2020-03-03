import { User } from 'ordercloud-javascript-sdk';

interface AUserXP {}
export interface AUser extends User {
  xp: {
    AccessLevel: string;
    Permissions: Record<string, boolean>; // record is a dictionary: https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkt
    SalonCount: number;
    SalesOrg?: string; // at some point we should be able to count on this being present
    SalonTypes?: string[];
    Plants?: string[];
  };
}
