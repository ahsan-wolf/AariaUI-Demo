import type { BaseValidatorController } from "./base-validator.js";
export type ControlValueAccessor = () => unknown;
export type GlobalValueResolver = (controlId: string) => unknown;
export declare class ValidatorManager {
    private static readonly validators;
    private static readonly accessors;
    static globalValueResolver?: GlobalValueResolver | undefined;
    static register(validator: BaseValidatorController): void;
    static unregister(validator: BaseValidatorController): void;
    static registerValueAccessor(controlId: string, accessor: ControlValueAccessor): () => void;
    static getControlValue(controlId: string): unknown;
    static getValidators(validationGroup?: string | undefined): BaseValidatorController[];
    static getInvalidValidators(validationGroup?: string | undefined): BaseValidatorController[];
    static validate(validationGroup?: string | undefined): Promise<boolean>;
    static isValid(validationGroup?: string | undefined): boolean;
    static reset(validationGroup?: string | undefined): void;
    static clear(): void;
}
