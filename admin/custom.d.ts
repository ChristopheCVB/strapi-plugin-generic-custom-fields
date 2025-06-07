declare module '@strapi/design-system/*';
declare module '@strapi/design-system';

declare type SerializableKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [K in keyof T]: T[K] extends Function | Promise<unknown> ? never : K
}[keyof T]

declare type PickSerializable<T> = Pick<T, SerializableKeys<T>>
