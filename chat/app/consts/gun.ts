import {createGunInstance} from '@tinijs/toolbox/gun';

export type GunInstance = typeof GUN_INSTANCE;

const GUN_INSTANCE = createGunInstance();

export const GUN = GUN_INSTANCE.gun;
export const SEA = GUN_INSTANCE.sea;
export const GUN_USER = GUN_INSTANCE.gunUser

export default GUN_INSTANCE;
