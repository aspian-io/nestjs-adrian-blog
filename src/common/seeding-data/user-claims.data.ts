import { PermissionsEnum } from "../security/permissions.enum";

export const claimData = Object.values( PermissionsEnum ).map( v => { return { name: v }; } );