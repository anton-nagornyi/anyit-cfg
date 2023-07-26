export type ConfigValueType =
  | 'integer'
  | 'float'
  | 'string'
  | 'boolean'
  | 'json';

export type ConfigDefinition<T = any> = {
  code?: string;
  default: T;
  type: ConfigValueType;
  envName?: string;
  tags?: string[];
};

export type ConfigItem<T = any> = ConfigDefinition<T> & {
  name: string;
  value: T;
};

export type ConfigDefinitions<T> = {
  [P in keyof T]: Exclude<keyof T[P], keyof ConfigDefinition<any>> extends never
    ? ConfigDefinition<any>
    : T[P] extends object
    ? ConfigDefinitions<T[P]>
    : never;
};

export type ConfigSettings<T> = {
  [P in keyof T]: T[P] extends { default: infer U }
    ? U
    : T[P] extends object
    ? ConfigSettings<T[P]>
    : never;
};
